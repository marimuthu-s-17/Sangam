from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, distinct
from sqlalchemy.orm import selectinload
from models.auction import Auction, AuctionStatus, AuctionMember
from models.member import Member
from typing import Optional, List, Tuple


class AuctionRepository:
    """Repository layer for Auction and AuctionMember database operations using SQLAlchemy 2.0."""

    @staticmethod
    async def get_all(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        status: Optional[AuctionStatus] = None,
        sort_by: Optional[str] = "id",
        sort_order: Optional[str] = "desc"
    ) -> Tuple[List[Auction], int]:
        """Get all auctions with searching, filtering, sorting, and pagination."""
        query = select(Auction).options(
            selectinload(Auction.members_association).selectinload(AuctionMember.member)
        )
        
        # Join tables if we need to search on Member details
        if search:
            query = query.outerjoin(Auction.members_association).outerjoin(AuctionMember.member)
            search_filters = [
                Auction.name.ilike(f"%{search}%"),
                Member.name.ilike(f"%{search}%")
            ]
            for s in AuctionStatus:
                if s.value.lower() == search.lower() or s.name.lower() == search.lower():
                    search_filters.append(Auction.status == s)
            query = query.where(or_(*search_filters))

        if status:
            query = query.where(Auction.status == status)

        query = query.distinct()

        # Count total matches before pagination
        count_query = select(func.count(distinct(Auction.id))).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar() or 0

        # Sorting
        if sort_by:
            col = getattr(Auction, sort_by, None)
            if col is not None:
                if sort_order == "asc":
                    query = query.order_by(col.asc())
                else:
                    query = query.order_by(col.desc())
            else:
                query = query.order_by(Auction.id.desc())
        else:
            query = query.order_by(Auction.id.desc())

        # Pagination
        query = query.offset(skip).limit(limit)

        result = await db.execute(query)
        auctions = result.scalars().all()
        return auctions, total

    @staticmethod
    async def get_by_id(db: AsyncSession, auction_id: int) -> Optional[Auction]:
        """Get a single auction by ID with preloaded members."""
        query = select(Auction).where(Auction.id == auction_id).options(
            selectinload(Auction.members_association).selectinload(AuctionMember.member)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, auction: Auction) -> Auction:
        """Insert a new auction record."""
        db.add(auction)
        await db.flush()
        await db.refresh(auction)
        return auction

    @staticmethod
    async def update(db: AsyncSession, auction: Auction, update_data: dict) -> Auction:
        """Update fields on an existing auction."""
        for key, value in update_data.items():
            setattr(auction, key, value)
        await db.flush()
        await db.refresh(auction)
        return auction

    @staticmethod
    async def soft_delete(db: AsyncSession, auction: Auction) -> Auction:
        """Soft delete by updating status to CANCELLED."""
        auction.status = AuctionStatus.CANCELLED
        await db.flush()
        await db.refresh(auction)
        return auction

    @staticmethod
    async def get_stats(db: AsyncSession) -> dict:
        """Retrieve count stats of auctions and active participants."""
        total_q = select(func.count(Auction.id))
        upcoming_q = select(func.count(Auction.id)).where(Auction.status == AuctionStatus.UPCOMING)
        active_q = select(func.count(Auction.id)).where(Auction.status == AuctionStatus.ACTIVE)
        completed_q = select(func.count(Auction.id)).where(Auction.status == AuctionStatus.COMPLETED)
        
        # Distinct members participating in at least one auction
        members_q = select(func.count(distinct(AuctionMember.member_id))).where(AuctionMember.is_active == True)

        total = (await db.execute(total_q)).scalar() or 0
        upcoming = (await db.execute(upcoming_q)).scalar() or 0
        active = (await db.execute(active_q)).scalar() or 0
        completed = (await db.execute(completed_q)).scalar() or 0
        members_count = (await db.execute(members_q)).scalar() or 0

        return {
            "total_auctions": total,
            "upcoming_auctions": upcoming,
            "active_auctions": active,
            "completed_auctions": completed,
            "total_members_participating": members_count
        }

    @staticmethod
    async def add_member(db: AsyncSession, auction_member: AuctionMember) -> AuctionMember:
        """Add a member to an auction."""
        db.add(auction_member)
        await db.flush()
        return auction_member

    @staticmethod
    async def remove_member(db: AsyncSession, auction_id: int, member_id: int) -> None:
        """Remove a member from an auction."""
        query = select(AuctionMember).where(
            AuctionMember.auction_id == auction_id,
            AuctionMember.member_id == member_id
        )
        result = await db.execute(query)
        assoc = result.scalar_one_or_none()
        if assoc:
            await db.delete(assoc)
            await db.flush()
