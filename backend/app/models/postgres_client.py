import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Date, Enum as SQLEnum, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
import enum
import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/aegisaml")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class GenderEnum(enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"

class RiskEnum(enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class KYCEnum(enum.Enum):
    VERIFIED = "VERIFIED"
    PENDING = "PENDING"
    REJECTED = "REJECTED"

class CustomerTypeEnum(enum.Enum):
    INDIVIDUAL = "INDIVIDUAL"
    BUSINESS = "BUSINESS"

class Customer(Base):
    __tablename__ = "customers"
    
    customer_id = Column(String, primary_key=True, index=True)
    full_name = Column(String)
    age = Column(Integer)
    gender = Column(SQLEnum(GenderEnum))
    occupation = Column(String)
    annual_income = Column(Float)
    risk_category = Column(SQLEnum(RiskEnum))
    country = Column(String)
    city = Column(String)
    KYC_level = Column(SQLEnum(KYCEnum))
    pep_flag = Column(Boolean)
    sanctions_flag = Column(Boolean)
    account_open_date = Column(Date)
    customer_type = Column(SQLEnum(CustomerTypeEnum))
    expected_monthly_txn = Column(Float)
    avg_balance = Column(Float)
    device_count = Column(Integer)
    ip_country = Column(String)
    branch_id = Column(String)

class Account(Base):
    __tablename__ = "accounts"

    account_id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, index=True)
    account_type = Column(String)
    currency = Column(String)
    balance = Column(Float)
    status = Column(String)
    opened_date = Column(Date)

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String, primary_key=True, index=True)
    sender_account = Column(String, index=True)
    receiver_account = Column(String, index=True)
    amount = Column(Float)
    currency = Column(String)
    timestamp = Column(DateTime, index=True)
    merchant = Column(String)
    merchant_category = Column(String)
    payment_channel = Column(String)
    transaction_type = Column(String)
    branch = Column(String)
    country = Column(String)
    city = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    device_id = Column(String)
    ip_address = Column(String)
    session_id = Column(String)
    beneficiary_age_days = Column(Integer)
    is_cash = Column(Boolean)
    atm_id = Column(String)
    wallet_type = Column(String)
    geo_distance_last_txn = Column(Float)
    time_since_last_txn = Column(Float)
    fx_rate = Column(Float)
    narrative = Column(String)
    label = Column(String) # For evaluation

class InvestigationCase(Base):
    __tablename__ = "investigation_cases"

    case_id = Column(String, primary_key=True, index=True)
    entity_id = Column(String, index=True)
    risk_level = Column(String)
    trigger_event = Column(String)
    status = Column(String)
    opened_date = Column(DateTime)
    last_updated = Column(DateTime)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
