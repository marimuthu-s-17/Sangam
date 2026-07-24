from sqlalchemy import String, Date, Numeric, Text, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.base import Base, TimestampMixin
from datetime import date
from decimal import Decimal


class Loan(Base, TimestampMixin):
    __tablename__ = "loans"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    borrower_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    phone_number: Mapped[str] = mapped_column(String(15), nullable=False, index=True)
    member_id: Mapped[int | None] = mapped_column(
        ForeignKey("members.id", ondelete="SET NULL"), nullable=True
    )
    loan_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    interest_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)  # annual rate, e.g. 12.00
    loan_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    outstanding_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)  # active, closed, overdue
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    member = relationship("Member", back_populates="loans", lazy="selectin")
    payments = relationship("LoanPayment", back_populates="loan", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Loan(id={self.id}, borrower='{self.borrower_name}', amount={self.loan_amount}, status='{self.status}')>"


class LoanPayment(Base, TimestampMixin):
    __tablename__ = "loan_payments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    loan_id: Mapped[int] = mapped_column(
        ForeignKey("loans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    interest_payment: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    principal_payment: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    remaining_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    loan = relationship("Loan", back_populates="payments")

    def __repr__(self) -> str:
        return f"<LoanPayment(id={self.id}, loan_id={self.loan_id}, interest={self.interest_payment}, principal={self.principal_payment})>"
