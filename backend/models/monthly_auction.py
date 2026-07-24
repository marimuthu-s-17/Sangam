from sqlalchemy import Date, Numeric, Integer, ForeignKey, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.base import Base, TimestampMixin
from datetime import date
from decimal import Decimal
from typing import Optional, List


class AuctionMonth(Base, TimestampMixin):
    __tablename__ = "auction_months"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    auction_id: Mapped[int] = mapped_column(
        ForeignKey("auctions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    month_number: Mapped[int] = mapped_column(Integer, nullable=False)
    auction_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    winning_member_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("members.id", ondelete="SET NULL"), nullable=True, index=True
    )
    bid_amount: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2), nullable=True, default=Decimal("0.00")
    )
    community_commission: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2), nullable=True, default=Decimal("0.00")
    )
    dividend_per_member: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2), nullable=True, default=Decimal("0.00")
    )
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)

    # Relationships
    auction = relationship("Auction", back_populates="months")
    winning_member = relationship("Member", back_populates="auction_winners")
    contributions = relationship(
        "MonthlyContribution",
        back_populates="auction_month",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    dividends = relationship(
        "AuctionDividend",
        back_populates="auction_month",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<AuctionMonth(id={self.id}, auction_id={self.auction_id}, month={self.month_number}, status='{self.status}')>"


class MonthlyContribution(Base, TimestampMixin):
    __tablename__ = "monthly_contributions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    auction_month_id: Mapped[int] = mapped_column(
        ForeignKey("auction_months.id", ondelete="CASCADE"), nullable=False, index=True
    )
    member_id: Mapped[int] = mapped_column(
        ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True
    )
    minimum_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00")
    )
    paid_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00")
    )
    paid_status: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    payment_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Relationships
    auction_month = relationship("AuctionMonth", back_populates="contributions")
    member = relationship("Member", back_populates="monthly_payments")

    def __repr__(self) -> str:
        return f"<MonthlyContribution(id={self.id}, month_id={self.auction_month_id}, member_id={self.member_id}, paid={self.paid_status})>"


class AuctionDividend(Base, TimestampMixin):
    __tablename__ = "auction_dividends"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    auction_month_id: Mapped[int] = mapped_column(
        ForeignKey("auction_months.id", ondelete="CASCADE"), nullable=False, index=True
    )
    member_id: Mapped[int] = mapped_column(
        ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True
    )
    dividend_received: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00")
    )

    # Relationships
    auction_month = relationship("AuctionMonth", back_populates="dividends")
    member = relationship("Member")

    def __repr__(self) -> str:
        return f"<AuctionDividend(id={self.id}, month_id={self.auction_month_id}, member_id={self.member_id}, dividend={self.dividend_received})>"
