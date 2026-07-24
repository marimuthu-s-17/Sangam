import asyncio
import sys
import os
from decimal import Decimal
from datetime import date

# Add backend to path
sys.path.insert(0, "/home/pranav/Desktop/Sangam/backend")

from database.connection import async_session
from models.member import Member, MemberStatus
from models.auction import Auction, AuctionMember, AuctionStatus
from models.monthly_auction import AuctionMonth, MonthlyContribution, AuctionDividend
from services.monthly_auction_service import MonthlyAuctionService
from repositories.auction_repository import AuctionRepository
from repositories.member_repository import MemberRepository


async def run_verification():
    print("🚀 Starting Monthly Auction Engine Verification...")
    async with async_session() as db:
        # 1. Ensure we have at least 5 active members
        members = []
        for i in range(1, 6):
            name = f"Test Member {i}"
            phone = f"999999000{i}"
            # Check if member exists
            query = await db.execute(Member.__table__.select().where(Member.phone == phone))
            existing = query.first()
            if not existing:
                member = Member(
                    name=name,
                    phone=phone,
                    age=30 + i,
                    gender="male",
                    status=MemberStatus.ACTIVE,
                    joined_date=date.today(),
                )
                db.add(member)
                members.append(member)
            else:
                # Load the model
                res = await db.execute(Member.__table__.select().where(Member.id == existing[0]))
                row = res.first()
                # Use MemberRepository to get loaded model
                m = await MemberRepository.get_by_id(db, existing[0])
                members.append(m)
        
        await db.flush()
        print(f"✅ Found/Created {len(members)} active members.")

        # 2. Create an Auction
        auction = Auction(
            name="Verification Auction Group",
            description="Testing E2E execution engine flow",
            prize_amount=Decimal("10000.00"),
            commission=Decimal("500.00"),
            monthly_contribution=Decimal("2000.00"),
            total_months=5,
            start_date=date.today(),
            current_month=1,
            status=AuctionStatus.ACTIVE,
        )
        db.add(auction)
        await db.flush()
        print(f"✅ Created Auction Group with ID: {auction.id}")

        # Associate members with the auction
        for m in members:
            assoc = AuctionMember(
                auction_id=auction.id,
                member_id=m.id,
                is_winner=False,
                is_active=True,
            )
            db.add(assoc)
        await db.flush()
        print("✅ Assigned members to auction.")

        # 3. Test get_current_month_details (initializes round 1)
        res = await MonthlyAuctionService.get_current_month_details(db, auction.id)
        assert res.auction_month is not None
        assert res.auction_month.month_number == 1
        assert res.auction_month.status == "pending"
        assert len(res.auction_month.contributions) == 5
        print("✅ Current month round initialized in 'pending' status.")

        # 4. Verify starting round fails when no one has paid
        try:
            await MonthlyAuctionService.start_month(db, auction.id)
            print("❌ Error: Monthly round started without any paid members!")
            sys.exit(1)
        except Exception as e:
            print(f"✅ Correctly blocked starting month with no paid members. Exception: {e}")

        # 5. Check off paid status for 4 members
        # Set contribution paid amount for first 4 members to minimum amount (2000.00)
        contribs = res.auction_month.contributions
        for c in contribs[:4]:
            updated = await MonthlyAuctionService.update_contribution(db, c.id, Decimal("2000.00"))
            assert updated.paid_status is True
            assert updated.paid_amount == Decimal("2000.00")
            assert updated.payment_date == date.today()
        
        print("✅ Checked off paid status for 4 out of 5 members.")

        # 6. Verify start month succeeds now
        started = await MonthlyAuctionService.start_month(db, auction.id)
        assert started.status == "active"
        print("✅ Successfully transitioned round to 'active' (bidding open).")

        # 7. Try selecting unpaid member (the 5th member) as winner - should fail
        unpaid_contrib = contribs[4]
        try:
            await MonthlyAuctionService.complete_month(
                db, auction.id, unpaid_contrib.member_id, Decimal("1500.00")
            )
            print("❌ Error: Completed month with unpaid winner!")
            sys.exit(1)
        except Exception as e:
            print(f"✅ Correctly blocked unpaid member from winning. Exception: {e}")

        # 8. Complete month with a valid winner (1st member)
        winner_member_id = contribs[0].member_id
        bid_amount = Decimal("1800.00")
        
        # Bidders: 4 eligible (paid)
        # Winner is 1st member. Other 3 eligible members receive dividends.
        # Remaining eligible = 3
        # Dividend = (1800 - 500) / 3 = 1300 / 3 = 433.3333333333333333333333333
        completed_month = await MonthlyAuctionService.complete_month(
            db, auction.id, winner_member_id, bid_amount
        )
        assert completed_month.status == "completed"
        assert completed_month.winning_member_id == winner_member_id
        assert completed_month.bid_amount == bid_amount
        
        # Check auction incremented to month 2
        refreshed_auction = await AuctionRepository.get_by_id(db, auction.id)
        assert refreshed_auction.current_month == 2
        print(f"✅ Completed month 1. Winner ID: {winner_member_id}, Bid: {bid_amount}, Dividend per member: {completed_month.dividend_per_member}")
        print(f"✅ Auction advanced to month {refreshed_auction.current_month}.")

        # 9. Verify history returns completed round details
        history = await MonthlyAuctionService.get_history(db, auction.id)
        assert len(history) == 1
        assert history[0].winning_member_id == winner_member_id
        print("✅ Completed month history logged and retrieved successfully.")

        # 10. Check that winner is ineligible for month 2
        month2_details = await MonthlyAuctionService.get_current_month_details(db, auction.id)
        winner_contrib_m2 = next(
            (c for c in month2_details.auction_month.contributions if c.member_id == winner_member_id), None
        )
        assert winner_contrib_m2 is not None
        assert winner_contrib_m2.already_won is True
        assert winner_contrib_m2.is_eligible is False
        print("✅ Winner of Month 1 is marked ineligible for Month 2.")

        # Rollback so we don't pollute database with this verification run
        await db.rollback()
        print("✅ Verification transaction rolled back successfully. Database is clean.")


if __name__ == "__main__":
    asyncio.run(run_verification())
