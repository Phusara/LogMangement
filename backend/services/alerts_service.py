from datetime import datetime, timedelta
from typing import Dict, Optional
from collections import defaultdict, deque
from fastapi import HTTPException
from sqlalchemy.orm import Session
import entity.models as models
from utils.datetime_helpers import format_datetime_utc


# Alert failed login section
failed_login_attempts: Dict[str, deque] = defaultdict(lambda: deque(maxlen=10))


def check_failed_login_threshold(ip: str, threshold: int = 5, window_minutes: int = 5) -> bool:
    """Check if IP has exceeded failed login threshold within time window"""
    now = datetime.utcnow()
    cutoff = now - timedelta(minutes=window_minutes)
    
    # Remove old attempts outside the time window
    attempts = failed_login_attempts[ip]
    while attempts and attempts[0] < cutoff:
        attempts.popleft()
    
    # Check if threshold exceeded
    if len(attempts) >= threshold:
        return True
    
    # Add current failed attempt
    attempts.append(now)
    return False


def create_alert_log(ip: str, username: str, user_id: Optional[int], db: Session):
    """Create an alert log for suspicious login activity"""
    
    # If no user_id, cannot create alert
    if not user_id:
        raise HTTPException(status_code=500, detail="Cannot create alert: user not found")
    
    # Get user to check their role
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=500, detail="User not found")
    
    # Dynamic mapping based on role
    if user.role == "admin":
        # Look up admin_id from admin table
        admin = db.query(models.Admin).filter(models.Admin.user_id == user_id).first()
        if not admin:
            raise HTTPException(status_code=500, detail="Admin entry not found")
        tenant_id = admin.admin_id
    else:  # role == "tenant"
        # Look up tenant_id from tenants table
        tenant = db.query(models.tenant).filter(models.tenant.user_id == user_id).first()
        if not tenant:
            raise HTTPException(status_code=500, detail="Tenant entry not found")
        tenant_id = tenant.tenant_id
    
    alert_log = models.Log(
        tenant_id=tenant_id,  # Dynamic: admin_id for admins, tenant_id for tenants
        timestamp=datetime.utcnow(),
        tenant=username,
        source="security",
        event_type="alert",
        severity=5,
        action="blocked",
        tags=["brute_force", "login_failure"],
        src_ip=ip,
        host="system"
    )
    db.add(alert_log)
    db.flush()

    alert_entry = models.Alert(
        user_id=user_id,
        log_id=alert_log.id,
        alert=f"Multiple failed login attempts from IP {ip} for user {username}"
    )
    db.add(alert_entry)
    db.commit()
    print(f"🚨 ALERT: Multiple failed logins from {ip} for {user.role} user '{username}'")


def get_alerts_service(db: Session, current_user: dict):
    """
    Get alerts based on user role:
    - Admin: See all alerts
    - Tenant: See only their own alerts
    """
    
    # Start with base query
    query = db.query(models.Alert).join(
        models.Log, models.Alert.log_id == models.Log.id
    )
    
    # Filter based on role
    if current_user["role"] == "tenant":
        # Tenant can only see their own alerts
        query = query.filter(models.Alert.user_id == current_user["id"])
    # Admin sees everything (no filter needed)
    
    # Get alerts ordered by most recent first
    alerts = query.order_by(models.Alert.alert_id.desc()).all()
    
    # Format response
    result = []
    for alert in alerts:
        log = db.query(models.Log).filter(models.Log.id == alert.log_id).first()
        # Use log timestamp as occurred_at (or alert timestamp if log doesn't exist)
        occurred_at = format_datetime_utc(log.timestamp if log else alert.timestamp)
        result.append({
            "alert_id": alert.alert_id,
            "user_id": alert.user_id,
            "alert": alert.alert,
            "occurred_at": occurred_at,  # Add explicit occurred_at for frontend
            "timestamp": occurred_at,  # Also include as timestamp for compatibility
            "log": {
                "id": log.id,
                "timestamp": format_datetime_utc(log.timestamp),
                "tenant": log.tenant,
                "source": log.source,
                "event_type": log.event_type,
                "severity": log.severity,
                "action": log.action,
                "src_ip": log.src_ip,
                "tags": log.tags,
            } if log else None
        })
    
    return {
        "user": current_user["username"],
        "role": current_user["role"],
        "total_alerts": len(result),
        "alerts": result
    }
