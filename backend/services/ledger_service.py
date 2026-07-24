from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from decimal import Decimal
from typing import List, Dict, Any
from models.member import Member
from models.auction import Auction
from models.monthly_auction import AuctionMonth, MonthlyContribution, AuctionDividend


class LedgerService:
    """Service layer calculating read-only ledger aggregates and detailed statements."""

    @staticmethod
    async def get_all_members_ledger_summary(db: AsyncSession) -> List[Dict[str, Any]]:
        """Get summary metrics for all members for the Ledger Overview list."""
        stmt = select(Member).order_by(Member.name)
        res = await db.execute(stmt)
        members = res.scalars().all()

        summary_list = []
        for member in members:
            # 1. Total contributions paid & outstanding balance
            contributions_stmt = select(
                func.coalesce(func.sum(MonthlyContribution.paid_amount), 0),
                func.coalesce(
                    func.sum(
                        func.greatest(
                            MonthlyContribution.minimum_amount
                            - MonthlyContribution.paid_amount,
                            0,
                        )
                    ),
                    0,
                ),
            ).where(MonthlyContribution.member_id == member.id)
            contrib_res = await db.execute(contributions_stmt)
            total_contrib, outstanding = contrib_res.first()

            # 2. Total dividend received
            dividend_stmt = select(
                func.coalesce(func.sum(AuctionDividend.dividend_received), 0)
            ).where(AuctionDividend.member_id == member.id)
            div_res = await db.execute(dividend_stmt)
            total_dividend = div_res.scalar() or Decimal("0.00")

            # 3. Won rounds details
            won_months_stmt = (
                select(AuctionMonth, Auction)
                .join(Auction, Auction.id == AuctionMonth.auction_id)
                .where(AuctionMonth.winning_member_id == member.id)
                .where(AuctionMonth.status == "completed")
            )
            won_months_res = await db.execute(won_months_stmt)
            won_rounds = won_months_res.all()

            total_prize_won = Decimal("0.00")
            won_labels = []
            for am, auc in won_rounds:
                prize = auc.prize_amount
                bid = am.bid_amount or Decimal("0.00")
                winner_payout = prize - bid
                total_prize_won += winner_payout
                won_labels.append(f"{auc.name} (Month {am.month_number})")

            winning_month_str = ", ".join(won_labels) if won_labels else "None"

            # 4. Overall Net Position = Prize Won + Dividend Received - Paid Contributions
            net_position = total_prize_won + total_dividend - total_contrib

            summary_list.append(
                {
                    "member_id": member.id,
                    "name": member.name,
                    "phone": member.phone,
                    "total_contributions": float(total_contrib),
                    "total_dividend_received": float(total_dividend),
                    "total_prize_won": float(total_prize_won),
                    "winning_month": winning_month_str,
                    "outstanding_balance": float(outstanding),
                    "overall_net_position": float(net_position),
                }
            )

        return summary_list

    @staticmethod
    async def get_member_detailed_ledger(
        db: AsyncSession, member_id: int
    ) -> List[Dict[str, Any]]:
        """Get month-by-month historical ledger entries for a single member."""
        contrib_stmt = (
            select(MonthlyContribution, AuctionMonth, Auction)
            .join(
                AuctionMonth,
                AuctionMonth.id == MonthlyContribution.auction_month_id,
            )
            .join(Auction, Auction.id == AuctionMonth.auction_id)
            .where(MonthlyContribution.member_id == member_id)
            .where(AuctionMonth.status == "completed")
            .order_by(
                AuctionMonth.auction_date.desc(), AuctionMonth.month_number.desc()
            )
        )
        res = await db.execute(contrib_stmt)
        rows = res.all()

        detailed_list = []
        for contrib, am, auc in rows:
            # Check if this member was the winner of this specific month
            won_this_month = am.winning_member_id == member_id
            winning_amount = (
                (auc.prize_amount - am.bid_amount)
                if won_this_month
                else Decimal("0.00")
            )

            # Get dividend received for this specific month
            div_stmt = select(AuctionDividend.dividend_received).where(
                AuctionDividend.auction_month_id == am.id,
                AuctionDividend.member_id == member_id,
            )
            div_res = await db.execute(div_stmt)
            dividend_received = div_res.scalar() or Decimal("0.00")

            req = contrib.minimum_amount
            paid = contrib.paid_amount
            balance = req - paid
            if balance < 0:
                balance = Decimal("0.00")

            # Month Net Position = Winning Amount + Dividend Received - Paid Contribution
            month_net_position = winning_amount + dividend_received - paid

            detailed_list.append(
                {
                    "month_number": am.month_number,
                    "auction_name": auc.name,
                    "contribution_required": float(req),
                    "contribution_paid": float(paid),
                    "pending_balance": float(balance),
                    "dividend_received": float(dividend_received),
                    "won_this_month": won_this_month,
                    "winning_amount": float(winning_amount),
                    "net_position": float(month_net_position),
                    "payment_date": (
                        contrib.payment_date.isoformat()
                        if contrib.payment_date
                        else None
                    ),
                }
            )

        return detailed_list
