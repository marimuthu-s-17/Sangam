from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

from database.connection import get_db
from services.ledger_service import LedgerService

router = APIRouter(prefix="/api/v1/ledger", tags=["Member Ledger"])


@router.get("/summary", response_model=List[Dict[str, Any]])
async def get_ledger_summary(db: AsyncSession = Depends(get_db)):
    """Fetch the ledger summary for all members."""
    return await LedgerService.get_all_members_ledger_summary(db)


@router.get("/member/{member_id}", response_model=List[Dict[str, Any]])
async def get_member_ledger(member_id: int, db: AsyncSession = Depends(get_db)):
    """Fetch detailed month-by-month ledger entries for a specific member."""
    return await LedgerService.get_member_detailed_ledger(db, member_id)
