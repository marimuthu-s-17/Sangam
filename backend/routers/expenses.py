from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from services.expense_service import ExpenseService
from typing import Optional

from datetime import date

router = APIRouter(prefix="/api/v1/expenses", tags=["Expenses"])


@router.get("/stats", response_model=dict)
async def get_expense_stats(db: AsyncSession = Depends(get_db)):
    """Get expense summary stats."""
    return await ExpenseService.get_stats(db)


@router.get("", response_model=dict)
async def list_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List all expenses with pagination and filtering."""
    expenses, total = await ExpenseService.get_all(
        db, skip, limit, category, search, start_date, end_date
    )
    return {"data": expenses, "total": total, "skip": skip, "limit": limit}


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single expense by ID."""
    return await ExpenseService.get_by_id(db, expense_id)


@router.post("", response_model=ExpenseResponse, status_code=201)
async def create_expense(
    data: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new expense."""
    return await ExpenseService.create(db, data)


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing expense."""
    return await ExpenseService.update(db, expense_id, data)


@router.delete("/{expense_id}")
async def delete_expense(
    expense_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete an expense."""
    return await ExpenseService.delete(db, expense_id)
