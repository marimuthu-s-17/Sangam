from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from schemas.auction import AuctionCreate, AuctionUpdate, AuctionResponse, AuctionMemberResponse
from services.auction_service import AuctionService
from models.auction import AuctionStatus
from typing import Optional, List


router = APIRouter(prefix="/api/v1/auctions", tags=["Auctions"])


@router.get("/stats", response_model=dict)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get count stats of all auctions."""
    return await AuctionService.get_stats(db)


@router.get("/search", response_model=dict)
async def search_auctions(
    search: str = Query("", description="Search by auction name or member name"),
    status_filter: Optional[AuctionStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Search auctions by name or status."""
    data, total = await AuctionService.get_all(db, skip, limit, search, status_filter)
    return {"data": data, "total": total, "skip": skip, "limit": limit}


@router.get("", response_model=dict)
async def list_auctions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[AuctionStatus] = Query(None),
    sort_by: Optional[str] = Query("id"),
    sort_order: Optional[str] = Query("desc"),
    db: AsyncSession = Depends(get_db)
):
    """List auctions with pagination, filtering, searching and sorting."""
    data, total = await AuctionService.get_all(db, skip, limit, search, status, sort_by, sort_order)
    return {"data": data, "total": total, "skip": skip, "limit": limit}


@router.get("/{auction_id}", response_model=AuctionResponse)
async def get_auction(
    auction_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a single auction by ID."""
    return await AuctionService.get_by_id(db, auction_id)


@router.post("", response_model=AuctionResponse, status_code=status.HTTP_201_CREATED)
async def create_auction(
    data: AuctionCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new chit-fund auction group and assign members."""
    return await AuctionService.create(db, data)


@router.put("/{auction_id}", response_model=AuctionResponse)
async def update_auction(
    auction_id: int,
    data: AuctionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update details of an existing auction."""
    return await AuctionService.update(db, auction_id, data)


@router.delete("/{auction_id}", response_model=dict)
async def delete_auction(
    auction_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Soft delete (cancel) an auction."""
    return await AuctionService.delete(db, auction_id)


@router.get("/{auction_id}/members", response_model=List[AuctionMemberResponse])
async def list_auction_members(
    auction_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get the list of members assigned to an auction."""
    return await AuctionService.get_members(db, auction_id)
