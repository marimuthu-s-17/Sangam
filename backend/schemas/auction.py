from pydantic import BaseModel, Field, ConfigDict, model_validator
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from models.auction import AuctionStatus


class AuctionMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    member_id: int
    name: str
    phone: str
    age: int
    gender: Optional[str] = None
    address: Optional[str] = None
    date_joined: date
    is_winner: bool
    winning_month: Optional[int] = None
    is_active: bool


class AuctionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    prize_amount: Decimal
    commission: Decimal
    monthly_contribution: Decimal
    total_months: int
    start_date: date
    current_month: int
    status: AuctionStatus
    created_at: datetime
    updated_at: datetime
    members_count: int
    members: List[AuctionMemberResponse] = []


class AuctionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Auction name")
    description: Optional[str] = Field(None, description="Description")
    prize_amount: Decimal = Field(..., gt=0, description="Total prize amount")
    commission: Decimal = Field(..., ge=0, description="Community commission")
    monthly_contribution: Decimal = Field(..., gt=0, description="Minimum monthly contribution")
    total_months: int = Field(..., gt=0, description="Total duration in months")
    start_date: date = Field(..., description="Start date of auction")
    member_ids: List[int] = Field(..., description="IDs of community members to assign")
    status: AuctionStatus = Field(default=AuctionStatus.UPCOMING)

    @model_validator(mode='after')
    def validate_auction_rules(self) -> 'AuctionCreate':
        prize = self.prize_amount
        comm = self.commission
        contrib = self.monthly_contribution
        members = self.member_ids
        
        if comm >= prize:
            raise ValueError("Commission must be less than the prize amount")
            
        if len(members) < 2:
            raise ValueError("At least two members are required for an auction")
            
        total_pool = contrib * len(members)
        # Check if total_pool is approximately equal to prize_amount. Allow a 10% tolerance
        tolerance = Decimal("0.10")
        lower_bound = prize * (Decimal("1.0") - tolerance)
        upper_bound = prize * (Decimal("1.0") + tolerance)
        
        if total_pool < lower_bound or total_pool > upper_bound:
            raise ValueError(
                f"Total contribution pool (₹{total_pool}) must be approximately equal to "
                f"the prize amount (₹{prize}) with up to 10% tolerance."
            )
            
        return self


class AuctionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    prize_amount: Optional[Decimal] = Field(None, gt=0)
    commission: Optional[Decimal] = Field(None, ge=0)
    monthly_contribution: Optional[Decimal] = Field(None, gt=0)
    total_months: Optional[int] = Field(None, gt=0)
    start_date: Optional[date] = None
    status: Optional[AuctionStatus] = None
    member_ids: Optional[List[int]] = None
    notes: Optional[str] = None
