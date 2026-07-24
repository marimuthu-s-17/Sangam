import asyncio
import sys

# Add backend to path
sys.path.insert(0, "/home/pranav/Desktop/Sangam/backend")

from database.connection import async_session
from services.ledger_service import LedgerService


async def test_ledger():
    print("🧪 Running Ledger Service Tests...")
    async with async_session() as db:
        # Fetch summaries
        summaries = await LedgerService.get_all_members_ledger_summary(db)
        print(f"✅ Summary records retrieved: {len(summaries)}")
        if summaries:
            print("👉 First summary record sample:")
            for k, v in summaries[0].items():
                print(f"   {k}: {v}")

            # Fetch details for the first member
            member_id = summaries[0]["member_id"]
            details = await LedgerService.get_member_detailed_ledger(
                db, member_id
            )
            print(
                f"✅ Detailed statement rows for member {member_id}: {len(details)}"
            )


if __name__ == "__main__":
    asyncio.run(test_ledger())
