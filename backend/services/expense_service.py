from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from models.expense import Expense
from schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from typing import Optional
from fastapi import HTTPException
from datetime import date


class ExpenseService:
    """Service layer for Expense operations."""

    @staticmethod
    async def get_all(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        search: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> tuple[list[ExpenseResponse], int]:
        """Get all expenses with optional category, search, and date range filtering."""
        query = select(Expense).where(Expense.is_deleted == False)

        if category:
            query = query.where(Expense.category == category)
        
        if search:
            query = query.where(
                or_(
                    Expense.description.ilike(f"%{search}%"),
                    Expense.paid_to.ilike(f"%{search}%"),
                    Expense.remarks.ilike(f"%{search}%"),
                )
            )

        if start_date:
            query = query.where(Expense.expense_date >= start_date)
        if end_date:
            query = query.where(Expense.expense_date <= end_date)

        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar() or 0

        query = query.order_by(Expense.expense_date.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        expenses = result.scalars().all()

        return [ExpenseResponse.model_validate(e) for e in expenses], total

    @staticmethod
    async def get_by_id(db: AsyncSession, expense_id: int) -> ExpenseResponse:
        """Get a single expense by ID."""
        result = await db.execute(select(Expense).where(Expense.id == expense_id, Expense.is_deleted == False))
        expense = result.scalar_one_or_none()
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        return ExpenseResponse.model_validate(expense)

    @staticmethod
    async def create(db: AsyncSession, data: ExpenseCreate) -> ExpenseResponse:
        """Create a new expense."""
        expense = Expense(**data.model_dump(exclude_none=True))
        db.add(expense)
        await db.flush()
        await db.refresh(expense)
        return ExpenseResponse.model_validate(expense)

    @staticmethod
    async def update(
        db: AsyncSession, expense_id: int, data: ExpenseUpdate
    ) -> ExpenseResponse:
        """Update an existing expense."""
        result = await db.execute(select(Expense).where(Expense.id == expense_id, Expense.is_deleted == False))
        expense = result.scalar_one_or_none()
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")

        update_data = data.model_dump(exclude_none=True)
        for key, value in update_data.items():
            setattr(expense, key, value)

        await db.flush()
        await db.refresh(expense)
        return ExpenseResponse.model_validate(expense)

    @staticmethod
    async def delete(db: AsyncSession, expense_id: int) -> dict:
        """Delete an expense (soft delete)."""
        result = await db.execute(select(Expense).where(Expense.id == expense_id, Expense.is_deleted == False))
        expense = result.scalar_one_or_none()
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")

        expense.is_deleted = True
        await db.flush()
        return {"message": "Expense deleted successfully"}

    @staticmethod
    async def get_total(db: AsyncSession) -> float:
        """Get total expenses."""
        result = await db.execute(select(func.coalesce(func.sum(Expense.amount), 0)).where(Expense.is_deleted == False))
        return float(result.scalar())

    @staticmethod
    async def get_by_category(db: AsyncSession) -> list[dict]:
        """Get expense totals grouped by category."""
        result = await db.execute(
            select(Expense.category, func.sum(Expense.amount).label("total"))
            .where(Expense.is_deleted == False)
            .group_by(Expense.category)
            .order_by(func.sum(Expense.amount).desc())
        )
        return [{"category": row[0], "total": float(row[1])} for row in result.all()]

    @staticmethod
    async def get_stats(db: AsyncSession) -> dict:
        """Get summary statistics for expenses."""
        from decimal import Decimal
        today = date.today()
        first_of_month = date(today.year, today.month, 1)

        # 1. Total expenses
        total_stmt = select(func.coalesce(func.sum(Expense.amount), 0)).where(Expense.is_deleted == False)
        total_expenses = (await db.execute(total_stmt)).scalar() or Decimal("0.00")

        # 2. Today's expenses
        today_stmt = select(func.coalesce(func.sum(Expense.amount), 0)).where(Expense.expense_date == today, Expense.is_deleted == False)
        today_expenses = (await db.execute(today_stmt)).scalar() or Decimal("0.00")

        # 3. This month's expenses
        month_stmt = select(func.coalesce(func.sum(Expense.amount), 0)).where(Expense.expense_date >= first_of_month, Expense.is_deleted == False)
        month_expenses = (await db.execute(month_stmt)).scalar() or Decimal("0.00")

        # 4. Highest category
        highest_stmt = (
            select(Expense.category, func.sum(Expense.amount).label("total"))
            .where(Expense.is_deleted == False)
            .group_by(Expense.category)
            .order_by(func.sum(Expense.amount).desc())
            .limit(1)
        )
        highest_res = (await db.execute(highest_stmt)).first()
        highest_category = highest_res[0].capitalize() if highest_res and highest_res[0] else "None"

        # 5. Category totals
        cat_stmt = (
            select(Expense.category, func.sum(Expense.amount))
            .where(Expense.is_deleted == False)
            .group_by(Expense.category)
        )
        cat_res = (await db.execute(cat_stmt)).all()
        category_totals = {row[0]: float(row[1]) for row in cat_res}

        return {
            "total_expenses": float(total_expenses),
            "today_expenses": float(today_expenses),
            "month_expenses": float(month_expenses),
            "highest_category": highest_category,
            "category_totals": category_totals
        }
