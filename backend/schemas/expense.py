from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from typing import Optional
from decimal import Decimal


class ExpenseCreate(BaseModel):
    description: str = Field(..., min_length=1, max_length=255, description="Expense description")
    amount: Decimal = Field(..., gt=0, description="Expense amount")
    category: str = Field(default="general", max_length=50, description="Expense category")
    expense_date: date = Field(..., description="Date of expense")
    paid_to: Optional[str] = Field(None, max_length=100, description="Payee name")
    notes: Optional[str] = Field(None, description="Additional notes")
    payment_method: str = Field(default="cash", max_length=50, description="Payment method used")
    remarks: Optional[str] = Field(None, description="Additional remarks")


class ExpenseUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    amount: Optional[Decimal] = Field(None, gt=0)
    category: Optional[str] = Field(None, max_length=50)
    expense_date: Optional[date] = None
    paid_to: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    payment_method: Optional[str] = Field(None, max_length=50)
    remarks: Optional[str] = None


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: str
    amount: Decimal
    category: str
    expense_date: date
    paid_to: Optional[str] = None
    notes: Optional[str] = None
    payment_method: str
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime
