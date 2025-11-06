from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from dependencies import get_db, get_current_user
from services.alerts_service import get_alerts_service


router = APIRouter(tags=["Alerts"])


@router.get("/alerts")
def get_alerts(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get alerts based on user role:
    - Admin: See all alerts
    - Tenant: See only their own alerts
    """
    return get_alerts_service(db, current_user)
