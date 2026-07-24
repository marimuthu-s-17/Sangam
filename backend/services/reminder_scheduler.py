import asyncio
from datetime import datetime
from database.connection import async_session
from services.reminder_service import ReminderService

async def start_reminder_scheduler():
    """Background loop that periodically runs the automated reminders check."""
    print("⏰ Automated Reminder Scheduler Started")
    # Small startup delay to let the app fully initialize
    await asyncio.sleep(10)
    while True:
        try:
            async with async_session() as db:
                global_settings = await ReminderService.get_global_settings(db)
                now = datetime.now()
                time_str = now.strftime("%H:%M")
                
                if time_str == global_settings.reminder_time:
                    print(f"⏰ Triggering automated reminders check at {time_str}")
                    res = await ReminderService.execute_automated_reminders(db, force=False)
                    print(f"⏰ Automated reminders check completed: {res}")
            
            # Sleep 60 seconds to avoid repeating within the same minute
            await asyncio.sleep(60)
        except Exception as e:
            print(f"❌ Error in reminder scheduler loop: {e}")
            await asyncio.sleep(60)
