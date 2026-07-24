from sqlalchemy import String, Date, Numeric, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.base import Base, TimestampMixin
from datetime import date
from decimal import Decimal
import enum


class TransactionType(str, enum.Enum):
    """Transaction type enum - values match PostgreSQL enum exactly."""
    PAYMENT = "PAYMENT"
    RECEIPT = "RECEIPT"
    ADJUSTMENT = "ADJUSTMENT"


class Finance(Base, TimestampMixin):
    __tablename__ = "finances"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    member_id: Mapped[int | None] = mapped_column(
        ForeignKey("members.id", ondelete="SET NULL"), nullable=True
    )
    transaction_type: Mapped[TransactionType] = mapped_column(
        SAEnum(
            TransactionType,
            name="transaction_type",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    transaction_date: Mapped[date] = mapped_column(
        Date, nullable=False, default=date.today, index=True
    )
    reference_number: Mapped[str | None] = mapped_column(
        String(50), nullable=True, unique=True
    )

    # Relationships
    member = relationship("Member", back_populates="finances", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Finance(id={self.id}, type='{self.transaction_type}', amount={self.amount})>"
