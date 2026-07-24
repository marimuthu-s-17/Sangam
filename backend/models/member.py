from sqlalchemy import String, Text, Date, Enum as SAEnum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.base import Base, TimestampMixin
from datetime import date
import enum


class MemberStatus(str, enum.Enum):
    """Member status enum - values match PostgreSQL enum exactly."""
    ACTIVE = "active"
    INACTIVE = "inactive"


class Member(Base, TimestampMixin):
    __tablename__ = "members"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(15), unique=True, nullable=False, index=True)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[MemberStatus] = mapped_column(
        SAEnum(
            MemberStatus,
            name="member_status",
            values_callable=lambda e: [m.value for m in e],
        ),
        default=MemberStatus.ACTIVE,
        server_default=MemberStatus.ACTIVE.value,
        nullable=False,
        index=True,
    )
    joined_date: Mapped[date] = mapped_column(
        Date, default=date.today, nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    finances = relationship("Finance", back_populates="member", lazy="selectin")

    # Relationship placeholders / actual links
    auction_members = relationship("AuctionMember", back_populates="member", lazy="selectin", cascade="all, delete-orphan")
    monthly_payments = relationship("MonthlyContribution", back_populates="member", lazy="selectin")
    auction_winners = relationship("AuctionMonth", back_populates="winning_member", lazy="selectin")
    loans = relationship("Loan", back_populates="member", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Member(id={self.id}, name='{self.name}', status='{self.status}')>"
