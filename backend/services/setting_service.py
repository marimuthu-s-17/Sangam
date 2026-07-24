from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.setting import Setting
from schemas.setting import SettingUpdate
from decimal import Decimal
from datetime import date

class SettingService:
    """Service layer for managing system settings, backups, and restores."""

    @staticmethod
    async def get(db: AsyncSession) -> Setting:
        """Fetch the single system settings record. Create with defaults if missing."""
        result = await db.execute(select(Setting).where(Setting.id == 1))
        setting = result.scalar_one_or_none()
        if not setting:
            setting = Setting(
                id=1,
                community_name="Sangam Community",
                default_commission=Decimal("2.00"),
                default_monthly_contribution=Decimal("1000.00"),
                currency="INR",
                theme="light"
            )
            db.add(setting)
            await db.commit()
            await db.refresh(setting)
        return setting

    @staticmethod
    async def update(db: AsyncSession, data: SettingUpdate) -> Setting:
        """Update system settings details."""
        setting = await SettingService.get(db)
        
        setting.community_name = data.community_name
        setting.default_commission = data.default_commission
        setting.default_monthly_contribution = data.default_monthly_contribution
        setting.currency = data.currency
        setting.theme = data.theme
        
        await db.commit()
        await db.refresh(setting)
        return setting

    @staticmethod
    async def backup_db(db: AsyncSession) -> dict:
        """Dumps all database tables into a dictionary structure."""
        from models.member import Member
        from models.auction import Auction, AuctionMember
        from models.expense import Expense
        from models.finance import Finance
        from models.loan import Loan, LoanPayment
        from models.monthly_auction import AuctionMonth, MonthlyContribution, AuctionDividend
        from models.setting import Setting

        async def get_all_rows(model):
            res = await db.execute(select(model))
            return res.scalars().all()

        members = await get_all_rows(Member)
        auctions = await get_all_rows(Auction)
        expenses = await get_all_rows(Expense)
        loans = await get_all_rows(Loan)
        loan_payments = await get_all_rows(LoanPayment)
        finances = await get_all_rows(Finance)
        auction_months = await get_all_rows(AuctionMonth)
        monthly_contributions = await get_all_rows(MonthlyContribution)
        auction_dividends = await get_all_rows(AuctionDividend)
        settings = await get_all_rows(Setting)

        # For association table AuctionMember
        assoc_res = await db.execute(select(AuctionMember))
        auction_members = assoc_res.scalars().all()

        return {
            "members": [
                {
                    "id": m.id,
                    "name": m.name,
                    "phone": m.phone,
                    "age": m.age,
                    "gender": m.gender,
                    "address": m.address,
                    "status": m.status,
                    "joined_date": str(m.joined_date) if m.joined_date else None,
                    "notes": m.notes,
                    "created_at": m.created_at.isoformat() if m.created_at else None,
                    "updated_at": m.updated_at.isoformat() if m.updated_at else None,
                } for m in members
            ],
            "auctions": [
                {
                    "id": a.id,
                    "name": a.name,
                    "description": a.description,
                    "prize_amount": float(a.prize_amount),
                    "commission": float(a.commission),
                    "monthly_contribution": float(a.monthly_contribution),
                    "total_months": a.total_months,
                    "start_date": str(a.start_date) if a.start_date else None,
                    "current_month": a.current_month,
                    "status": a.status,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                    "updated_at": a.updated_at.isoformat() if a.updated_at else None,
                } for a in auctions
            ],
            "expenses": [
                {
                    "id": e.id,
                    "description": e.description,
                    "amount": float(e.amount),
                    "category": e.category,
                    "expense_date": str(e.expense_date),
                    "paid_to": e.paid_to,
                    "notes": e.notes,
                    "payment_method": e.payment_method,
                    "remarks": e.remarks,
                    "is_deleted": e.is_deleted,
                    "created_at": e.created_at.isoformat() if e.created_at else None,
                    "updated_at": e.updated_at.isoformat() if e.updated_at else None,
                } for e in expenses
            ],
            "loans": [
                {
                    "id": l.id,
                    "borrower_name": l.borrower_name,
                    "phone_number": l.phone_number,
                    "member_id": l.member_id,
                    "loan_amount": float(l.loan_amount),
                    "interest_rate": float(l.interest_rate),
                    "loan_date": str(l.loan_date),
                    "due_date": str(l.due_date),
                    "outstanding_amount": float(l.outstanding_amount),
                    "status": l.status,
                    "remarks": l.remarks,
                    "created_at": l.created_at.isoformat() if l.created_at else None,
                    "updated_at": l.updated_at.isoformat() if l.updated_at else None,
                } for l in loans
            ],
            "loan_payments": [
                {
                    "id": lp.id,
                    "loan_id": lp.loan_id,
                    "interest_payment": float(lp.interest_payment),
                    "principal_payment": float(lp.principal_payment),
                    "remaining_balance": float(lp.remaining_balance),
                    "payment_date": str(lp.payment_date),
                    "payment_method": lp.payment_method,
                    "notes": lp.notes,
                    "created_at": lp.created_at.isoformat() if lp.created_at else None,
                    "updated_at": lp.updated_at.isoformat() if lp.updated_at else None,
                } for lp in loan_payments
            ],
            "finances": [
                {
                    "id": f.id,
                    "member_id": f.member_id,
                    "transaction_type": f.transaction_type.value if hasattr(f.transaction_type, "value") else f.transaction_type,
                    "amount": float(f.amount),
                    "description": f.description,
                    "transaction_date": str(f.transaction_date),
                    "reference_number": f.reference_number,
                    "created_at": f.created_at.isoformat() if f.created_at else None,
                    "updated_at": f.updated_at.isoformat() if f.updated_at else None,
                } for f in finances
            ],
            "auction_months": [
                {
                    "id": am.id,
                    "auction_id": am.auction_id,
                    "month_number": am.month_number,
                    "auction_date": str(am.auction_date) if am.auction_date else None,
                    "winning_member_id": am.winning_member_id,
                    "bid_amount": float(am.bid_amount) if am.bid_amount else 0.0,
                    "community_commission": float(am.community_commission) if am.community_commission else 0.0,
                    "dividend_per_member": float(am.dividend_per_member) if am.dividend_per_member else 0.0,
                    "status": am.status,
                    "created_at": am.created_at.isoformat() if am.created_at else None,
                    "updated_at": am.updated_at.isoformat() if am.updated_at else None,
                } for am in auction_months
            ],
            "monthly_contributions": [
                {
                    "id": mc.id,
                    "auction_month_id": mc.auction_month_id,
                    "member_id": mc.member_id,
                    "minimum_amount": float(mc.minimum_amount),
                    "paid_amount": float(mc.paid_amount),
                    "paid_status": mc.paid_status,
                    "payment_date": str(mc.payment_date) if mc.payment_date else None,
                    "created_at": mc.created_at.isoformat() if mc.created_at else None,
                    "updated_at": mc.updated_at.isoformat() if mc.updated_at else None,
                } for mc in monthly_contributions
            ],
            "auction_dividends": [
                {
                    "id": ad.id,
                    "auction_month_id": ad.auction_month_id,
                    "member_id": ad.member_id,
                    "dividend_received": float(ad.dividend_received),
                    "created_at": ad.created_at.isoformat() if ad.created_at else None,
                    "updated_at": ad.updated_at.isoformat() if ad.updated_at else None,
                } for ad in auction_dividends
            ],
            "settings": [
                {
                    "id": s.id,
                    "community_name": s.community_name,
                    "default_commission": float(s.default_commission),
                    "default_monthly_contribution": float(s.default_monthly_contribution),
                    "currency": s.currency,
                    "theme": s.theme,
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                    "updated_at": s.updated_at.isoformat() if s.updated_at else None,
                } for s in settings
            ],
            "auction_members": [
                {
                    "id": am.id,
                    "auction_id": am.auction_id,
                    "member_id": am.member_id,
                    "date_joined": str(am.date_joined) if am.date_joined else None,
                    "is_winner": am.is_winner,
                    "winning_month": am.winning_month,
                    "is_active": am.is_active,
                    "created_at": am.created_at.isoformat() if am.created_at else None,
                    "updated_at": am.updated_at.isoformat() if am.updated_at else None,
                } for am in auction_members
            ]
        }

    @staticmethod
    async def restore_db(db: AsyncSession, data: dict) -> None:
        """Restores database from a dumped dictionary structure by clearing and reloading all tables."""
        from models.member import Member, MemberStatus
        from models.auction import Auction, AuctionMember, AuctionStatus
        from models.expense import Expense
        from models.finance import Finance, TransactionType
        from models.loan import Loan, LoanPayment
        from models.monthly_auction import AuctionMonth, MonthlyContribution, AuctionDividend
        from models.setting import Setting
        from sqlalchemy import delete
        from datetime import datetime

        # Clear tables in dependency order
        await db.execute(delete(AuctionMember))
        await db.execute(delete(AuctionDividend))
        await db.execute(delete(MonthlyContribution))
        await db.execute(delete(AuctionMonth))
        await db.execute(delete(Finance))
        await db.execute(delete(LoanPayment))
        await db.execute(delete(Loan))
        await db.execute(delete(Expense))
        await db.execute(delete(Auction))
        await db.execute(delete(Member))
        await db.execute(delete(Setting))
        await db.flush()

        def to_dt(s):
            return datetime.fromisoformat(s) if s else None

        # Restore Setting
        for row in data.get("settings", []):
            s = Setting(
                id=row["id"],
                community_name=row["community_name"],
                default_commission=Decimal(str(row["default_commission"])),
                default_monthly_contribution=Decimal(str(row["default_monthly_contribution"])),
                currency=row["currency"],
                theme=row["theme"],
                created_at=to_dt(row.get("created_at")),
                updated_at=to_dt(row.get("updated_at"))
            )
            db.add(s)

        # Restore Member
        for row in data.get("members", []):
            m = Member(
                id=row["id"],
                name=row["name"],
                phone=row["phone"],
                age=row["age"],
                gender=row.get("gender"),
                address=row["address"],
                status=MemberStatus(row["status"].lower()),
                joined_date=date.fromisoformat(row["joined_date"]) if row["joined_date"] else None,
                notes=row.get("notes"),
                created_at=to_dt(row.get("created_at")),
                updated_at=to_dt(row.get("updated_at"))
            )
            db.add(m)

        await db.flush()

        # Restore Auction
        for row in data.get("auctions", []):
            a = Auction(
                id=row["id"],
                name=row["name"],
                description=row.get("description"),
                prize_amount=Decimal(str(row["prize_amount"])),
                commission=Decimal(str(row["commission"])),
                monthly_contribution=Decimal(str(row["monthly_contribution"])),
                total_months=row["total_months"],
                start_date=date.fromisoformat(row["start_date"]) if row["start_date"] else None,
                current_month=row["current_month"],
                status=AuctionStatus(row["status"].lower()),
                created_at=to_dt(row.get("created_at")),
                updated_at=to_dt(row.get("updated_at"))
            )
            db.add(a)

        # Restore Expense
        for row in data.get("expenses", []):
            e = Expense(
                id=row["id"],
                description=row["description"],
                amount=Decimal(str(row["amount"])),
                category=row["category"],
                expense_date=date.fromisoformat(row["expense_date"]),
                paid_to=row.get("paid_to"),
                notes=row.get("notes"),
                payment_method=row["payment_method"],
                remarks=row["remarks"],
                is_deleted=row["is_deleted"],
                created_at=to_dt(row.get("created_at")),
                updated_at=to_dt(row.get("updated_at"))
            )
            db.add(e)

        # Restore Loan
        for row in data.get("loans", []):
            l = Loan(
                id=row["id"],
                borrower_name=row["borrower_name"],
                phone_number=row["phone_number"],
                member_id=row["member_id"],
                loan_amount=Decimal(str(row["loan_amount"])),
                interest_rate=Decimal(str(row["interest_rate"])),
                loan_date=date.fromisoformat(row["loan_date"]),
                due_date=date.fromisoformat(row["due_date"]),
                outstanding_amount=Decimal(str(row["outstanding_amount"])),
                status=row["status"],
                remarks=row["remarks"],
                created_at=to_dt(row.get("created_at")),
                updated_at=to_dt(row.get("updated_at"))
            )
            db.add(l)

        await db.flush()

        # Restore LoanPayment
        for row in data.get("loan_payments", []):
            lp = LoanPayment(
                id=row["id"],
                loan_id=row["loan_id"],
                interest_payment=Decimal(str(row["interest_payment"])),
                principal_payment=Decimal(str(row["principal_payment"])),
                remaining_balance=Decimal(str(row["remaining_balance"])),
                payment_date=date.fromisoformat(row["payment_date"]),
                payment_method=row["payment_method"],
                notes=row["notes"],
                created_at=to_dt(row.get("created_at")),
                updated_at=to_dt(row.get("updated_at"))
            )
            db.add(lp)

        # Restore Finance
        for row in data.get("finances", []):
            txn_type = row["transaction_type"]
            f = Finance(
                id=row["id"],
                member_id=row["member_id"],
                transaction_type=TransactionType(txn_type.upper()),
                amount=Decimal(str(row["amount"])),
                description=row["description"],
                transaction_date=date.fromisoformat(row["transaction_date"]),
                reference_number=row["reference_number"],
                created_at=to_dt(row.get("created_at")),
                updated_at=to_dt(row.get("updated_at"))
            )
            db.add(f)

        # Restore AuctionMonth
        for row in data.get("auction_months", []):
            am = AuctionMonth(
                id=row["id"],
                auction_id=row["auction_id"],
                month_number=row["month_number"],
                auction_date=date.fromisoformat(row["auction_date"]) if row["auction_date"] else None,
                winning_member_id=row["winning_member_id"],
                bid_amount=Decimal(str(row["bid_amount"])) if row["bid_amount"] else None,
                community_commission=Decimal(str(row["community_commission"])) if row["community_commission"] else None,
                dividend_per_member=Decimal(str(row["dividend_per_member"])) if row["dividend_per_member"] else None,
                status=row["status"],
                created_at=to_dt(row.get("created_at")),
                updated_at=to_dt(row.get("updated_at"))
            )
            db.add(am)

        await db.flush()

        # Restore MonthlyContribution
        for row in data.get("monthly_contributions", []):
            mc = MonthlyContribution(
                id=row["id"],
                auction_month_id=row["auction_month_id"],
                member_id=row["member_id"],
                minimum_amount=Decimal(str(row["minimum_amount"])),
                paid_amount=Decimal(str(row["paid_amount"])),
                paid_status=row["paid_status"],
                payment_date=date.fromisoformat(row["payment_date"]) if row["payment_date"] else None,
                created_at=to_dt(row.get("created_at")),
                updated_at=to_dt(row.get("updated_at"))
            )
            db.add(mc)

        # Restore AuctionDividend
        for row in data.get("auction_dividends", []):
            ad = AuctionDividend(
                id=row["id"],
                auction_month_id=row["auction_month_id"],
                member_id=row["member_id"],
                dividend_received=Decimal(str(row["dividend_received"])),
                created_at=to_dt(row.get("created_at")),
                updated_at=to_dt(row.get("updated_at"))
            )
            db.add(ad)

        # Restore AuctionMember mapping
        for row in data.get("auction_members", []):
            am = AuctionMember(
                id=row["id"],
                auction_id=row["auction_id"],
                member_id=row["member_id"],
                date_joined=date.fromisoformat(row["date_joined"]) if row.get("date_joined") else None,
                is_winner=row["is_winner"],
                winning_month=row["winning_month"],
                is_active=row["is_active"],
                created_at=to_dt(row.get("created_at")),
                updated_at=to_dt(row.get("updated_at"))
            )
            db.add(am)

        await db.flush()
