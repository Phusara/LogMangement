from typing import Optional, List
from sqlalchemy.orm import Session
from schemas.logs import LogEntry
from utils.log_extractors import LOG_FIELD_EXTRACTORS
import entity.models as models


def get_tenant_id(tenant_name: str, db: Session) -> Optional[int]:
    """Helper function to get tenant_id from tenant name"""
    tenant = db.query(models.tenant).filter(models.tenant.name == tenant_name).first()
    return tenant.tenant_id if tenant else None


def save_log(log: LogEntry, db: Session):
    """Save a log entry to the database"""
    # Get tenant_id
    tenant_id = get_tenant_id(log.tenant, db) if log.tenant else None
    
    if not tenant_id:
        print(f"Warning: Tenant '{log.tenant}' not found, skipping log")
        return None
    
    # Create base log entry
    db_log = models.Log(
        tenant_id=tenant_id,
        timestamp=log.timestamp,
        tenant=log.tenant,
        source=log.source,
        event_type=log.event_type,
        severity=log.severity,
        action=log.action,
        tags=log.tags,
        raw=log.raw
    )
    
    # Extract and set type-specific fields
    log_type = type(log)
    if log_type in LOG_FIELD_EXTRACTORS:
        specific_fields = LOG_FIELD_EXTRACTORS[log_type](log)
        for field, value in specific_fields.items():
            setattr(db_log, field, value)
    
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


def ingest_logs_service(logs: List[LogEntry], db: Session):
    """Ingest multiple log entries"""
    print(f"Received {len(logs)} logs")
    saved_count = 0
    failed_count = 0
    
    for log in logs:
        print(f"Log type: {log.source}")
        print(log.model_dump(mode='json'))
        
        try:
            result = save_log(log, db)
            if result:
                saved_count += 1
                print(f"✓ Saved {log.source} log (ID: {result.id})")
            else:
                failed_count += 1
                
        except Exception as e:
            print(f"✗ Error saving log: {e}")
            db.rollback()
            failed_count += 1
    
    return {
        "status": "ok", 
        "processed": len(logs), 
        "saved": saved_count,
        "failed": failed_count
    }
