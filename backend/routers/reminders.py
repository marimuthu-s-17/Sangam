from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database.connection import get_db
from schemas.reminder import (
    ReminderSettingResponse,
    ReminderSettingUpdate,
    ReminderHistoryResponse,
    SendRemindersRequest,
    GlobalReminderSettingResponse,
    GlobalReminderSettingUpdate,
)
from services.reminder_service import ReminderService

router = APIRouter(prefix="/api/v1/reminders", tags=["Reminders"])


@router.get("/global-settings", response_model=GlobalReminderSettingResponse)
async def get_global_reminder_settings(db: AsyncSession = Depends(get_db)):
    """Retrieve global reminder configurations."""
    return await ReminderService.get_global_settings(db)


@router.put("/global-settings", response_model=GlobalReminderSettingResponse)
async def update_global_reminder_settings(
    data: GlobalReminderSettingUpdate, db: AsyncSession = Depends(get_db)
):
    """Update global reminder configurations."""
    update_dict = data.model_dump(exclude_unset=True)
    return await ReminderService.update_global_settings(db, update_dict)


@router.get("/history-all", response_model=List[ReminderHistoryResponse])
async def get_all_reminder_history(db: AsyncSession = Depends(get_db)):
    """Retrieve reminder history logs across all auctions."""
    logs = await ReminderService.get_all_history(db)
    return [ReminderHistoryResponse.model_validate(l) for l in logs]


@router.post("/trigger-check")
async def trigger_scheduler_check(db: AsyncSession = Depends(get_db)):
    """Manually trigger the automated reminder check (simulates scheduling run)."""
    return await ReminderService.execute_automated_reminders(db, force=True)


@router.get("/auctions/{id}/settings", response_model=ReminderSettingResponse)
async def get_reminder_settings(id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve reminder settings for a specific auction."""
    return await ReminderService.get_settings(db, id)


@router.put("/auctions/{id}/settings", response_model=ReminderSettingResponse)
async def update_reminder_settings(
    id: int, data: ReminderSettingUpdate, db: AsyncSession = Depends(get_db)
):
    """Update reminder settings for a specific auction."""
    update_dict = data.model_dump(exclude_unset=True)
    return await ReminderService.update_settings(db, id, update_dict)


@router.get("/auctions/{id}/unpaid")
async def get_unpaid_members(id: int, db: AsyncSession = Depends(get_db)):
    """List all unpaid members for the current month round of the auction."""
    return await ReminderService.get_unpaid_members(db, id)


@router.get("/auctions/{id}/history", response_model=List[ReminderHistoryResponse])
async def get_reminder_history(id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve the log of all sent reminders for the auction."""
    history_logs = await ReminderService.get_history(db, id)
    return [ReminderHistoryResponse.model_validate(h) for h in history_logs]


@router.post("/auctions/{id}/send")
async def send_reminders(
    id: int, data: SendRemindersRequest, db: AsyncSession = Depends(get_db)
):
    """Trigger sending reminder messages to unpaid members manually."""
    return await ReminderService.send_manual_reminders(db, id, data.member_ids)
