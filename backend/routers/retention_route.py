from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from services import retention_service
from sqlalchemy import func, text
from entity.models import Log, Alert

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/retention/delete-old-data/", tags=["Retention"])
def delete_old_data_endpoint(days: int = 7, db: Session = Depends(get_db)):
    """
    Manually trigger the deletion of logs and alerts older than a specified number of days.
    """
    try:
        deleted_counts = retention_service.delete_old_data(db, days)
        db.commit()
        return {"message": f"Data deletion process completed. {deleted_counts['logs']} logs and {deleted_counts['alerts']} alerts deleted."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

def get_table_storage(db: Session, table_name: str):
    try:
        query = text(f"SELECT pg_total_relation_size('{table_name}')")
        total_size_bytes = db.execute(query).scalar()
        
        if total_size_bytes is None:
            return "0 bytes"

        if total_size_bytes < 1024:
            return f"{total_size_bytes} bytes"
        elif total_size_bytes < 1024**2:
            return f"{total_size_bytes/1024:.2f} KB"
        elif total_size_bytes < 1024**3:
            return f"{total_size_bytes/1024**2:.2f} MB"
        else:
            return f"{total_size_bytes/1024**3:.2f} GB"
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/retention/logs-storage/", tags=["Retention"])
def get_logs_storage(db: Session = Depends(get_db)):
    """
    Get the total storage size of the logs table.
    """
    return {"table": "logs", "total_storage": get_table_storage(db, "logs")}

@router.get("/retention/alerts-storage/", tags=["Retention"])
def get_alerts_storage(db: Session = Depends(get_db)):
    """
    Get the total storage size of the alerts table.
    """
    return {"table": "alert", "total_storage": get_table_storage(db, "alert")}
