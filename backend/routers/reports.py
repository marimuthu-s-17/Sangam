from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from services.report_service import ReportService
from typing import Optional
from datetime import date

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


def add_total_row_if_needed(headers: list[str], rows: list[list]) -> list[list]:
    """Appends a total summary row to rows if there are numeric currency/amount columns."""
    monetary_indices = []
    for idx, h in enumerate(headers):
        hl = h.lower()
        if any(term in hl for term in ["amount", "balance", "interest", "principal", "outstanding", "winnings", "bid", "dividend", "contribution", "paid", "total"]):
            monetary_indices.append(idx)
            
    if not monetary_indices or not rows:
        return rows
        
    totals = [0.0] * len(headers)
    has_totals = False
    
    for r in rows:
        for idx in monetary_indices:
            try:
                if idx < len(r):
                    val = r[idx]
                    if val is not None:
                        if isinstance(val, (int, float)):
                            totals[idx] += float(val)
                            has_totals = True
                        else:
                            cleaned = str(val).replace("₹", "").replace(",", "").strip()
                            if cleaned:
                                totals[idx] += float(cleaned)
                                has_totals = True
            except (ValueError, TypeError):
                pass
                
    if has_totals:
        total_row = [""] * len(headers)
        total_row[0] = "Total Summary"
        for idx in monetary_indices:
            total_row[idx] = round(totals[idx], 2)
        return list(rows) + [total_row]
        
    return rows


def get_headers_and_rows(report_type: str, data: list[dict]) -> tuple[list[str], list[list]]:
    """Convert JSON report data to CSV/Excel raw headers and rows."""
    if report_type == "monthly-expense" or report_type == "category-expense":
        headers = ["ID", "Date", "Category", "Description", "Amount (₹)", "Payment Method", "Remarks"]
        rows = [
            [
                item["id"],
                item["date"],
                item["category"].capitalize(),
                item["description"],
                item["amount"],
                item["payment_method"].upper(),
                item["remarks"],
            ]
            for item in data
        ]
        return headers, rows

    elif report_type == "loans":
        headers = [
            "ID",
            "Borrower Name",
            "Phone Number",
            "Loan Amount (₹)",
            "Interest Rate (%)",
            "Loan Date",
            "Due Date",
            "Outstanding (₹)",
            "Status",
            "Remarks",
        ]
        rows = [
            [
                item["id"],
                item["borrower_name"],
                item["phone_number"],
                item["loan_amount"],
                item["interest_rate"],
                item["loan_date"],
                item["due_date"],
                item["outstanding_amount"],
                item["status"].upper(),
                item["remarks"],
            ]
            for item in data
        ]
        return headers, rows

    elif report_type == "interest-collection":
        headers = ["Payment ID", "Loan ID", "Borrower Name", "Payment Date", "Interest Paid (₹)", "Payment Method", "Notes"]
        rows = [
            [
                item["payment_id"],
                item["loan_id"],
                item["borrower_name"],
                item["payment_date"],
                item["interest_payment"],
                item["payment_method"].upper(),
                item["notes"],
            ]
            for item in data
        ]
        return headers, rows

    elif report_type == "outstanding-loans":
        headers = [
            "Loan ID",
            "Borrower Name",
            "Phone Number",
            "Loan Amount (₹)",
            "Interest Rate (%)",
            "Loan Date",
            "Due Date",
            "Outstanding (₹)",
            "Status",
            "Remarks",
        ]
        rows = [
            [
                item["id"],
                item["borrower_name"],
                item["phone_number"],
                item["loan_amount"],
                item["interest_rate"],
                item["loan_date"],
                item["due_date"],
                item["outstanding_amount"],
                item["status"].upper(),
                item["remarks"],
            ]
            for item in data
        ]
        return headers, rows

    elif report_type == "members":
        headers = ["Member ID", "Name", "Phone", "Joined Date", "Status", "Total Contributions (₹)", "Outstanding Balance (₹)"]
        rows = [
            [
                item["id"],
                item["name"],
                item["phone"],
                item["joined_date"],
                item["status"].upper(),
                item["total_contributions"],
                item["outstanding_balance"]
            ]
            for item in data
        ]
        return headers, rows

    elif report_type == "auctions":
        headers = ["Auction ID", "Name", "Start Month", "Duration (Months)", "Prize Amount (₹)", "Status", "Current Month"]
        rows = [
            [
                item["id"],
                item["name"],
                item["start_month"],
                item["duration"],
                item["prize_amount"],
                item["status"].upper(),
                item["current_month"]
            ]
            for item in data
        ]
        return headers, rows

    elif report_type == "profit-loss":
        headers = ["Financial Metric", "Amount (₹)"]
        rows = [
            [
                item["metric"],
                item["amount"]
            ]
            for item in data
        ]
        return headers, rows

    else:
        raise HTTPException(status_code=400, detail="Invalid report type")


@router.get("/{report_type}", response_model=dict)
async def get_report_preview(
    report_type: str,
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve report preview data in JSON format."""
    if report_type == "monthly-expense":
        if not year or not month:
            today = date.today()
            year, month = today.year, today.month
        data = await ReportService.get_monthly_expense_data(db, year, month)
        return {"report_type": report_type, "title": f"Monthly Expense Report - {month}/{year}", "data": data}

    elif report_type == "category-expense":
        if not category:
            category = "general"
        data = await ReportService.get_category_expense_data(db, category)
        return {"report_type": report_type, "title": f"Category Expense Report - {category.capitalize()}", "data": data}

    elif report_type == "loans":
        data = await ReportService.get_loan_data(db)
        return {"report_type": report_type, "title": "Overall Loan Report", "data": data}

    elif report_type == "interest-collection":
        data = await ReportService.get_interest_collection_data(db)
        return {"report_type": report_type, "title": "Interest Collection Report", "data": data}

    elif report_type == "outstanding-loans":
        data = await ReportService.get_outstanding_loan_data(db)
        return {"report_type": report_type, "title": "Outstanding Loan Report", "data": data}

    elif report_type == "members":
        data = await ReportService.get_member_report_data(db)
        return {"report_type": report_type, "title": "Member Directory Report", "data": data}

    elif report_type == "auctions":
        data = await ReportService.get_auction_report_data(db)
        return {"report_type": report_type, "title": "Auction Summary Report", "data": data}

    elif report_type == "profit-loss":
        data = await ReportService.get_profit_loss_report_data(db)
        return {"report_type": report_type, "title": "Profit & Loss Statement", "data": data}

    else:
        raise HTTPException(status_code=400, detail="Invalid report type")


@router.get("/{report_type}/export")
async def export_report(
    report_type: str,
    format: str = Query(..., description="Export format: pdf, excel, csv"),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Generate and download reports in PDF, Excel, or CSV format."""
    if report_type == "monthly-expense":
        if not year or not month:
            today = date.today()
            year, month = today.year, today.month
        data = await ReportService.get_monthly_expense_data(db, year, month)
        title = f"Monthly Expense Report ({month}-{year})"
        filename = f"monthly_expense_report_{year}_{month}"

    elif report_type == "category-expense":
        if not category:
            category = "general"
        data = await ReportService.get_category_expense_data(db, category)
        title = f"Category Expense Report ({category.capitalize()})"
        filename = f"category_expense_report_{category}"

    elif report_type == "loans":
        data = await ReportService.get_loan_data(db)
        title = "Overall Loan Report"
        filename = "overall_loan_report"

    elif report_type == "interest-collection":
        data = await ReportService.get_interest_collection_data(db)
        title = "Interest Collection Report"
        filename = "interest_collection_report"

    elif report_type == "outstanding-loans":
        data = await ReportService.get_outstanding_loan_data(db)
        title = "Outstanding Loan Report"
        filename = "outstanding_loan_report"

    elif report_type == "members":
        data = await ReportService.get_member_report_data(db)
        title = "Member Directory Report"
        filename = "member_directory_report"

    elif report_type == "auctions":
        data = await ReportService.get_auction_report_data(db)
        title = "Auction Summary Report"
        filename = "auction_summary_report"

    elif report_type == "profit-loss":
        data = await ReportService.get_profit_loss_report_data(db)
        title = "Profit & Loss Statement"
        filename = "profit_loss_statement"

    else:
        raise HTTPException(status_code=400, detail="Invalid report type")

    headers, rows = get_headers_and_rows(report_type, data)
    from services.setting_service import SettingService
    setting = await SettingService.get(db)
    title = f"{setting.community_name} - {title}"
    rows = add_total_row_if_needed(headers, rows)

    if format == "csv":
        csv_data = ReportService.generate_csv(headers, rows)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"},
        )

    elif format == "excel":
        xlsx_data = ReportService.generate_excel(title, headers, rows)
        return Response(
            content=xlsx_data,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}.xlsx"},
        )

    elif format == "pdf":
        pdf_data = ReportService.generate_pdf(title, headers, rows)
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}.pdf"},
        )

    else:
        raise HTTPException(status_code=400, detail="Invalid export format")
