from sqlalchemy import Column, Integer, String, DateTime, ARRAY, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import INET, JSONB
from database import Base
import enum 

class UserRole(str, enum.Enum):
    admin = "admin"
    tenant = "tenant"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(Text, nullable=False)
    password = Column(String(20), nullable=False)
    role = Column(SQLEnum(UserRole, name='user_role'), nullable=False, default=UserRole.tenant)
    created_at = Column(DateTime)

class Admin(Base):
    __tablename__ = "admin"
    
    admin_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    name = Column(String(50), unique=True, nullable=False)
    timestamp = Column(DateTime)

class tenant(Base):
    __tablename__ = "tenants"
    
    tenant_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    name = Column(String(50), unique=True, nullable=False)
    timestamp = Column(DateTime)

class Log(Base):
    __tablename__ = "logs"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime)
    tenant = Column(Text)
    source = Column(Text)
    vendor = Column(Text)
    product = Column(Text)
    event_type = Column(Text)
    event_subtype = Column(Text)
    severity = Column(Integer)
    action = Column(Text)
    src_ip = Column(INET)
    src_port = Column(Integer)
    dst_ip = Column(INET)
    dst_port = Column(Integer)
    protocol = Column(Text)
    user = Column(Text)
    host = Column(Text)
    process = Column(Text)
    url = Column(Text)
    http_method = Column(Text)
    status_code = Column(Integer)
    rule_name = Column(Text)
    rule_id = Column(Text)
    cloud_account_id = Column(Text)
    cloud_region = Column(Text)
    cloud_service = Column(Text)
    raw = Column(JSONB)
    tags = Column(ARRAY(Text))

class Alert(Base):
    __tablename__ = "alert"
    
    alert_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    log_id = Column(Integer, nullable=False)
    alert = Column(Text)
    timestamp = Column(DateTime)