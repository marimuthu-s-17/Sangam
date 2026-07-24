from sqlalchemy import event
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import get_history
from models.member import Member
from models.auction import Auction
from models.expense import Expense
from models.loan import Loan, LoanPayment
from models.monthly_auction import AuctionMonth
from models.audit_log import AuditLog

@event.listens_for(Session, 'after_flush')
def receive_after_flush(session, flush_context):
    # Log inserts (new objects)
    for obj in session.new:
        classname = obj.__class__.__name__
        if classname == "Member":
            session.add(AuditLog(action=f"Member registered: {obj.name}", module="Members", user="Admin"))
        elif classname == "Auction":
            session.add(AuditLog(action=f"Auction created: {obj.name}", module="Auctions", user="Admin"))
        elif classname == "Expense":
            session.add(AuditLog(action=f"Expense recorded: {obj.description} (₹{obj.amount})", module="Expenses", user="Admin"))
        elif classname == "Loan":
            session.add(AuditLog(action=f"Loan disbursed to {obj.borrower_name} (₹{obj.loan_amount})", module="Loans", user="Admin"))
        elif classname == "LoanPayment":
            session.add(AuditLog(action=f"Loan payment recorded for Loan ID {obj.loan_id}: interest=₹{obj.interest_payment}, principal=₹{obj.principal_payment}", module="Loans", user="Admin"))
        elif classname == "AuctionMonth":
            if obj.status == "completed":
                session.add(AuditLog(action=f"Auction Month Completed: Month {obj.month_number}", module="Auctions", user="Admin"))

    # Log updates (dirty objects)
    for obj in session.dirty:
        classname = obj.__class__.__name__
        if classname == "AuctionMonth":
            state = session.is_modified(obj, include_collections=False)
            if state:
                hist = get_history(obj, 'status')
                if hist.has_changes() and obj.status == "completed":
                    session.add(AuditLog(action=f"Auction Month Completed: Month {obj.month_number}", module="Auctions", user="Admin"))
        elif classname == "Member":
            session.add(AuditLog(action=f"Member updated: {obj.name}", module="Members", user="Admin"))
        elif classname == "Auction":
            session.add(AuditLog(action=f"Auction updated: {obj.name}", module="Auctions", user="Admin"))
        elif classname == "Expense":
            hist = get_history(obj, 'is_deleted')
            if hist.has_changes() and obj.is_deleted:
                session.add(AuditLog(action=f"Expense soft-deleted: {obj.description}", module="Expenses", user="Admin"))
            else:
                session.add(AuditLog(action=f"Expense updated: {obj.description}", module="Expenses", user="Admin"))
        elif classname == "Loan":
            session.add(AuditLog(action=f"Loan updated: {obj.borrower_name} (Status: {obj.status})", module="Loans", user="Admin"))

    # Log deletes (deleted objects)
    for obj in session.deleted:
        classname = obj.__class__.__name__
        if classname == "Member":
            session.add(AuditLog(action=f"Member deleted: {obj.name}", module="Members", user="Admin"))
        elif classname == "Auction":
            session.add(AuditLog(action=f"Auction deleted: {obj.name}", module="Auctions", user="Admin"))
        elif classname == "Expense":
            session.add(AuditLog(action=f"Expense deleted: {obj.description}", module="Expenses", user="Admin"))
        elif classname == "Loan":
            session.add(AuditLog(action=f"Loan record deleted: borrower={obj.borrower_name}", module="Loans", user="Admin"))
