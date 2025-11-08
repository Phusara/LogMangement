from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone


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

class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda value: value.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        }