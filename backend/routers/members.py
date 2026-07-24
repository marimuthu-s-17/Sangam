from fastapi import APIRouter, Depends, Query, UploadFile, File, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from schemas.member import MemberCreate, MemberUpdate, MemberResponse
from services.member_service import MemberService
from models.member import MemberStatus
from typing import Optional


router = APIRouter(prefix="/api/v1/members", tags=["Members"])


@router.get("", response_model=dict)
async def list_members(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=500),
    search: Optional[str] = Query(None),
    status: Optional[MemberStatus] = Query(None),
    age: Optional[int] = Query(None),
    sort_by: Optional[str] = Query("id"),
    sort_order: Optional[str] = Query("desc"),
    db: AsyncSession = Depends(get_db),
):
    """List members with server-side pagination, filtering, searching and sorting."""
    members, total = await MemberService.get_all(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        status_filter=status,
        age=age,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return {"data": members, "total": total, "skip": skip, "limit": limit}


@router.get("/search", response_model=dict)
async def search_members(
    q: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    """Specific search endpoint to query members by name, phone, age, address, status."""
    members, total = await MemberService.get_all(
        db=db,
        skip=skip,
        limit=limit,
        search=q
    )
    return {"data": members, "total": total, "skip": skip, "limit": limit}


@router.get("/stats", response_model=dict)
async def get_member_stats(
    db: AsyncSession = Depends(get_db),
):
    """Retrieve summary statistics for the members management module."""
    return await MemberService.get_stats(db)


@router.post("/import", response_model=dict)
async def import_members(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Import members from a CSV file with validation and duplicate prevention."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type not supported. Please upload a CSV file."
        )
    return await MemberService.import_csv(db, file)


@router.get("/{member_id}", response_model=MemberResponse)
async def get_member(
    member_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single member's details by ID."""
    return await MemberService.get_by_id(db, member_id)


@router.post("", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
async def create_member(
    data: MemberCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new member in the database."""
    return await MemberService.create(db, data)


@router.put("/{member_id}", response_model=MemberResponse)
async def update_member(
    member_id: int,
    data: MemberUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a member's details by ID."""
    return await MemberService.update(db, member_id, data)


@router.delete("/{member_id}", response_model=dict)
async def delete_member(
    member_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Soft delete a member by changing status to INACTIVE."""
    return await MemberService.delete(db, member_id)
