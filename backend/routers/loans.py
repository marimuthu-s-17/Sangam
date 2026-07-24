from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from schemas.loan import LoanCreate, LoanUpdate, LoanResponse, LoansListResponse, LoanPaymentCreate, LoanPaymentResponse
from services.loan_service import LoanService
from typing import Optional, List

router = APIRouter(prefix="/api/v1/loans", tags=["Loans"])


@router.get("/stats", response_model=dict)
async def get_loan_stats(db: AsyncSession = Depends(get_db)):
    """Get overall loan statistics."""
    return await LoanService.get_stats(db)


@router.get("", response_model=LoansListResponse)
async def list_loans(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List loans with optional search and status filtering."""
    loans, total = await LoanService.get_all(db, skip, limit, status_filter, search)
    return LoansListResponse(
        data=[LoanResponse.model_validate(l) for l in loans],
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/{loan_id}", response_model=LoanResponse)
async def get_loan(loan_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single loan by ID."""
    loan = await LoanService.get_by_id(db, loan_id)
    return LoanResponse.model_validate(loan)


@router.post("", response_model=LoanResponse, status_code=201)
async def create_loan(data: LoanCreate, db: AsyncSession = Depends(get_db)):
    """Create a new loan."""
    loan = await LoanService.create(db, data)
    return LoanResponse.model_validate(loan)


@router.put("/{loan_id}", response_model=LoanResponse)
async def update_loan(loan_id: int, data: LoanUpdate, db: AsyncSession = Depends(get_db)):
    """Update an existing loan's details."""
    loan = await LoanService.update(db, loan_id, data)
    return LoanResponse.model_validate(loan)


@router.delete("/{loan_id}", response_model=dict)
async def delete_loan(loan_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a loan."""
    return await LoanService.delete(db, loan_id)


@router.post("/{loan_id}/payments", response_model=LoanPaymentResponse, status_code=201)
async def record_loan_payment(
    loan_id: int, data: LoanPaymentCreate, db: AsyncSession = Depends(get_db)
):
    """Record a principal or interest payment for a loan."""
    payment = await LoanService.record_payment(db, loan_id, data)
    return LoanPaymentResponse.model_validate(payment)


@router.get("/{loan_id}/payments", response_model=List[LoanPaymentResponse])
async def list_loan_payments(
    loan_id: int, db: AsyncSession = Depends(get_db)
):
    """Get all interest/principal payments recorded for a loan."""
    loan = await LoanService.get_by_id(db, loan_id)
    return [LoanPaymentResponse.model_validate(p) for p in loan.payments]
