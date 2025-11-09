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
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        logger.info(f"Starting cleanup for data older than {cutoff_date}")

        # Delete old alerts - COUNT BEFORE DELETE
        alerts_to_delete_query = db.query(Alert).filter(Alert.timestamp < cutoff_date)
        num_alerts_to_delete = alerts_to_delete_query.count()

        if num_alerts_to_delete > 0:
            alerts_to_delete_query.delete(synchronize_session=False)
            logger.info(f"Successfully deleted {num_alerts_to_delete} alerts older than {days} days.")
        else:
            logger.info(f"No alerts older than {days} days found to delete.")

        # Delete old logs - COUNT BEFORE DELETE
        logs_to_delete_query = db.query(Log).filter(Log.timestamp < cutoff_date)
        num_logs_to_delete = logs_to_delete_query.count()
        
        if num_logs_to_delete > 0:
            logs_to_delete_query.delete(synchronize_session=False)
            logger.info(f"Successfully deleted {num_logs_to_delete} logs older than {days} days.")
        else:
            logger.info(f"No logs older than {days} days found to delete.")

        # COMMIT ONCE at the end
        db.commit()

        # Return counts
        return {
            'logs_deleted': num_logs_to_delete,
            'alerts_deleted': num_alerts_to_delete,
            'cutoff_date': cutoff_date.isoformat()
        }
            
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting old data: {e}")
        raise
