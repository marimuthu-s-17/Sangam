from schemas.member import MemberResponse
from schemas.auction import AuctionResponse, AuctionMemberResponse
from schemas.expense import ExpenseResponse
from schemas.finance import FinanceResponse
from schemas.loan import LoanResponse, LoanPaymentResponse
from schemas.audit_log import AuditLogResponse
from schemas.reminder import ReminderHistoryResponse

print("MemberResponse:", MemberResponse.model_fields.keys())
print("AuctionResponse:", AuctionResponse.model_fields.keys())
print("AuctionMemberResponse:", AuctionMemberResponse.model_fields.keys())
print("ExpenseResponse:", ExpenseResponse.model_fields.keys())
print("FinanceResponse:", FinanceResponse.model_fields.keys())
print("LoanResponse:", LoanResponse.model_fields.keys())
print("LoanPaymentResponse:", LoanPaymentResponse.model_fields.keys())
print("AuditLogResponse:", AuditLogResponse.model_fields.keys())
print("ReminderHistoryResponse:", ReminderHistoryResponse.model_fields.keys())
