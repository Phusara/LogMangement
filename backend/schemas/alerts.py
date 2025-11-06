from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AlertResponse(BaseModel):
    alert_id: int
    user_id: int
    alert: str
    log: Optional[dict] = None


class AlertsListResponse(BaseModel):
    user: str
    role: str
    total_alerts: int
    alerts: list[AlertResponse]
