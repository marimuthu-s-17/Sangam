from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from models.finance import Finance, TransactionType
from schemas.finance import FinanceCreate, FinanceUpdate, FinanceResponse
from typing import Optional
from fastapi import HTTPException


class FinanceService:
    """Service layer for Finance operations."""

    @staticmethod
    def _to_response(finance: Finance) -> FinanceResponse:
        """Convert finance model to response with member name."""
        data = {
            "id": finance.id,
            "member_id": finance.member_id,
            "member_name": finance.member.name if finance.member else None,
            "transaction_type": finance.transaction_type,
            "amount": finance.amount,
            "description": finance.description,
            "transaction_date": finance.transaction_date,
            "reference_number": finance.reference_number,
            "created_at": finance.created_at,
            "updated_at": finance.updated_at,
        }
        return FinanceResponse(**data)

    @staticmethod
    async def get_all(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        transaction_type: Optional[str] = None,
    ) -> tuple[list[FinanceResponse], int]:
        """Get all finance records with optional type filtering."""
        query = select(Finance)

        if transaction_type:
            query = query.where(Finance.transaction_type == transaction_type)

        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar()

        query = query.order_by(Finance.transaction_date.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        finances = result.scalars().all()

        return [FinanceService._to_response(f) for f in finances], total

    @staticmethod
    async def get_by_id(db: AsyncSession, finance_id: int) -> FinanceResponse:
        """Get a single finance record by ID."""
        result = await db.execute(select(Finance).where(Finance.id == finance_id))
        finance = result.scalar_one_or_none()
        if not finance:
            raise HTTPException(status_code=404, detail="Finance record not found")
        return FinanceService._to_response(finance)

    @staticmethod
    async def create(db: AsyncSession, data: FinanceCreate) -> FinanceResponse:
        """Create a new finance record."""
        finance = Finance(**data.model_dump(exclude_none=True))
        db.add(finance)
        await db.flush()
        await db.refresh(finance)
        return FinanceService._to_response(finance)

    @staticmethod
    async def update(
        db: AsyncSession, finance_id: int, data: FinanceUpdate
    ) -> FinanceResponse:
        """Update an existing finance record."""
        result = await db.execute(select(Finance).where(Finance.id == finance_id))
        finance = result.scalar_one_or_none()
        if not finance:
            raise HTTPException(status_code=404, detail="Finance record not found")

        update_data = data.model_dump(exclude_none=True)
        for key, value in update_data.items():
            setattr(finance, key, value)

        await db.flush()
        await db.refresh(finance)
        return FinanceService._to_response(finance)

    @staticmethod
    async def delete(db: AsyncSession, finance_id: int) -> dict:
        """Delete a finance record."""
        result = await db.execute(select(Finance).where(Finance.id == finance_id))
        finance = result.scalar_one_or_none()
        if not finance:
            raise HTTPException(status_code=404, detail="Finance record not found")

        await db.delete(finance)
        await db.flush()
        return {"message": "Finance record deleted successfully"}

    @staticmethod
    async def get_total_receipts(db: AsyncSession) -> float:
        """Get total receipt amount."""
        result = await db.execute(
            select(func.coalesce(func.sum(Finance.amount), 0)).where(
                Finance.transaction_type == TransactionType.RECEIPT
            )
        )
        return float(result.scalar())

    @staticmethod
    async def get_total_payments(db: AsyncSession) -> float:
        """Get total payment amount."""
        result = await db.execute(
            select(func.coalesce(func.sum(Finance.amount), 0)).where(
                Finance.transaction_type == TransactionType.PAYMENT
            )
        )
        return float(result.scalar())
