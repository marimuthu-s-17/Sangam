from sqlalchemy import Date, Numeric, Integer, ForeignKey, Enum as SAEnum, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.base import Base, TimestampMixin
from datetime import date
from decimal import Decimal
import enum


class AuctionStatus(str, enum.Enum):
    """Auction status enum - values match PostgreSQL enum exactly."""
    UPCOMING = "upcoming"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Auction(Base, TimestampMixin):
    __tablename__ = "auctions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    prize_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00")
    )
    commission: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00")
    )
    monthly_contribution: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00")
    )
    total_months: Mapped[int] = mapped_column(Integer, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    current_month: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[AuctionStatus] = mapped_column(
        SAEnum(
            AuctionStatus,
            name="auction_status",
            values_callable=lambda e: [m.value for m in e],
        ),
        default=AuctionStatus.UPCOMING,
        server_default=AuctionStatus.UPCOMING.value,
        nullable=False,
        index=True,
    )

    # Relationships
    members_association = relationship(
        "AuctionMember",
        back_populates="auction",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    months = relationship(
        "AuctionMonth",
        back_populates="auction",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Auction(id={self.id}, name='{self.name}', status='{self.status}')>"


class AuctionMember(Base, TimestampMixin):
    __tablename__ = "auction_members"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    auction_id: Mapped[int] = mapped_column(
        ForeignKey("auctions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    member_id: Mapped[int] = mapped_column(
        ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True
    )
    date_joined: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    is_winner: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    winning_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    auction = relationship("Auction", back_populates="members_association")
    member = relationship("Member", back_populates="auction_members")

    def __repr__(self) -> str:
        return f"<AuctionMember(id={self.id}, auction_id={self.auction_id}, member_id={self.member_id})>"
