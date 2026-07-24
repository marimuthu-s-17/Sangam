from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from datetime import date
from decimal import Decimal
from typing import List, Optional

from models.auction import AuctionStatus
from models.monthly_auction import AuctionMonth, MonthlyContribution, AuctionDividend
from repositories.auction_repository import AuctionRepository
from repositories.monthly_auction_repository import MonthlyAuctionRepository
from schemas.monthly_auction import (
    MonthlyContributionResponse,
    AuctionMonthResponse,
    CurrentMonthResponse,
)


class MonthlyAuctionService:
    """Service layer coordinating business logic for the Monthly Auction Engine."""

    @staticmethod
    def _map_contribution_to_response(
        contrib: MonthlyContribution,
        won_member_ids: set[int],
        total_dividends: dict[int, float],
    ) -> MonthlyContributionResponse:
        """Helper to convert MonthlyContribution model to response schema with calculated eligibility fields."""
        member_id = contrib.member_id
        already_won = member_id in won_member_ids
        is_eligible = contrib.paid_status and not already_won
        dividend = Decimal(str(total_dividends.get(member_id, 0.0)))

        return MonthlyContributionResponse(
            id=contrib.id,
            auction_month_id=contrib.auction_month_id,
            member_id=member_id,
            name=contrib.member.name,
            phone=contrib.member.phone,
            minimum_amount=contrib.minimum_amount,
            paid_amount=contrib.paid_amount,
            paid_status=contrib.paid_status,
            payment_date=contrib.payment_date,
            already_won=already_won,
            is_eligible=is_eligible,
            dividend_received=dividend,
        )

    @staticmethod
    def _map_month_to_response(
        month: AuctionMonth,
        won_member_ids: set[int],
        total_dividends: dict[int, float],
    ) -> AuctionMonthResponse:
        """Helper to convert AuctionMonth model to response schema."""
        contribs = [
            MonthlyAuctionService._map_contribution_to_response(
                c, won_member_ids, total_dividends
            )
            for c in month.contributions
        ]

        winner_name = month.winning_member.name if month.winning_member else None

        return AuctionMonthResponse(
            id=month.id,
            auction_id=month.auction_id,
            month_number=month.month_number,
            auction_date=month.auction_date,
            winning_member_id=month.winning_member_id,
            winning_member_name=winner_name,
            bid_amount=month.bid_amount or Decimal("0.00"),
            community_commission=month.community_commission or Decimal("0.00"),
            dividend_per_member=month.dividend_per_member or Decimal("0.00"),
            status=month.status,
            contributions=contribs,
        )

    @staticmethod
    async def get_current_month_details(
        db: AsyncSession, auction_id: int
    ) -> CurrentMonthResponse:
        """Get the current month round details. If it doesn't exist, initialize it in draft state."""
        auction = await AuctionRepository.get_by_id(db, auction_id)
        if not auction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Auction not found"
            )

        if auction.status != AuctionStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Auction is currently {auction.status.value}. Monthly dashboard is only available for active auctions.",
            )

        current_month_num = auction.current_month
        month = await MonthlyAuctionRepository.get_month_by_number(
            db, auction_id, current_month_num
        )

        # Initialize the round if it doesn't exist
        if not month:
            # Create AuctionMonth record
            new_month = AuctionMonth(
                auction_id=auction_id,
                month_number=current_month_num,
                status="pending",
                bid_amount=Decimal("0.00"),
                community_commission=Decimal("0.00"),
                dividend_per_member=Decimal("0.00"),
            )
            month = await MonthlyAuctionRepository.create_month(db, new_month)

            # Create contributions for all assigned members
            contributions = []
            for member_assoc in auction.members_association:
                if member_assoc.is_active:
                    contrib = MonthlyContribution(
                        auction_month_id=month.id,
                        member_id=member_assoc.member_id,
                        minimum_amount=auction.monthly_contribution,
                        paid_amount=Decimal("0.00"),
                        paid_status=False,
                        payment_date=None,
                    )
                    contributions.append(contrib)

            if contributions:
                await MonthlyAuctionRepository.create_contributions(db, contributions)

            # Re-fetch with preloaded relations
            month = await MonthlyAuctionRepository.get_month_by_number(
                db, auction_id, current_month_num
            )

        # Fetch extra meta parameters
        won_member_ids = await MonthlyAuctionRepository.get_won_member_ids(
            db, auction_id
        )
        total_dividends = await MonthlyAuctionRepository.get_total_dividends_for_members(
            db, auction_id
        )

        month_response = MonthlyAuctionService._map_month_to_response(
            month, won_member_ids, total_dividends
        )

        # Calculate counts
        assigned_member_ids = {
            m.member_id for m in auction.members_association if m.is_active
        }
        remaining_count = len(assigned_member_ids - won_member_ids)
        won_count = len(assigned_member_ids & won_member_ids)

        stats = {
            "auction_name": auction.name,
            "prize_amount": float(auction.prize_amount),
            "current_month": current_month_num,
            "total_months": auction.total_months,
            "members_remaining": remaining_count,
            "already_won": won_count,
            "today_date": date.today().isoformat(),
            "community_commission": float(auction.commission),
            "is_round_active": month.status == "active",
            "round_status": month.status,
        }

        return CurrentMonthResponse(auction_month=month_response, stats=stats)

    @staticmethod
    async def start_month(db: AsyncSession, auction_id: int) -> AuctionMonthResponse:
        """Transition the current month's round from pending to active (start bidding)."""
        auction = await AuctionRepository.get_by_id(db, auction_id)
        if not auction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Auction not found"
            )

        month = await MonthlyAuctionRepository.get_month_by_number(
            db, auction_id, auction.current_month
        )
        if not month:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Monthly round is not initialized.",
            )

        if month.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot start round. Current round status is: {month.status}.",
            )

        # Validate that there's at least one eligible member
        won_member_ids = await MonthlyAuctionRepository.get_won_member_ids(
            db, auction_id
        )
        has_eligible = False
        for c in month.contributions:
            is_winner = c.member_id in won_member_ids
            if c.paid_status and not is_winner:
                has_eligible = True
                break

        if not has_eligible:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot start auction: At least one paid member who has not already won is required.",
            )

        month.status = "active"
        await db.flush()

        total_dividends = await MonthlyAuctionRepository.get_total_dividends_for_members(
            db, auction_id
        )
        return MonthlyAuctionService._map_month_to_response(
            month, won_member_ids, total_dividends
        )

    @staticmethod
    async def complete_month(
        db: AsyncSession,
        auction_id: int,
        winning_member_id: int,
        bid_amount: Decimal,
    ) -> AuctionMonthResponse:
        """Complete the current month bidding round, calculate dividends, and increment the month."""
        auction = await AuctionRepository.get_by_id(db, auction_id)
        if not auction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Auction not found"
            )

        month = await MonthlyAuctionRepository.get_month_by_number(
            db, auction_id, auction.current_month
        )
        if not month:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Monthly round is not initialized.",
            )

        if month.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot complete round. Round status must be active (it is currently '{month.status}').",
            )

        # Validation Checks
        if bid_amount < Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bid amount cannot be negative.",
            )

        if bid_amount > auction.prize_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Bid amount (₹{bid_amount}) cannot exceed the total prize amount (₹{auction.prize_amount}).",
            )

        if bid_amount < auction.commission:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Bid amount (₹{bid_amount}) must be at least equal to the community commission (₹{auction.commission}).",
            )

        # Verify eligibility of the winning member
        won_member_ids = await MonthlyAuctionRepository.get_won_member_ids(
            db, auction_id
        )
        if winning_member_id in won_member_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot select a member who has already won.",
            )

        winner_contrib = next(
            (c for c in month.contributions if c.member_id == winning_member_id), None
        )
        if not winner_contrib:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Winner must be an assigned member of this auction.",
            )

        if not winner_contrib.paid_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected winner must have pending payment checked off (paid status = TRUE).",
            )

        # Dividend receivers: all members participating in the auction month, INCLUDING the winner
        denominator = len(month.contributions)

        if denominator > 0:
            dividend_per_member = (bid_amount - auction.commission) / Decimal(
                denominator
            )
        else:
            dividend_per_member = Decimal("0.00")

        # Update AuctionMonth details
        month.winning_member_id = winning_member_id
        month.bid_amount = bid_amount
        month.community_commission = auction.commission
        month.dividend_per_member = dividend_per_member
        month.status = "completed"
        month.auction_date = date.today()

        # Create Dividends for all participating members
        dividends_to_create = []
        for c in month.contributions:
            div = AuctionDividend(
                auction_month_id=month.id,
                member_id=c.member_id,
                dividend_received=dividend_per_member,
            )
            dividends_to_create.append(div)

        if dividends_to_create:
            await MonthlyAuctionRepository.create_dividends(db, dividends_to_create)

        # Update winner status on AuctionMember mapping
        for assoc in auction.members_association:
            if assoc.member_id == winning_member_id:
                assoc.is_winner = True
                assoc.winning_month = month.month_number
                break

        # Increment Month
        next_month = auction.current_month + 1
        auction.current_month = next_month

        # If current month exceeds total duration, complete auction
        if next_month > auction.total_months:
            auction.status = AuctionStatus.COMPLETED

        await db.flush()

        # Refresh stats and mapping
        updated_won_member_ids = await MonthlyAuctionRepository.get_won_member_ids(
            db, auction_id
        )
        total_dividends = await MonthlyAuctionRepository.get_total_dividends_for_members(
            db, auction_id
        )

        return MonthlyAuctionService._map_month_to_response(
            month, updated_won_member_ids, total_dividends
        )

    @staticmethod
    async def update_contribution(
        db: AsyncSession, contribution_id: int, paid_amount: Decimal
    ) -> MonthlyContributionResponse:
        """Update payment amount of a contribution. Saves instantly."""
        contrib = await MonthlyAuctionRepository.get_contribution_by_id(
            db, contribution_id
        )
        if not contrib:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Monthly contribution record not found",
            )

        if contrib.auction_month.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot alter payment status of a completed auction month.",
            )

        contrib.paid_amount = paid_amount
        # Automatically determine paid status: True if pending balance is <= 0
        if paid_amount >= contrib.minimum_amount:
            contrib.paid_status = True
            contrib.payment_date = date.today()
        else:
            contrib.paid_status = False
            if paid_amount == Decimal("0.00"):
                contrib.payment_date = None
            else:
                contrib.payment_date = date.today()

        await db.flush()

        # Gather meta info to satisfy MonthlyContributionResponse
        auction_id = contrib.auction_month.auction_id
        won_member_ids = await MonthlyAuctionRepository.get_won_member_ids(
            db, auction_id
        )
        total_dividends = await MonthlyAuctionRepository.get_total_dividends_for_members(
            db, auction_id
        )

        return MonthlyAuctionService._map_contribution_to_response(
            contrib, won_member_ids, total_dividends
        )

    @staticmethod
    async def get_history(
        db: AsyncSession, auction_id: int
    ) -> List[AuctionMonthResponse]:
        """Retrieve completed monthly history for reports."""
        months = await MonthlyAuctionRepository.get_history(db, auction_id)
        won_member_ids = await MonthlyAuctionRepository.get_won_member_ids(
            db, auction_id
        )
        total_dividends = await MonthlyAuctionRepository.get_total_dividends_for_members(
            db, auction_id
        )

        return [
            MonthlyAuctionService._map_month_to_response(
                m, won_member_ids, total_dividends
            )
            for m in months
        ]
