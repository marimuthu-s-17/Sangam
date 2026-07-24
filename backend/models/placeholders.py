from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.base import Base


class MonthlyPayment(Base):
    __tablename__ = "monthly_payments_placeholder"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id", ondelete="CASCADE"))
    
    member = relationship("Member", back_populates="monthly_payments")


class AuctionWinner(Base):
    __tablename__ = "auction_winners_placeholder"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id", ondelete="CASCADE"))
    
    member = relationship("Member", back_populates="auction_winners")



