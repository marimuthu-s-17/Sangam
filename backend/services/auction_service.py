from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.auction import Auction, AuctionStatus, AuctionMember
from models.member import Member
from repositories.auction_repository import AuctionRepository
from repositories.member_repository import MemberRepository
from schemas.auction import AuctionCreate, AuctionUpdate, AuctionResponse, AuctionMemberResponse
from typing import Optional, List, Tuple
from fastapi import HTTPException, status


class AuctionService:
    """Service layer for chit-fund Auction operations."""

    @staticmethod
    def _to_response(auction: Auction) -> AuctionResponse:
        """Convert Auction model and associated members to AuctionResponse schema."""
        members_list = []
        for assoc in auction.members_association:
            if assoc.member:
                members_list.append(AuctionMemberResponse(
                    member_id=assoc.member_id,
                    name=assoc.member.name,
                    phone=assoc.member.phone,
                    age=assoc.member.age,
                    gender=assoc.member.gender,
                    address=assoc.member.address,
                    date_joined=assoc.date_joined,
                    is_winner=assoc.is_winner,
                    winning_month=assoc.winning_month,
                    is_active=assoc.is_active
                ))
        return AuctionResponse(
            id=auction.id,
            name=auction.name,
            description=auction.description,
            prize_amount=auction.prize_amount,
            commission=auction.commission,
            monthly_contribution=auction.monthly_contribution,
            total_months=auction.total_months,
            start_date=auction.start_date,
            current_month=auction.current_month,
            status=auction.status,
            created_at=auction.created_at,
            updated_at=auction.updated_at,
            members_count=len(members_list),
            members=members_list
        )

    @staticmethod
    async def get_all(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        status_filter: Optional[AuctionStatus] = None,
        sort_by: Optional[str] = "id",
        sort_order: Optional[str] = "desc"
    ) -> Tuple[List[AuctionResponse], int]:
        """Get paginated, searched, and sorted auctions."""
        auctions, total = await AuctionRepository.get_all(
            db, skip, limit, search, status_filter, sort_by, sort_order
        )
        return [AuctionService._to_response(a) for a in auctions], total

    @staticmethod
    async def get_by_id(db: AsyncSession, auction_id: int) -> AuctionResponse:
        """Get an auction by ID."""
        auction = await AuctionRepository.get_by_id(db, auction_id)
        if not auction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Auction not found"
            )
        return AuctionService._to_response(auction)

    @staticmethod
    async def create(db: AsyncSession, data: AuctionCreate) -> AuctionResponse:
        """Create a new auction and assign members."""
        # 1. Verify all member IDs exist in the database
        for mid in data.member_ids:
            member = await MemberRepository.get_by_id(db, mid)
            if not member:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Member with ID {mid} does not exist"
                )

        # 2. Create the auction record
        auction_dict = data.model_dump(exclude={"member_ids"})
        auction = Auction(**auction_dict)
        created_auction = await AuctionRepository.create(db, auction)

        # 3. Associate selected members
        for mid in data.member_ids:
            assoc = AuctionMember(
                auction_id=created_auction.id,
                member_id=mid,
                is_winner=False,
                is_active=True
            )
            await AuctionRepository.add_member(db, assoc)

        # 4. Refresh to load associations and return response
        refreshed = await AuctionRepository.get_by_id(db, created_auction.id)
        return AuctionService._to_response(refreshed)

    @staticmethod
    async def update(
        db: AsyncSession, auction_id: int, data: AuctionUpdate
    ) -> AuctionResponse:
        """Update an auction and add/remove members with business rules validation."""
        auction = await AuctionRepository.get_by_id(db, auction_id)
        if not auction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Auction not found"
            )

        # Prepare update dict
        update_dict = data.model_dump(exclude_none=True, exclude={"member_ids"})
        
        # Apply updates to basic fields
        await AuctionRepository.update(db, auction, update_dict)

        # Handle member changes if provided
        if data.member_ids is not None:
            # Check member counts
            if len(data.member_ids) < 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An auction requires at least two members"
                )

            current_mids = {assoc.member_id for assoc in auction.members_association}
            new_mids = set(data.member_ids)

            # Determine who to add and remove
            to_add = new_mids - current_mids
            to_remove = current_mids - new_mids

            # Verify and add new members
            for mid in to_add:
                member = await MemberRepository.get_by_id(db, mid)
                if not member:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Member with ID {mid} does not exist"
                    )
                assoc = AuctionMember(
                    auction_id=auction.id,
                    member_id=mid,
                    is_winner=False,
                    is_active=True
                )
                await AuctionRepository.add_member(db, assoc)

            # Verify and remove members (ensure they haven't won)
            for mid in to_remove:
                # Find matching assoc
                matching_assoc = next((a for a in auction.members_association if a.member_id == mid), None)
                if matching_assoc:
                    if matching_assoc.is_winner:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Cannot remove Member ID {mid} because they have already won a round in this auction"
                        )
                    await AuctionRepository.remove_member(db, auction.id, mid)

        # Refresh and return
        refreshed = await AuctionRepository.get_by_id(db, auction.id)
        return AuctionService._to_response(refreshed)

    @staticmethod
    async def delete(db: AsyncSession, auction_id: int) -> dict:
        """Soft delete an auction by setting status to CANCELLED."""
        auction = await AuctionRepository.get_by_id(db, auction_id)
        if not auction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Auction not found"
            )
        await AuctionRepository.soft_delete(db, auction)
        return {"message": "Auction cancelled successfully"}

    @staticmethod
    async def get_stats(db: AsyncSession) -> dict:
        """Get dashboard count stats."""
        return await AuctionRepository.get_stats(db)

    @staticmethod
    async def get_members(db: AsyncSession, auction_id: int) -> List[AuctionMemberResponse]:
        """Retrieve members assigned to a specific auction."""
        auction = await AuctionRepository.get_by_id(db, auction_id)
        if not auction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Auction not found"
            )
        response = AuctionService._to_response(auction)
        return response.members
