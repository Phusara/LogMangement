from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Union, Annotated, Literal, Any
from datetime import datetime


class BaseLog(BaseModel):
    timestamp: datetime = Field(..., alias='@timestamp')
    tenant: Optional[str] = None
    source: Optional[str] = None
    event_type: str 
    severity: Optional[int] = None
    action: Optional[str] = None
    tags: Optional[List[str]] = None
    raw: Optional[Dict[str, Any]] = None
    log_source: Optional[str] = None


class FirewallLog(BaseLog):
    source: Literal["firewall"] = "firewall"  # Discriminator value
    vendor: Optional[str]
    product: Optional[str]
    source_ip: str
    source_port: Optional[int]
    dest_ip: str
    dest_port: Optional[int]
    protocol: Optional[str]
    blocked: Optional[bool] = None
    rule_name: Optional[str] = Field(None, alias='policy')
    rule_id: Optional[str] = None
    host: Optional[str] = None
    hostname: Optional[str] = None
    facility: Optional[str] = None
    msg: Optional[str] = None


class NetworkLog(BaseLog):
    source: Literal["network"] = "network"  # Discriminator value
    host: Optional[str] = None
    hostname: Optional[str] = None
    interface: Optional[str] = None  # เช่น ge-0/0/1
    mac: Optional[str] = None
    reason: Optional[str] = None
    facility: Optional[str] = None
    message: Optional[str] = None
    source_ip: Optional[str] = None
    source_type: Optional[str] = None
    appname: Optional[str] = None  # Contains interface info


class APILog(BaseLog):
    source: Literal["api"] = "api"  # Discriminator value
    user: str
    ip: str
    reason: Optional[str] = None
    url: Optional[str] = None
    received_at: Optional[datetime] = None


class M365Log(BaseLog):
    source: Literal["m365"] = "m365"  # Discriminator value
    user: str
    ip: Optional[str]
    status: Optional[str]
    workload: Optional[str]


class CrowdStrikeLog(BaseLog):
    source: Literal["crowdstrike"] = "crowdstrike"  # Discriminator value
    host: str
    process: str
    sha256: Optional[str]


class AWSLog(BaseLog):
    source: Literal["aws"] = "aws"
    user: str
    service: str
    account_id: str
    region: Optional[str]


class ADLog(BaseLog):
    source: Literal["ad"] = "ad"
    event_id: Optional[int]
    user: str
    host: Optional[str]
    ip: Optional[str]
    logon_type: Optional[int]


LogEntry = Annotated[
    Union[NetworkLog, APILog, FirewallLog, M365Log, CrowdStrikeLog, AWSLog, ADLog],
    Field(discriminator='source')
]
