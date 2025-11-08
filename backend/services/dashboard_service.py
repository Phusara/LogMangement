from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from collections import Counter, defaultdict
from fastapi import HTTPException
import entity.models as models
from utils.datetime_helpers import format_datetime_utc


def get_dashboard_data(
    tenant: Optional[str],
    source: Optional[str],
    start_dt: Optional[datetime],
    end_dt: Optional[datetime],
    db: Session,
    current_user: Dict[str, Any]
):
    """Get dashboard data with filtering"""
    
    if start_dt and end_dt and end_dt < start_dt:
        raise HTTPException(status_code=400, detail="end must be after start")

    query = db.query(models.Log)

    # IMPORTANT: If user is a tenant (not admin), restrict to their own data only
    if current_user.get("role") == "tenant":
        # Get the tenant's name from the database
        user_tenant = db.query(models.tenant).filter(
            models.tenant.user_id == current_user["id"]
        ).first()
        
        if not user_tenant:
            raise HTTPException(status_code=403, detail="Tenant not found")
        
        # Force filter to only show this tenant's logs
        query = query.filter(models.Log.tenant == user_tenant.name)
    else:
        # Admin can filter by tenant parameter
        if tenant and tenant.lower() != "all":
            query = query.filter(models.Log.tenant == tenant)

    if source and source.lower() != "all":
        query = query.filter(models.Log.source == source)

    if start_dt:
        query = query.filter(models.Log.timestamp >= start_dt)
    if end_dt:
        query = query.filter(models.Log.timestamp <= end_dt)

    logs = query.order_by(models.Log.timestamp.desc()).all()

    total_events = len(logs)
    unique_users = len({log.user for log in logs if getattr(log, "user", None)})
    unique_ips = len({getattr(log, "src_ip", None) for log in logs if getattr(log, "src_ip", None)})
    error_events = sum(1 for log in logs if getattr(log, "event_type", "").lower() == "error")

    ip_counter = Counter(getattr(log, "src_ip", None) for log in logs if getattr(log, "src_ip", None))
    user_counter = Counter(getattr(log, "user", None) for log in logs if getattr(log, "user", None))
    event_counter = Counter(getattr(log, "event_type", None) for log in logs if getattr(log, "event_type", None))

    timeline = defaultdict(int)
    for log in logs:
        if log.timestamp:
            bucket_dt = log.timestamp.replace(minute=0, second=0, microsecond=0)
            bucket = format_datetime_utc(bucket_dt)
            if bucket:
                timeline[bucket] += 1

    def serialize_counter(counter: Counter, limit: int = 5):
        return [{"label": label, "count": count} for label, count in counter.most_common(limit)]

    def serialize_log(log):
        return {
            "id": log.id,
            "timestamp": format_datetime_utc(log.timestamp),
            "tenant": log.tenant,
            "source": log.source,
            "event_type": log.event_type,
            "severity": log.severity,
            "action": log.action,
            "tags": log.tags,
            "src_ip": getattr(log, "src_ip", None),
            "dst_ip": getattr(log, "dst_ip", None),
            "user": getattr(log, "user", None),
            "host": getattr(log, "host", None),
            "raw": log.raw,
        }

    # Add this: Get all tenants if admin
    tenants_list = []
    if current_user.get("role") == "admin":
        tenants_query = db.query(models.Log.tenant).distinct()
        tenants_list = [t[0] for t in tenants_query.order_by(models.Log.tenant).all()]  # Sorted alphabetically

    return {
        "filters": {
            "tenant": tenant or "all",
            "source": source or "all",
            "start": format_datetime_utc(start_dt),
            "end": format_datetime_utc(end_dt),
        },
        "summary": {
            "total_events": total_events,
            "unique_users": unique_users,
            "unique_ips": unique_ips,
            "errors": error_events,
        },
        "timeline": [{"bucket": bucket, "count": count} for bucket, count in sorted(timeline.items())],
        "top": {
            "ip_addresses": serialize_counter(ip_counter),
            "users": serialize_counter(user_counter),
            "event_types": serialize_counter(event_counter),
        },
        "logs": [serialize_log(log) for log in logs],
        "tenants": tenants_list if current_user.get("role") == "admin" else None,  # Add this
    }
