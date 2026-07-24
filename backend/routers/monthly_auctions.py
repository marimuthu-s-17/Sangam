from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database.connection import get_db
from schemas.monthly_auction import (
    CurrentMonthResponse,
    AuctionMonthResponse,
    MonthlyContributionResponse,
    CompleteMonthRequest,
    UpdateContributionRequest,
)
from services.monthly_auction_service import MonthlyAuctionService

router = APIRouter(prefix="/api/v1", tags=["Monthly Auctions"])


@router.get("/auctions/{id}/current-month", response_model=CurrentMonthResponse)
async def get_current_month(id: int, db: AsyncSession = Depends(get_db)):
    """Fetch current month round details (initializes month round if not yet created)."""
    return await MonthlyAuctionService.get_current_month_details(db, id)


@router.post("/auctions/{id}/start-month", response_model=AuctionMonthResponse)
async def start_month(id: int, db: AsyncSession = Depends(get_db)):
    """Start the monthly round (enables bidding)."""
    return await MonthlyAuctionService.start_month(db, id)


@router.post("/auctions/{id}/complete-month", response_model=AuctionMonthResponse)
async def complete_month(
    id: int, data: CompleteMonthRequest, db: AsyncSession = Depends(get_db)
):
    """Complete bidding round, record winner, calculate dividends, and advance month."""
    return await MonthlyAuctionService.complete_month(
        db, id, data.winning_member_id, data.bid_amount
    )


@router.put(
    "/monthly-contributions/{id}", response_model=MonthlyContributionResponse
)
async def update_contribution(
    id: int, data: UpdateContributionRequest, db: AsyncSession = Depends(get_db)
):
    """Update paid status of a member contribution."""
    return await MonthlyAuctionService.update_contribution(db, id, data.paid_amount)


@router.get("/auctions/{id}/history", response_model=List[AuctionMonthResponse])
async def get_history(id: int, db: AsyncSession = Depends(get_db)):
    """Fetch history of all completed monthly rounds for the auction."""
    return await MonthlyAuctionService.get_history(db, id)
