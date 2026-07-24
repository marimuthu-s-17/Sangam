from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, UploadFile, status
from models.member import Member, MemberStatus
from repositories.member_repository import MemberRepository
from schemas.member import MemberCreate, MemberUpdate, MemberResponse
from typing import Optional, List, Tuple
from datetime import date
import csv
import io
import re


class MemberService:
    """Service layer for Member operations implementing Repository Pattern and validation."""

    @staticmethod
    async def get_all(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        status_filter: Optional[MemberStatus] = None,
        age: Optional[int] = None,
        sort_by: Optional[str] = "id",
        sort_order: Optional[str] = "desc"
    ) -> Tuple[List[MemberResponse], int]:
        """Get paginated, filtered, sorted, and searched members."""
        members, total = await MemberRepository.get_all(
            db, skip, limit, search, status_filter, age, sort_by, sort_order
        )
        return [MemberResponse.model_validate(m) for m in members], total

    @staticmethod
    async def get_by_id(db: AsyncSession, member_id: int) -> MemberResponse:
        """Get a member by ID."""
        member = await MemberRepository.get_by_id(db, member_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )
        return MemberResponse.model_validate(member)

    @staticmethod
    async def create(db: AsyncSession, data: MemberCreate) -> MemberResponse:
        """Create a new member after checking uniqueness of phone number."""
        # Uniqueness check
        existing = await MemberRepository.get_by_phone(db, data.phone)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A member with this phone number already exists"
            )

        member = Member(**data.model_dump(exclude_none=True))
        created = await MemberRepository.create(db, member)
        return MemberResponse.model_validate(created)

    @staticmethod
    async def update(
        db: AsyncSession, member_id: int, data: MemberUpdate
    ) -> MemberResponse:
        """Update an existing member's details."""
        member = await MemberRepository.get_by_id(db, member_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )

        update_data = data.model_dump(exclude_none=True)
        if "phone" in update_data and update_data["phone"] != member.phone:
            existing = await MemberRepository.get_by_phone(db, update_data["phone"])
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A member with this phone number already exists"
                )

        updated = await MemberRepository.update(db, member, update_data)
        return MemberResponse.model_validate(updated)

    @staticmethod
    async def delete(db: AsyncSession, member_id: int) -> dict:
        """Soft delete a member by setting their status to INACTIVE."""
        member = await MemberRepository.get_by_id(db, member_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )

        await MemberRepository.soft_delete(db, member)
        return {"message": "Member soft deleted successfully"}

    @staticmethod
    async def get_stats(db: AsyncSession) -> dict:
        """Fetch member statistics."""
        return await MemberRepository.get_stats(db)

    @staticmethod
    async def import_csv(db: AsyncSession, file: UploadFile) -> dict:
        """Parse and import members from a CSV file with validation."""
        try:
            content = await file.read()
            text = content.decode("utf-8")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file encoding. Please upload a UTF-8 CSV file."
            )

        f = io.StringIO(text)
        reader = csv.DictReader(f)
        
        summary = {
            "total": 0,
            "imported": 0,
            "skipped": 0,
            "errors": []
        }
        
        for idx, row in enumerate(reader, start=1):
            summary["total"] += 1
            # Standardize keys (handling cases)
            name = (row.get("Name") or row.get("name") or "").strip()
            phone = (row.get("Phone") or row.get("phone") or "").strip()
            age_str = (row.get("Age") or row.get("age") or "").strip()
            gender = (row.get("Gender") or row.get("gender") or "").strip() or None
            address = (row.get("Address") or row.get("address") or "").strip() or None

            # Validation
            if not name or not phone or not age_str:
                summary["errors"].append(f"Row {idx}: Missing name, phone, or age")
                summary["skipped"] += 1
                continue

            if len(name) > 100:
                summary["errors"].append(f"Row {idx}: Name exceeds 100 characters")
                summary["skipped"] += 1
                continue

            try:
                age = int(age_str)
                if age < 18 or age > 100:
                    summary["errors"].append(f"Row {idx}: Age must be between 18 and 100")
                    summary["skipped"] += 1
                    continue
            except ValueError:
                summary["errors"].append(f"Row {idx}: Age must be an integer")
                summary["skipped"] += 1
                continue

            # Indian mobile number validation
            cleaned_phone = re.sub(r'[\s\-()]+', '', phone)
            pattern = r'^(?:\+?91|0)?[6-9]\d{9}$'
            if not re.match(pattern, cleaned_phone):
                summary["errors"].append(f"Row {idx}: Phone must be a valid Indian mobile number")
                summary["skipped"] += 1
                continue

            # Normalize phone to 10 digits
            match = re.search(r'[6-9]\d{9}$', cleaned_phone)
            normalized_phone = match.group(0) if match else cleaned_phone

            # Check unique phone in database
            existing = await MemberRepository.get_by_phone(db, normalized_phone)
            if existing:
                summary["errors"].append(f"Row {idx}: Phone number {normalized_phone} already exists")
                summary["skipped"] += 1
                continue

            # Create member
            member = Member(
                name=name,
                phone=normalized_phone,
                age=age,
                gender=gender[:50] if gender else None,
                address=address,
                status=MemberStatus.ACTIVE,
                joined_date=date.today()
            )
            await MemberRepository.create(db, member)
            summary["imported"] += 1

        return summary
