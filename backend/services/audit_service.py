from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from models.audit_log import AuditLog
from typing import List, Tuple, Optional
from datetime import date, datetime, time

class AuditService:
    """Service layer for recording and retrieving audit logs."""

    @staticmethod
    async def log_action(db: AsyncSession, action: str, module: str, user: str = "Admin") -> AuditLog:
        """Create and commit an audit log entry with action category (module)."""
        log = AuditLog(user=user, action=action, module=module)
        db.add(log)
        await db.flush()
        return log

    @staticmethod
    async def get_all(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        module: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Tuple[List[AuditLog], int]:
        """Fetch audit log list with searching, module, and date range filtering."""
        query = select(AuditLog)
        
        if search:
            query = query.where(AuditLog.action.ilike(f"%{search}%"))
        if module:
            query = query.where(AuditLog.module == module)
        if start_date:
            dt_start = datetime.combine(start_date, time.min)
            query = query.where(AuditLog.created_at >= dt_start)
        if end_date:
            dt_end = datetime.combine(end_date, time.max)
            query = query.where(AuditLog.created_at <= dt_end)

        # Count total matches before pagination
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar() or 0
        
        query = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        logs = list(result.scalars().all())
        return logs, total
