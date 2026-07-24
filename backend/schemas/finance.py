from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import date, datetime
from typing import Optional
from decimal import Decimal
from models.finance import TransactionType


class FinanceCreate(BaseModel):
    member_id: Optional[int] = Field(None, description="Associated member ID")
    transaction_type: TransactionType = Field(..., description="Type: payment, receipt, or adjustment")
    amount: Decimal = Field(..., gt=0, description="Transaction amount")
    description: str = Field(..., min_length=1, max_length=255, description="Transaction description")
    transaction_date: date = Field(..., description="Date of transaction")
    reference_number: Optional[str] = Field(None, max_length=50, description="Reference number")

    @field_validator("transaction_type", mode="before")
    @classmethod
    def val_transaction_type(cls, v):
        if isinstance(v, str):
            return v.upper()
        return v


class FinanceUpdate(BaseModel):
    member_id: Optional[int] = None
    transaction_type: Optional[TransactionType] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    transaction_date: Optional[date] = None
    reference_number: Optional[str] = Field(None, max_length=50)

    @field_validator("transaction_type", mode="before")
    @classmethod
    def val_transaction_type(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            return v.upper()
        return v


class FinanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    member_id: Optional[int] = None
    member_name: Optional[str] = None
    transaction_type: TransactionType
    amount: Decimal
    description: str
    transaction_date: date
    reference_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime
