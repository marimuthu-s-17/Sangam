from sqlalchemy import String, DateTime, ForeignKey, Boolean, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.base import Base
from datetime import datetime

class ReminderSetting(Base):
    __tablename__ = "reminder_settings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    auction_id: Mapped[int] = mapped_column(
        ForeignKey("auctions.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sms_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    whatsapp_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    automatic_reminder: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    due_day: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    template: Mapped[str] = mapped_column(
        Text, 
        default="Dear {member_name}, this is a reminder for your contribution of ₹{contribution_amount} to auction '{auction_name}' due on {due_date}. Status: {payment_status}.", 
        nullable=False
    )

    # Relationship
    auction = relationship("Auction", backref="reminder_settings", lazy="joined")

    def __repr__(self) -> str:
        return f"<ReminderSetting(id={self.id}, auction_id={self.auction_id}, is_enabled={self.is_enabled})>"


class GlobalReminderSetting(Base):
    __tablename__ = "global_reminder_settings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sms_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    whatsapp_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reminder_time: Mapped[str] = mapped_column(String(5), default="09:00", nullable=False)
    template: Mapped[str] = mapped_column(
        Text, 
        default="Dear {member_name}, this is a reminder for your contribution of ₹{contribution_amount} to auction '{auction_name}' due on {due_date}. Status: {payment_status}.", 
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<GlobalReminderSetting(id={self.id}, is_enabled={self.is_enabled})>"


class ReminderHistory(Base):
    __tablename__ = "reminder_histories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    auction_id: Mapped[int] = mapped_column(
        ForeignKey("auctions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    member_id: Mapped[int] = mapped_column(
        ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reminder_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "sms", "whatsapp"
    status: Mapped[str] = mapped_column(String(20), default="sent", nullable=False)  # "sent", "delivered", "failed"
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    auction = relationship("Auction", backref="reminder_history", lazy="joined")
    member = relationship("Member", backref="reminder_history", lazy="joined")

    def __repr__(self) -> str:
        return f"<ReminderHistory(id={self.id}, auction_id={self.auction_id}, member_id={self.member_id}, status='{self.status}')>"
