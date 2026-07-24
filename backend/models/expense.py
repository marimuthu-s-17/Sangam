from sqlalchemy import String, Date, Numeric, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from database.base import Base, TimestampMixin
from datetime import date
from decimal import Decimal


class Expense(Base, TimestampMixin):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    category: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True, default="general"
    )
    expense_date: Mapped[date] = mapped_column(
        Date, nullable=False, default=date.today, index=True
    )
    paid_to: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False, default="cash", server_default="cash")
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default="false")

    def __repr__(self) -> str:
        return f"<Expense(id={self.id}, description='{self.description}', amount={self.amount})>"
