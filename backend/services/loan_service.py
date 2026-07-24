from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from models.loan import Loan, LoanPayment
from models.member import Member
from schemas.loan import LoanCreate, LoanUpdate, LoanPaymentCreate
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from datetime import date
from decimal import Decimal


class LoanService:
    """Service layer for Loan and LoanPayment operations."""

    @staticmethod
    def recalculate_loan(loan: Loan) -> None:
        """Recalculates accrued interest, outstanding balance, next due date, and updates status."""
        from sqlalchemy import inspect
        import calendar
        today = date.today()

        # 1. Totals paid from database history
        insp = inspect(loan)
        if insp.transient or "payments" in insp.unloaded:
            total_interest_paid = Decimal("0.00")
            total_principal_paid = Decimal("0.00")
        else:
            total_interest_paid = sum(p.interest_payment for p in loan.payments)
            total_principal_paid = sum(p.principal_payment for p in loan.payments)

        # 2. Outstanding Principal
        outstanding_principal = loan.loan_amount - total_principal_paid
        if outstanding_principal < Decimal("0.00"):
            outstanding_principal = Decimal("0.00")

        # 3. Monthly Interest Amount
        rate_fraction = loan.interest_rate / Decimal("100.0")
        monthly_interest_amount = outstanding_principal * rate_fraction
        loan.monthly_interest_amount = round(monthly_interest_amount, 2)

        # 4. Elapsed months for accrued interest calculation
        def get_elapsed_months(start: date, end: date) -> int:
            if end <= start:
                return 0
            months = (end.year - start.year) * 12 + (end.month - start.month)
            if end.day < start.day:
                months -= 1
            return max(0, months)

        months_elapsed = get_elapsed_months(loan.loan_date, today)
        accrued_interest = Decimal(months_elapsed) * monthly_interest_amount
        accrued_interest = round(accrued_interest, 2)

        # 5. Unpaid Interest / Interest Due
        interest_due = accrued_interest - total_interest_paid
        if interest_due < Decimal("0.00"):
            interest_due = Decimal("0.00")
        loan.interest_due = round(interest_due, 2)

        # 6. Outstanding Balance = Principal Outstanding + Unpaid Interest
        loan.outstanding_amount = round(outstanding_principal + interest_due, 2)

        # 7. Next Interest Due Date anniversary
        def calculate_next_due_date(start: date, curr_date: date) -> date:
            y, m = curr_date.year, curr_date.month
            max_day = calendar.monthrange(y, m)[1]
            candidate = date(y, m, min(start.day, max_day))
            if candidate > curr_date:
                return candidate
            next_m = m + 1
            next_y = y
            if next_m > 12:
                next_m = 1
                next_y += 1
            max_day = calendar.monthrange(next_y, next_m)[1]
            return date(next_y, next_m, min(start.day, max_day))

        next_due = calculate_next_due_date(loan.loan_date, today)
        loan.due_date = next_due
        loan.days_remaining = max(0, (next_due - today).days)

        # 8. Status update
        if loan.outstanding_amount <= Decimal("0.00"):
            loan.status = "closed"
        elif today > loan.due_date:
            loan.status = "overdue"
        else:
            loan.status = "active"

    @staticmethod
    async def get_all(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Loan], int]:
        """Fetch all loans with searching, filtering, and pagination."""
        query = select(Loan).options(selectinload(Loan.payments))

        if status_filter:
            query = query.where(Loan.status == status_filter)
        if search:
            query = query.where(
                or_(
                    Loan.borrower_name.ilike(f"%{search}%"),
                    Loan.phone_number.ilike(f"%{search}%"),
                    Loan.remarks.ilike(f"%{search}%"),
                )
            )

        # Count total matches before pagination
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar() or 0

        query = query.order_by(Loan.loan_date.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        loans = list(result.scalars().all())

        for loan in loans:
            LoanService.recalculate_loan(loan)
        
        await db.flush()
        return loans, total

    @staticmethod
    async def get_by_id(db: AsyncSession, loan_id: int) -> Loan:
        """Fetch a single loan by ID and recalculate it."""
        query = select(Loan).where(Loan.id == loan_id).options(selectinload(Loan.payments))
        result = await db.execute(query)
        loan = result.scalar_one_or_none()
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        LoanService.recalculate_loan(loan)
        await db.flush()
        return loan

    @staticmethod
    async def create(db: AsyncSession, data: LoanCreate) -> Loan:
        """Create a new loan."""
        loan_dict = data.model_dump()
        loan_dict["outstanding_amount"] = data.loan_amount
        loan_dict["status"] = "active"

        loan = Loan(**loan_dict)
        db.add(loan)
        await db.flush()
        
        LoanService.recalculate_loan(loan)
        await db.flush()
        await db.refresh(loan)
        return loan

    @staticmethod
    async def update(db: AsyncSession, loan_id: int, data: LoanUpdate) -> Loan:
        """Update an existing loan."""
        loan = await LoanService.get_by_id(db, loan_id)
        
        update_data = data.model_dump(exclude_none=True)
        for key, value in update_data.items():
            setattr(loan, key, value)
            
        await db.flush()
        LoanService.recalculate_loan(loan)
        await db.flush()
        await db.refresh(loan)
        return loan

    @staticmethod
    async def delete(db: AsyncSession, loan_id: int) -> dict:
        """Delete a loan."""
        loan = await LoanService.get_by_id(db, loan_id)
        await db.delete(loan)
        await db.flush()
        return {"message": "Loan deleted successfully"}

    @staticmethod
    async def record_payment(db: AsyncSession, loan_id: int, data: LoanPaymentCreate) -> LoanPayment:
        """Record an interest or principal payment towards a loan."""
        loan = await LoanService.get_by_id(db, loan_id)

        # Calculate outstanding before this payment
        total_payment = data.interest_payment + data.principal_payment
        previous_outstanding = loan.outstanding_amount
        remaining_balance = previous_outstanding - total_payment
        if remaining_balance < 0:
            remaining_balance = Decimal("0.00")

        payment = LoanPayment(
            loan_id=loan_id,
            interest_payment=data.interest_payment,
            principal_payment=data.principal_payment,
            remaining_balance=remaining_balance,
            payment_date=data.payment_date,
            payment_method=data.payment_method,
            notes=data.notes
        )
        db.add(payment)
        await db.flush()

        # Update loan outstanding and status
        LoanService.recalculate_loan(loan)
        await db.flush()
        await db.refresh(payment)
        return payment

    @staticmethod
    async def get_stats(db: AsyncSession) -> dict:
        """Retrieve summary statistics for the Finance/Loans module."""
        result = await db.execute(select(Loan).options(selectinload(Loan.payments)))
        loans = list(result.scalars().all())

        total_loans_count = len(loans)
        active_loans_count = 0
        closed_loans_count = 0
        total_interest_earned = Decimal("0.00")
        total_outstanding_balance = Decimal("0.00")

        for loan in loans:
            LoanService.recalculate_loan(loan)
            
            if loan.status == "closed":
                closed_loans_count += 1
            else:
                active_loans_count += 1
                total_outstanding_balance += loan.outstanding_amount
            
            total_interest_earned += sum(p.interest_payment for p in loan.payments)

        await db.flush()
        return {
            "total_loans": total_loans_count,
            "active_loans": active_loans_count,
            "closed_loans": closed_loans_count,
            "interest_earned": float(total_interest_earned),
            "outstanding_balance": float(total_outstanding_balance)
        }
