from pydantic import BaseModel, Field, ConfigDict
from datetime import date
from decimal import Decimal
from typing import Optional, List, Dict, Any


class MonthlyContributionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    auction_month_id: int
    member_id: int
    name: str
    phone: str
    minimum_amount: Decimal
    paid_amount: Decimal
    paid_status: bool
    payment_date: Optional[date] = None
    already_won: bool = False
    is_eligible: bool = False
    dividend_received: Decimal = Decimal("0.00")


class AuctionMonthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    auction_id: int
    month_number: int
    auction_date: Optional[date] = None
    winning_member_id: Optional[int] = None
    winning_member_name: Optional[str] = None
    bid_amount: Decimal
    community_commission: Decimal
    dividend_per_member: Decimal
    status: str
    contributions: List[MonthlyContributionResponse] = []


class CurrentMonthResponse(BaseModel):
    auction_month: Optional[AuctionMonthResponse] = None
    stats: Dict[str, Any] = {}


class CompleteMonthRequest(BaseModel):
    winning_member_id: int = Field(..., description="ID of the eligible winning member")
    bid_amount: Decimal = Field(..., ge=0, description="Winning bid amount")


class UpdateContributionRequest(BaseModel):
    paid_amount: Decimal = Field(..., ge=0, description="Amount paid by the member so far")
