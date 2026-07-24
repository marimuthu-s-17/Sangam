from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import date, datetime
from typing import Optional
from models.member import MemberStatus
import re


class MemberCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Member's full name")
    phone: str = Field(..., description="Phone number")
    age: int = Field(..., ge=18, le=100, description="Age")
    gender: Optional[str] = Field(None, max_length=50, description="Gender")
    address: Optional[str] = Field(None, description="Residential address")
    status: MemberStatus = Field(default=MemberStatus.ACTIVE, description="Member status")
    joined_date: Optional[date] = Field(default=None, description="Date of joining")
    notes: Optional[str] = Field(None, description="Notes")

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        cleaned = re.sub(r'[\s\-()]+', '', v)
        pattern = r'^(?:\+?91|0)?[6-9]\d{9}$'
        if not re.match(pattern, cleaned):
            raise ValueError('Invalid Indian mobile number')
        match = re.search(r'[6-9]\d{9}$', cleaned)
        return match.group(0) if match else cleaned


class MemberUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = None
    age: Optional[int] = Field(None, ge=18, le=100)
    gender: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    status: Optional[MemberStatus] = None
    joined_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is None:
            return v
        cleaned = re.sub(r'[\s\-()]+', '', v)
        pattern = r'^(?:\+?91|0)?[6-9]\d{9}$'
        if not re.match(pattern, cleaned):
            raise ValueError('Invalid Indian mobile number')
        match = re.search(r'[6-9]\d{9}$', cleaned)
        return match.group(0) if match else cleaned


class MemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    age: int
    gender: Optional[str] = None
    address: Optional[str] = None
    status: MemberStatus
    joined_date: date
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
