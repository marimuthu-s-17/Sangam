from fastapi import APIRouter, Depends, Query, File, UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from schemas.setting import SettingUpdate, SettingResponse
from services.setting_service import SettingService
from services.audit_service import AuditService
from schemas.audit_log import AuditLogResponse
import json
from typing import Optional
from datetime import date

router = APIRouter(prefix="/api/v1/settings", tags=["Settings"])

@router.get("", response_model=SettingResponse)
async def get_settings(db: AsyncSession = Depends(get_db)):
    """Fetch system settings."""
    setting = await SettingService.get(db)
    return SettingResponse.model_validate(setting)

@router.put("", response_model=SettingResponse)
async def update_settings(data: SettingUpdate, db: AsyncSession = Depends(get_db)):
    """Update system settings."""
    setting = await SettingService.update(db, data)
    await AuditService.log_action(db, "System settings updated", "Settings", "Admin")
    # Commit again to persist the audit log
    await db.commit()
    return SettingResponse.model_validate(setting)

@router.get("/backup")
async def backup_database(db: AsyncSession = Depends(get_db)):
    """Generate database JSON backup."""
    backup_data = await SettingService.backup_db(db)
    await AuditService.log_action(db, "Database backup downloaded", "Settings", "Admin")
    return backup_data

@router.post("/restore")
async def restore_database(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """Restore database from JSON backup file."""
    try:
        content = await file.read()
        backup_data = json.loads(content.decode("utf-8"))
        
        # Validate essential tables presence in backup dictionary
        required_keys = ["members", "auctions", "settings"]
        if not isinstance(backup_data, dict):
            raise ValueError("Backup data must be a valid JSON object.")
        for k in required_keys:
            if k not in backup_data:
                raise ValueError(f"Invalid backup file: missing required section '{k}'.")
                
        await SettingService.restore_db(db, backup_data)
        await AuditService.log_action(db, "Database successfully restored from backup file", "Settings", "Admin")
        return {"status": "success", "message": "Database successfully restored."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to restore database: {str(e)}")

@router.get("/audit-logs")
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None),
    module: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve audit history logs with search and date range filters."""
    logs, total = await AuditService.get_all(db, skip, limit, search, module, start_date, end_date)
    return {
        "data": [AuditLogResponse.model_validate(log) for log in logs],
        "total": total
    }
