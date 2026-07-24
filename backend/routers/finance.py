from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from schemas.finance import FinanceCreate, FinanceUpdate, FinanceResponse
from services.finance_service import FinanceService
from typing import Optional

router = APIRouter(prefix="/api/v1/finance", tags=["Finance"])


@router.get("", response_model=dict)
async def list_finances(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    transaction_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List all finance records with pagination and filtering."""
    finances, total = await FinanceService.get_all(db, skip, limit, transaction_type)
    return {"data": finances, "total": total, "skip": skip, "limit": limit}


@router.get("/{finance_id}", response_model=FinanceResponse)
async def get_finance(
    finance_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single finance record by ID."""
    return await FinanceService.get_by_id(db, finance_id)


@router.post("", response_model=FinanceResponse, status_code=201)
async def create_finance(
    data: FinanceCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new finance record."""
    return await FinanceService.create(db, data)


@router.put("/{finance_id}", response_model=FinanceResponse)
async def update_finance(
    finance_id: int,
    data: FinanceUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing finance record."""
    return await FinanceService.update(db, finance_id, data)


@router.delete("/{finance_id}")
async def delete_finance(
    finance_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a finance record."""
    return await FinanceService.delete(db, finance_id)
