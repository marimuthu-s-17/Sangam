from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from models.member import Member, MemberStatus
from typing import Optional, List, Tuple


class MemberRepository:
    """Repository layer for Member model operations using SQLAlchemy 2.0."""

    @staticmethod
    async def get_all(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        status: Optional[MemberStatus] = None,
        age: Optional[int] = None,
        sort_by: Optional[str] = "id",
        sort_order: Optional[str] = "desc"
    ) -> Tuple[List[Member], int]:
        """Get all members with filtering, searching, sorting, and pagination."""
        query = select(Member)
        
        # Filtering by status
        if status:
            query = query.where(Member.status == status)
            
        # Filtering by exact age
        if age is not None:
            query = query.where(Member.age == age)
            
        # Searching by Name, Phone, Address, Status, Age
        if search:
            search_filters = [
                Member.name.ilike(f"%{search}%"),
                Member.phone.ilike(f"%{search}%"),
                Member.address.ilike(f"%{search}%")
            ]
            
            # If search is a status value
            for s in MemberStatus:
                if s.value.lower() == search.lower() or s.name.lower() == search.lower():
                    search_filters.append(Member.status == s)
            
            # If search is a number, we can search by age
            if search.isdigit():
                search_filters.append(Member.age == int(search))
                
            query = query.where(or_(*search_filters))
            
        # Count total matches before pagination
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar() or 0
        
        # Sorting
        if sort_by:
            col = getattr(Member, sort_by, None)
            if col is not None:
                if sort_order == "asc":
                    query = query.order_by(col.asc())
                else:
                    query = query.order_by(col.desc())
            else:
                query = query.order_by(Member.id.desc())
        else:
            query = query.order_by(Member.id.desc())
            
        # Pagination
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        members = result.scalars().all()
        return members, total

    @staticmethod
    async def get_by_id(db: AsyncSession, member_id: int) -> Optional[Member]:
        """Get a single member by ID."""
        result = await db.execute(select(Member).where(Member.id == member_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_phone(db: AsyncSession, phone: str) -> Optional[Member]:
        """Get a member by phone number."""
        result = await db.execute(select(Member).where(Member.phone == phone))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, member: Member) -> Member:
        """Create a new member."""
        db.add(member)
        await db.flush()
        await db.refresh(member)
        return member

    @staticmethod
    async def update(db: AsyncSession, member: Member, update_data: dict) -> Member:
        """Update an existing member's details."""
        for key, value in update_data.items():
            setattr(member, key, value)
        await db.flush()
        await db.refresh(member)
        return member

    @staticmethod
    async def soft_delete(db: AsyncSession, member: Member) -> Member:
        """Soft delete member by setting status to INACTIVE."""
        member.status = MemberStatus.INACTIVE
        await db.flush()
        await db.refresh(member)
        return member

    @staticmethod
    async def get_stats(db: AsyncSession) -> dict:
        """Retrieve total, active, inactive and recently joined member counts."""
        from datetime import date, timedelta
        thirty_days_ago = date.today() - timedelta(days=30)
        
        total_q = select(func.count(Member.id))
        active_q = select(func.count(Member.id)).where(Member.status == MemberStatus.ACTIVE)
        inactive_q = select(func.count(Member.id)).where(Member.status == MemberStatus.INACTIVE)
        recent_q = select(func.count(Member.id)).where(Member.joined_date >= thirty_days_ago)
        
        total = (await db.execute(total_q)).scalar() or 0
        active = (await db.execute(active_q)).scalar() or 0
        inactive = (await db.execute(inactive_q)).scalar() or 0
        recent = (await db.execute(recent_q)).scalar() or 0
        
        return {
            "total_members": total,
            "active_members": active,
            "inactive_members": inactive,
            "recently_joined": recent
        }
