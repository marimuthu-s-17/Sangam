from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from models.member import Member, MemberStatus
from models.auction import Auction, AuctionStatus
from models.expense import Expense
from models.finance import Finance, TransactionType
from models.monthly_auction import AuctionMonth, MonthlyContribution
from models.loan import Loan, LoanPayment
from datetime import date
from decimal import Decimal


class DashboardService:
    """Service layer for Dashboard aggregation."""

    @staticmethod
    async def get_summary(db: AsyncSession) -> dict:
        """Get dashboard summary statistics."""
        today = date.today()

        # 1. Total members
        total_members = (await db.execute(select(func.count(Member.id)))).scalar() or 0

        # 2. Active auctions
        active_auctions = (await db.execute(select(func.count(Auction.id)).where(Auction.status == AuctionStatus.ACTIVE))).scalar() or 0

        # 3. Completed auctions
        completed_auctions = (await db.execute(select(func.count(Auction.id)).where(Auction.status == AuctionStatus.COMPLETED))).scalar() or 0

        # 4. Current month collection (from MonthlyContribution)
        current_month_collection = (await db.execute(
            select(func.coalesce(func.sum(MonthlyContribution.paid_amount), 0))
            .where(func.extract('month', MonthlyContribution.payment_date) == today.month)
            .where(func.extract('year', MonthlyContribution.payment_date) == today.year)
        )).scalar() or Decimal("0.00")

        # 5. Total expenses
        total_expenses = (await db.execute(select(func.coalesce(func.sum(Expense.amount), 0)).where(Expense.is_deleted == False))).scalar() or Decimal("0.00")

        # 6. Total loans issued (sum of principal)
        total_loans_amount = (await db.execute(select(func.coalesce(func.sum(Loan.loan_amount), 0)))).scalar() or Decimal("0.00")

        # 7. Outstanding loans
        outstanding_loans = (await db.execute(select(func.coalesce(func.sum(Loan.outstanding_amount), 0)).where(Loan.status != "closed"))).scalar() or Decimal("0.00")

        # 8. Interest earned
        interest_earned = (await db.execute(select(func.coalesce(func.sum(LoanPayment.interest_payment), 0)))).scalar() or Decimal("0.00")

        # 9. Available Balance / Cash Available calculations
        total_contributions = (await db.execute(select(func.coalesce(func.sum(MonthlyContribution.paid_amount), 0)))).scalar() or Decimal("0.00")
        total_receipts = (await db.execute(select(func.coalesce(func.sum(Finance.amount), 0)).where(Finance.transaction_type == TransactionType.RECEIPT))).scalar() or Decimal("0.00")
        total_payments = (await db.execute(select(func.coalesce(func.sum(Finance.amount), 0)).where(Finance.transaction_type == TransactionType.PAYMENT))).scalar() or Decimal("0.00")
        loan_principal_repayments = (await db.execute(select(func.coalesce(func.sum(LoanPayment.principal_payment), 0)))).scalar() or Decimal("0.00")

        # Inflows: contributions + general receipts + interest + principal repayments
        cash_inflows = total_contributions + total_receipts + interest_earned + loan_principal_repayments
        # Outflows: expenses + loans issued + general payments
        cash_outflows = total_expenses + total_loans_amount + total_payments
        available_balance = cash_inflows - cash_outflows

        # Profit & Loss
        overall_profit_loss = interest_earned + total_receipts - total_expenses - total_payments

        # Recent Activity Queries
        # Latest Member
        member_res = await db.execute(select(Member).order_by(Member.created_at.desc()).limit(1))
        m = member_res.scalar_one_or_none()
        latest_member = {
            "name": m.name,
            "date": str(m.created_at.date()) if m.created_at else None,
            "status": m.status
        } if m else None

        # Latest Winner
        winner_res = await db.execute(
            select(AuctionMonth)
            .options(selectinload(AuctionMonth.winning_member), selectinload(AuctionMonth.auction))
            .where(AuctionMonth.status == "completed")
            .order_by(AuctionMonth.auction_date.desc(), AuctionMonth.id.desc())
            .limit(1)
        )
        aw = winner_res.scalar_one_or_none()
        latest_winner = {
            "name": aw.winning_member.name if aw.winning_member else "N/A",
            "auction_name": aw.auction.name if aw.auction else "N/A",
            "month_number": aw.month_number,
            "date": str(aw.auction_date) if aw.auction_date else None
        } if aw else None

        # Latest Expense
        expense_res = await db.execute(
            select(Expense)
            .where(Expense.is_deleted == False)
            .order_by(Expense.expense_date.desc(), Expense.id.desc())
            .limit(1)
        )
        ex = expense_res.scalar_one_or_none()
        latest_expense = {
            "description": ex.description,
            "amount": float(ex.amount),
            "date": str(ex.expense_date),
            "category": ex.category
        } if ex else None

        # Latest Loan
        loan_res = await db.execute(select(Loan).order_by(Loan.loan_date.desc(), Loan.id.desc()).limit(1))
        lo = loan_res.scalar_one_or_none()
        latest_loan = {
            "borrower_name": lo.borrower_name,
            "amount": float(lo.loan_amount),
            "date": str(lo.loan_date),
            "status": lo.status
        } if lo else None

        # Latest Interest Payment
        payment_res = await db.execute(
            select(LoanPayment)
            .options(selectinload(LoanPayment.loan))
            .where(LoanPayment.interest_payment > 0)
            .order_by(LoanPayment.payment_date.desc(), LoanPayment.id.desc())
            .limit(1)
        )
        py = payment_res.scalar_one_or_none()
        latest_interest_payment = {
            "borrower_name": py.loan.borrower_name if py.loan else "N/A",
            "interest_payment": float(py.interest_payment),
            "principal_payment": float(py.principal_payment),
            "date": str(py.payment_date)
        } if py else None

        # Last 6 Months Chart Aggregations
        monthly_collections = []
        monthly_expenses = []
        monthly_profit_loss = []
        
        for i in range(5, -1, -1):
            target_month = today.month - i
            target_year = today.year
            while target_month <= 0:
                target_month += 12
                target_year -= 1
            
            month_start = date(target_year, target_month, 1)
            if target_month == 12:
                month_end = date(target_year + 1, 1, 1)
            else:
                month_end = date(target_year, target_month + 1, 1)
                
            col_val = (await db.execute(
                select(func.coalesce(func.sum(MonthlyContribution.paid_amount), 0))
                .where(MonthlyContribution.payment_date >= month_start)
                .where(MonthlyContribution.payment_date < month_end)
            )).scalar() or Decimal("0.00")
            
            rec_val = (await db.execute(
                select(func.coalesce(func.sum(Finance.amount), 0))
                .where(Finance.transaction_type == TransactionType.RECEIPT)
                .where(Finance.transaction_date >= month_start)
                .where(Finance.transaction_date < month_end)
            )).scalar() or Decimal("0.00")
            
            exp_val = (await db.execute(
                select(func.coalesce(func.sum(Expense.amount), 0))
                .where(Expense.is_deleted == False)
                .where(Expense.expense_date >= month_start)
                .where(Expense.expense_date < month_end)
            )).scalar() or Decimal("0.00")
            
            pay_val = (await db.execute(
                select(func.coalesce(func.sum(Finance.amount), 0))
                .where(Finance.transaction_type == TransactionType.PAYMENT)
                .where(Finance.transaction_date >= month_start)
                .where(Finance.transaction_date < month_end)
            )).scalar() or Decimal("0.00")
            
            int_val = (await db.execute(
                select(func.coalesce(func.sum(LoanPayment.interest_payment), 0))
                .where(LoanPayment.payment_date >= month_start)
                .where(LoanPayment.payment_date < month_end)
            )).scalar() or Decimal("0.00")
            
            month_label = month_start.strftime("%b %Y")
            monthly_collections.append({"month": month_label, "amount": float(col_val + rec_val)})
            monthly_expenses.append({"month": month_label, "amount": float(exp_val + pay_val)})
            monthly_profit_loss.append({"month": month_label, "amount": float(int_val + rec_val - exp_val - pay_val)})

        # Loan Status Breakdown
        status_stmt = select(Loan.status, func.count(Loan.id), func.coalesce(func.sum(Loan.loan_amount), 0)).group_by(Loan.status)
        status_res = (await db.execute(status_stmt)).all()
        loan_status_data = [
            {"status": row[0], "count": row[1], "amount": float(row[2])}
            for row in status_res
        ]

        # Expense by Category
        cat_stmt = select(Expense.category, func.coalesce(func.sum(Expense.amount), 0)).where(Expense.is_deleted == False).group_by(Expense.category)
        cat_res = (await db.execute(cat_stmt)).all()
        expense_categories_data = [
            {"category": row[0].capitalize(), "amount": float(row[1])}
            for row in cat_res
        ]

        # Legacy structures for backward compatibility
        recent_auctions_result = await db.execute(
            select(AuctionMonth)
            .options(
                selectinload(AuctionMonth.winning_member),
                selectinload(AuctionMonth.auction)
            )
            .order_by(AuctionMonth.auction_date.desc(), AuctionMonth.id.desc())
            .limit(5)
        )
        recent_auctions = []
        for am in recent_auctions_result.scalars().all():
            recent_auctions.append({
                "id": am.id,
                "auction_number": am.month_number,
                "auction_date": str(am.auction_date) if am.auction_date else str(am.created_at.date()),
                "member_name": am.winning_member.name if am.winning_member else "N/A",
                "amount": float(am.bid_amount) if am.bid_amount else 0.0,
                "status": am.status,
            })

        recent_transactions_result = await db.execute(
            select(Finance)
            .options(selectinload(Finance.member))
            .order_by(Finance.transaction_date.desc())
            .limit(5)
        )
        recent_transactions = []
        for finance in recent_transactions_result.scalars().all():
            recent_transactions.append({
                "id": finance.id,
                "member_name": finance.member.name if finance.member else "N/A",
                "transaction_type": finance.transaction_type,
                "amount": float(finance.amount),
                "transaction_date": str(finance.transaction_date),
                "description": finance.description,
            })

        return {
            "total_members": total_members,
            "active_auctions": active_auctions,
            "completed_auctions": completed_auctions,
            "current_month_collection": float(current_month_collection),
            "total_expenses": float(total_expenses),
            "total_loans": float(total_loans_amount),
            "outstanding_loans": float(outstanding_loans),
            "interest_earned": float(interest_earned),
            "available_balance": float(available_balance),
            "overall_profit_loss": float(overall_profit_loss),
            "charts": {
                "monthly_collections": monthly_collections,
                "monthly_expenses": monthly_expenses,
                "profit_loss": monthly_profit_loss,
                "loan_status": loan_status_data,
                "expense_categories": expense_categories_data,
            },
            "recent_activity": {
                "latest_member": latest_member,
                "latest_winner": latest_winner,
                "latest_expense": latest_expense,
                "latest_loan": latest_loan,
                "latest_interest_payment": latest_interest_payment,
            },
            # For backward compatibility
            "fund_balance": float(available_balance),
            "recent_auctions": recent_auctions,
            "recent_transactions": recent_transactions,
        }
