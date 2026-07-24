from sqlalchemy import String, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from database.base import Base, TimestampMixin
from decimal import Decimal

class Setting(Base, TimestampMixin):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    community_name: Mapped[str] = mapped_column(String(100), default="Sangam Community")
    default_commission: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("2.00"))
    default_monthly_contribution: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("1000.00"))
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    theme: Mapped[str] = mapped_column(String(20), default="light")
