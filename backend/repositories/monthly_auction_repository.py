from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from models.monthly_auction import AuctionMonth, MonthlyContribution, AuctionDividend
from models.auction import AuctionMember
from typing import Optional, List, Set


class MonthlyAuctionRepository:
    """Repository layer for Monthly Auction Engine database operations using SQLAlchemy 2.0."""

    @staticmethod
    async def get_month_by_number(
        db: AsyncSession, auction_id: int, month_number: int
    ) -> Optional[AuctionMonth]:
        """Fetch an AuctionMonth by auction_id and month_number with contributions and winning member preloaded."""
        query = (
            select(AuctionMonth)
            .where(
                AuctionMonth.auction_id == auction_id,
                AuctionMonth.month_number == month_number,
            )
            .options(
                selectinload(AuctionMonth.contributions).selectinload(
                    MonthlyContribution.member
                ),
                selectinload(AuctionMonth.winning_member),
            )
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_month_by_id(
        db: AsyncSession, auction_month_id: int
    ) -> Optional[AuctionMonth]:
        """Fetch an AuctionMonth by ID with contributions preloaded."""
        query = (
            select(AuctionMonth)
            .where(AuctionMonth.id == auction_month_id)
            .options(
                selectinload(AuctionMonth.contributions).selectinload(
                    MonthlyContribution.member
                ),
                selectinload(AuctionMonth.winning_member),
            )
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_month(
        db: AsyncSession, auction_month: AuctionMonth
    ) -> AuctionMonth:
        """Create a new AuctionMonth record."""
        db.add(auction_month)
        await db.flush()
        return auction_month

    @staticmethod
    async def create_contributions(
        db: AsyncSession, contributions: List[MonthlyContribution]
    ) -> List[MonthlyContribution]:
        """Bulk add MonthlyContribution records."""
        db.add_all(contributions)
        await db.flush()
        return contributions

    @staticmethod
    async def get_contribution_by_id(
        db: AsyncSession, contribution_id: int
    ) -> Optional[MonthlyContribution]:
        """Fetch a single MonthlyContribution by ID with preloaded member and month details."""
        query = (
            select(MonthlyContribution)
            .where(MonthlyContribution.id == contribution_id)
            .options(
                selectinload(MonthlyContribution.member),
                selectinload(MonthlyContribution.auction_month).selectinload(
                    AuctionMonth.auction
                ),
            )
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_dividends_by_member(
        db: AsyncSession, auction_id: int, member_id: int
    ) -> List[AuctionDividend]:
        """Fetch dividends received by a member in a specific auction."""
        query = (
            select(AuctionDividend)
            .join(AuctionMonth)
            .where(
                AuctionMonth.auction_id == auction_id,
                AuctionDividend.member_id == member_id,
            )
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_total_dividends_for_members(
        db: AsyncSession, auction_id: int
    ) -> dict[int, float]:
        """Get sum of dividends received by each member in a specific auction."""
        query = (
            select(
                AuctionDividend.member_id,
                func.sum(AuctionDividend.dividend_received),
            )
            .join(AuctionMonth)
            .where(AuctionMonth.auction_id == auction_id)
            .group_by(AuctionDividend.member_id)
        )
        result = await db.execute(query)
        return {row[0]: float(row[1]) for row in result.all()}

    @staticmethod
    async def get_won_member_ids(db: AsyncSession, auction_id: int) -> Set[int]:
        """Retrieve the IDs of members who have already won in this auction."""
        query = select(AuctionMember.member_id).where(
            AuctionMember.auction_id == auction_id,
            AuctionMember.is_winner == True,
        )
        result = await db.execute(query)
        return set(result.scalars().all())

    @staticmethod
    async def get_history(db: AsyncSession, auction_id: int) -> List[AuctionMonth]:
        """Get all completed AuctionMonth records for the auction."""
        query = (
            select(AuctionMonth)
            .where(
                AuctionMonth.auction_id == auction_id,
                AuctionMonth.status == "completed",
            )
            .options(
                selectinload(AuctionMonth.contributions).selectinload(
                    MonthlyContribution.member
                ),
                selectinload(AuctionMonth.winning_member),
                selectinload(AuctionMonth.dividends).selectinload(
                    AuctionDividend.member
                ),
            )
            .order_by(AuctionMonth.month_number.asc())
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def create_dividends(
        db: AsyncSession, dividends: List[AuctionDividend]
    ) -> List[AuctionDividend]:
        """Bulk add AuctionDividend records."""
        db.add_all(dividends)
        await db.flush()
        return dividends
