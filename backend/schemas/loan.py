from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal


class LoanPaymentCreate(BaseModel):
    interest_payment: Decimal = Field(default=Decimal("0.00"), ge=0, description="Amount paid towards interest")
    principal_payment: Decimal = Field(default=Decimal("0.00"), ge=0, description="Amount paid towards principal")
    payment_date: date = Field(..., description="Date of payment")
    payment_method: str = Field(..., max_length=50, description="Payment method (e.g., cash, upi, bank)")
    notes: Optional[str] = Field(None, description="Notes on payment")


class LoanPaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    loan_id: int
    interest_payment: Decimal
    principal_payment: Decimal
    remaining_balance: Decimal
    payment_date: date
    payment_method: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class LoanCreate(BaseModel):
    borrower_name: str = Field(..., min_length=1, max_length=100, description="Borrower full name")
    phone_number: str = Field(..., min_length=1, max_length=15, description="Borrower phone number")
    member_id: Optional[int] = Field(None, description="Associated member ID if borrower is a member")
    loan_amount: Decimal = Field(..., gt=0, description="Principal loan amount")
    interest_rate: Decimal = Field(..., ge=0, description="Annual interest rate percentage")
    loan_date: date = Field(..., description="Loan issuance date")
    due_date: date = Field(..., description="Loan maturity/due date")
    remarks: Optional[str] = Field(None, description="Optional remarks")


class LoanUpdate(BaseModel):
    borrower_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone_number: Optional[str] = Field(None, min_length=1, max_length=15)
    member_id: Optional[int] = None
    loan_amount: Optional[Decimal] = Field(None, gt=0)
    interest_rate: Optional[Decimal] = Field(None, ge=0)
    loan_date: Optional[date] = None
    due_date: Optional[date] = None
    status: Optional[str] = Field(None, max_length=20)
    remarks: Optional[str] = None


class LoanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    borrower_name: str
    phone_number: str
    member_id: Optional[int] = None
    loan_amount: Decimal
    interest_rate: Decimal
    loan_date: date
    due_date: date
    outstanding_amount: Decimal
    status: str
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Dynamic computed fields
    monthly_interest_amount: Decimal
    interest_due: Decimal
    days_remaining: int


class LoansListResponse(BaseModel):
    data: List[LoanResponse]
    total: int
    skip: int
    limit: int
