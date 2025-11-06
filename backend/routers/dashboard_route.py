from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from dependencies import get_db, get_current_user
from services.dashboard_service import get_dashboard_data
from utils.datetime_helpers import parse_datetime

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
def get_dashboard(
    tenant: Optional[str] = Query(None),  # FIXED: Changed from Query("all")
    source: Optional[str] = Query(None),  # FIXED: Changed from Query("all")
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get dashboard data with optional filters"""

    # Parse datetime strings
    start_dt = parse_datetime(start) if start else None
    end_dt = parse_datetime(end) if end else None

    # Call service layer
    return get_dashboard_data(
        tenant=tenant,
        source=source,
        start_dt=start_dt,
        end_dt=end_dt,
        db=db,
        current_user=current_user,
    )
