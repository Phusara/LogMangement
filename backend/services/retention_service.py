from sqlalchemy.orm import Session
from entity.models import Log, Alert
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def delete_old_data(db: Session, days: int = 7):
    """
    Deletes logs and alerts older than a specified number of days.
    """
    try:
        seven_days_ago = datetime.utcnow() - timedelta(days=days)
        
        # Delete old logs
        logs_to_delete_query = db.query(Log).filter(Log.timestamp < seven_days_ago)
        num_logs_to_delete = logs_to_delete_query.count()
        
        if num_logs_to_delete > 0:
            logs_to_delete_query.delete(synchronize_session=False)
            db.commit()
            logger.info(f"Successfully deleted {num_logs_to_delete} logs older than {days} days.")
        else:
            logger.info(f"No logs older than {days} days found to delete.")

        # Delete old alerts
        alerts_to_delete_query = db.query(Alert).filter(Alert.timestamp < seven_days_ago)
        num_alerts_to_delete = alerts_to_delete_query.count()

        if num_alerts_to_delete > 0:
            alerts_to_delete_query.delete(synchronize_session=False)
            db.commit()
            logger.info(f"Successfully deleted {num_alerts_to_delete} alerts older than {days} days.")
        else:
            logger.info(f"No alerts older than {days} days found to delete.")
            
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting old data: {e}")
        
    finally:
        db.close()
