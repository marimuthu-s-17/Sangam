from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from services.dashboard_service import DashboardService
import sqlalchemy as sa
from typing import Optional

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("", response_model=dict)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    """Get dashboard summary statistics."""
    return await DashboardService.get_summary(db)


@router.get("/search", response_model=dict)
async def global_search(q: str = Query(..., min_length=1), db: AsyncSession = Depends(get_db)):
    """Search globally across Members, Auctions, Expenses, and Loans."""
    from sqlalchemy import select, or_
    from models.member import Member
    from models.auction import Auction
    from models.expense import Expense
    from models.loan import Loan

    # 1. Search Members
    member_res = await db.execute(
        select(Member)
        .where(or_(Member.name.ilike(f"%{q}%"), Member.phone.ilike(f"%{q}%")))
        .limit(10)
    )
    members = member_res.scalars().all()

    # 2. Search Auctions
    auction_res = await db.execute(
        select(Auction)
        .where(or_(Auction.name.ilike(f"%{q}%"), Auction.status.cast(sa.String).ilike(f"%{q}%")))
        .limit(10)
    )
    auctions = auction_res.scalars().all()

    # 3. Search Expenses
    expense_res = await db.execute(
        select(Expense)
        .where(
            or_(
                Expense.description.ilike(f"%{q}%"),
                Expense.category.ilike(f"%{q}%"),
                Expense.paid_to.ilike(f"%{q}%")
            )
        )
        .where(Expense.is_deleted == False)
        .limit(10)
    )
    expenses = expense_res.scalars().all()

    # 4. Search Loans
    loan_res = await db.execute(
        select(Loan)
        .where(or_(Loan.borrower_name.ilike(f"%{q}%"), Loan.status.ilike(f"%{q}%")))
        .limit(10)
    )
    loans = loan_res.scalars().all()

    return {
        "members": [
            {
                "id": m.id, 
                "title": m.name, 
                "subtitle": f"Phone: {m.phone} | Status: {m.status.value.capitalize() if hasattr(m.status, 'value') else str(m.status).capitalize()}"
            }
            for m in members
        ],
        "auctions": [
            {
                "id": a.id, 
                "title": a.name, 
                "subtitle": f"Months: {a.total_months} | Installment: ₹{float(a.monthly_contribution)} | Status: {a.status.value.capitalize() if hasattr(a.status, 'value') else str(a.status).capitalize()}"
            }
            for a in auctions
        ],
        "expenses": [
            {
                "id": e.id, 
                "title": e.description, 
                "subtitle": f"Category: {e.category} | Amount: ₹{float(e.amount)} | Date: {str(e.expense_date)}"
            }
            for e in expenses
        ],
        "loans": [
            {
                "id": l.id, 
                "title": f"Loan to {l.borrower_name}", 
                "subtitle": f"Amount: ₹{float(l.loan_amount)} | Status: {l.status.capitalize()} | Outstanding: ₹{float(l.outstanding_amount)}"
            }
            for l in loans
        ]
    }
