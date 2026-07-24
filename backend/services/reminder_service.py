from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import date, datetime
import random
from models.reminder import ReminderSetting, ReminderHistory, GlobalReminderSetting
from models.auction import Auction
from models.member import Member
from models.monthly_auction import AuctionMonth, MonthlyContribution
from typing import List, Optional, Dict, Any

class ReminderService:

    @staticmethod
    async def get_settings(db: AsyncSession, auction_id: int) -> ReminderSetting:
        """Fetch or create reminder settings for an auction."""
        stmt = select(ReminderSetting).where(ReminderSetting.auction_id == auction_id)
        result = await db.execute(stmt)
        setting = result.scalar_one_or_none()

        if not setting:
            setting = ReminderSetting(
                auction_id=auction_id,
                is_enabled=True,
                sms_enabled=True,
                whatsapp_enabled=True,
                automatic_reminder=False,
                due_day=10,
                template="Dear {member_name}, this is a reminder for your contribution of ₹{contribution_amount} to auction '{auction_name}' due on {due_date}. Status: {payment_status}."
            )
            db.add(setting)
            await db.commit()
            await db.refresh(setting)
        
        return setting

    @staticmethod
    async def update_settings(db: AsyncSession, auction_id: int, data: Dict[str, Any]) -> ReminderSetting:
        """Update reminder settings for an auction."""
        setting = await ReminderService.get_settings(db, auction_id)
        
        for key, value in data.items():
            if hasattr(setting, key):
                setattr(setting, key, value)
        
        await db.commit()
        await db.refresh(setting)
        return setting

    @staticmethod
    async def get_unpaid_members(db: AsyncSession, auction_id: int) -> List[Dict[str, Any]]:
        """Get all members who have not paid their contribution for the current month of the auction."""
        # Get auction current month
        stmt = select(Auction).where(Auction.id == auction_id)
        res = await db.execute(stmt)
        auction = res.scalar_one_or_none()
        if not auction:
            return []

        # Find the current AuctionMonth
        month_stmt = select(AuctionMonth).where(
            AuctionMonth.auction_id == auction_id,
            AuctionMonth.month_number == auction.current_month
        )
        month_res = await db.execute(month_stmt)
        month = month_res.scalar_one_or_none()
        if not month:
            return []

        # Find all MonthlyContribution records that are not paid
        contrib_stmt = select(MonthlyContribution).where(
            MonthlyContribution.auction_month_id == month.id,
            MonthlyContribution.paid_status == False
        )
        contrib_res = await db.execute(contrib_stmt)
        contributions = contrib_res.scalars().all()

        unpaid_list = []
        for c in contributions:
            unpaid_list.append({
                "member_id": c.member_id,
                "name": c.member.name,
                "phone": c.member.phone,
                "amount": float(c.minimum_amount),
                "month_number": auction.current_month,
                "due_date": ReminderService._calculate_due_date(auction.start_date, auction.current_month, 10).isoformat()
            })
        return unpaid_list

    @staticmethod
    def _calculate_due_date(start_date: date, month_number: int, due_day: int) -> date:
        """Calculate due date based on start_date, current round, and due_day."""
        # Simple estimation: month_number offset from start_date
        year = start_date.year
        month = start_date.month + (month_number - 1)
        while month > 12:
            month -= 12
            year += 1
        
        # Cap day to days in month
        try:
            return date(year, month, due_day)
        except ValueError:
            # Handle month end cases (e.g. Feb 30th -> Feb 28th)
            import calendar
            _, last_day = calendar.monthrange(year, month)
            return date(year, month, last_day)

    @staticmethod
    async def send_manual_reminders(
        db: AsyncSession, auction_id: int, member_ids: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """Send reminders to specific or all unpaid members of an auction."""
        auction_stmt = select(Auction).where(Auction.id == auction_id)
        res = await db.execute(auction_stmt)
        auction = res.scalar_one_or_none()
        if not auction:
            return {"status": "error", "message": "Auction not found"}

        settings = await ReminderService.get_settings(db, auction_id)
        if not settings.is_enabled:
            return {"status": "error", "message": "Reminders are disabled for this auction"}

        # Find current month round
        month_stmt = select(AuctionMonth).where(
            AuctionMonth.auction_id == auction_id,
            AuctionMonth.month_number == auction.current_month
        )
        month_res = await db.execute(month_stmt)
        month = month_res.scalar_one_or_none()
        if not month:
            return {"status": "error", "message": "Current month round not found"}

        # Find unpaid contributions
        contrib_stmt = select(MonthlyContribution).where(
            MonthlyContribution.auction_month_id == month.id,
            MonthlyContribution.paid_status == False
        )
        if member_ids:
            contrib_stmt = contrib_stmt.where(MonthlyContribution.member_id.in_(member_ids))

        contrib_res = await db.execute(contrib_stmt)
        contributions = contrib_res.scalars().all()

        if not contributions:
            return {"status": "success", "sent_count": 0, "message": "No pending reminders to send"}

        due_date = ReminderService._calculate_due_date(auction.start_date, auction.current_month, settings.due_day)
        formatted_due_date = due_date.strftime("%d-%m-%Y")

        sent_count = 0
        history_entries = []

        for c in contributions:
            member = c.member
            # Format template
            msg = settings.template.format(
                member_name=member.name,
                auction_name=auction.name,
                contribution_amount=f"{c.minimum_amount:.2f}",
                due_date=formatted_due_date,
                payment_status="Unpaid"
            )

            # Determine reminder types
            types_to_send = []
            if settings.sms_enabled:
                types_to_send.append("sms")
            if settings.whatsapp_enabled:
                types_to_send.append("whatsapp")

            for r_type in types_to_send:
                # Mock status (90% delivered, 10% failed)
                status_roll = random.random()
                rem_status = "delivered" if status_roll > 0.1 else "failed"

                hist = ReminderHistory(
                    auction_id=auction_id,
                    member_id=member.id,
                    reminder_type=r_type,
                    status=rem_status,
                    message=msg,
                    sent_at=datetime.utcnow()
                )
                db.add(hist)
                sent_count += 1

        await db.commit()
        return {
            "status": "success",
            "sent_count": sent_count,
            "message": f"Successfully sent {sent_count} reminder messages."
        }

    @staticmethod
    async def get_history(db: AsyncSession, auction_id: int, limit: int = 50) -> List[ReminderHistory]:
        """Fetch reminder history for an auction."""
        stmt = select(ReminderHistory).where(
            ReminderHistory.auction_id == auction_id
        ).order_by(desc(ReminderHistory.sent_at)).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_global_settings(db: AsyncSession) -> GlobalReminderSetting:
        """Fetch or create global reminder settings."""
        stmt = select(GlobalReminderSetting).limit(1)
        result = await db.execute(stmt)
        setting = result.scalar_one_or_none()

        if not setting:
            setting = GlobalReminderSetting(
                is_enabled=True,
                sms_enabled=True,
                whatsapp_enabled=True,
                reminder_time="09:00",
                template="Dear {member_name}, this is an automated reminder for your contribution of ₹{contribution_amount} to auction '{auction_name}' due on {due_date}. Status: {payment_status}."
            )
            db.add(setting)
            await db.commit()
            await db.refresh(setting)
        
        return setting

    @staticmethod
    async def update_global_settings(db: AsyncSession, data: Dict[str, Any]) -> GlobalReminderSetting:
        """Update global reminder settings."""
        setting = await ReminderService.get_global_settings(db)
        for key, value in data.items():
            if hasattr(setting, key):
                setattr(setting, key, value)
        await db.commit()
        await db.refresh(setting)
        return setting

    @staticmethod
    async def get_all_history(db: AsyncSession, limit: int = 100) -> List[ReminderHistory]:
        """Fetch reminder history across all auctions."""
        stmt = select(ReminderHistory).order_by(desc(ReminderHistory.sent_at)).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def execute_automated_reminders(db: AsyncSession, force: bool = False) -> Dict[str, Any]:
        """Run scheduler check to send reminders on the 8th or every 3 days after."""
        global_settings = await ReminderService.get_global_settings(db)
        if not global_settings.is_enabled and not force:
            return {"status": "disabled", "message": "Global reminders are disabled."}

        today = date.today()
        is_scheduled_day = today.day == 8
        days_after_8th = today.day - 8
        is_repeat_day = days_after_8th > 0 and days_after_8th % 3 == 0

        if not (force or is_scheduled_day or is_repeat_day):
            return {"status": "skipped", "message": f"Today (day {today.day}) is not a scheduled reminder day."}

        # Fetch all active auctions
        auctions_stmt = select(Auction).where(Auction.status == "active")
        auctions_res = await db.execute(auctions_stmt)
        active_auctions = auctions_res.scalars().all()

        total_sent = 0
        executed_auctions = []

        for auction in active_auctions:
            # Fetch reminder setting for the specific auction
            auction_setting = await ReminderService.get_settings(db, auction.id)
            if not auction_setting.is_enabled:
                continue

            # Determine channel support (combining global + local settings)
            sms_active = global_settings.sms_enabled and auction_setting.sms_enabled
            whatsapp_active = global_settings.whatsapp_enabled and auction_setting.whatsapp_enabled

            if not (sms_active or whatsapp_active):
                continue

            # Find current month round
            month_stmt = select(AuctionMonth).where(
                AuctionMonth.auction_id == auction.id,
                AuctionMonth.month_number == auction.current_month
            )
            month_res = await db.execute(month_stmt)
            month = month_res.scalar_one_or_none()
            if not month:
                continue

            # Get unpaid contributions
            contrib_stmt = select(MonthlyContribution).where(
                MonthlyContribution.auction_month_id == month.id,
                MonthlyContribution.paid_status == False
            )
            contrib_res = await db.execute(contrib_stmt)
            unpaid_contribs = contrib_res.scalars().all()

            if not unpaid_contribs:
                continue

            due_date = ReminderService._calculate_due_date(auction.start_date, auction.current_month, auction_setting.due_day)
            formatted_due_date = due_date.strftime("%d-%m-%Y")

            # Resolve message template
            msg_template = auction_setting.template or global_settings.template

            for c in unpaid_contribs:
                member = c.member
                msg = msg_template.format(
                    member_name=member.name,
                    auction_name=auction.name,
                    contribution_amount=f"{c.minimum_amount:.2f}",
                    due_date=formatted_due_date,
                    payment_status="Unpaid"
                )

                channels = []
                if sms_active:
                    channels.append("sms")
                if whatsapp_active:
                    channels.append("whatsapp")

                for ch in channels:
                    status_roll = random.random()
                    status_val = "delivered" if status_roll > 0.1 else "failed"

                    hist = ReminderHistory(
                        auction_id=auction.id,
                        member_id=member.id,
                        reminder_type=ch,
                        status=status_val,
                        message=msg,
                        sent_at=datetime.utcnow()
                    )
                    db.add(hist)
                    total_sent += 1

            executed_auctions.append(auction.name)

        await db.commit()
        return {
            "status": "success",
            "triggered_by": "forced" if force else "scheduler",
            "sent_count": total_sent,
            "executed_auctions": executed_auctions,
            "message": f"Successfully sent {total_sent} reminders across {len(executed_auctions)} auctions."
        }
