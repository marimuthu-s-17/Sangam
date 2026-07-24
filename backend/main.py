from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

from database.connection import engine
from database.base import Base

# Import all models so they are registered with Base
from models import Member, Auction, Expense, Finance, AuctionMember, Loan  # noqa: F401
import services.audit_listeners  # noqa: F401

from routers import members, auctions, expenses, finance, dashboard, monthly_auctions, ledger, loans, reports, settings

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    yield
    # Cleanup on shutdown
    await engine.dispose()
    print("🔌 Database connections closed")


app = FastAPI(
    title=os.getenv("APP_NAME", "Sangam Auction Management"),
    description="Production-quality Auction Management System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(dashboard.router)
app.include_router(members.router)
app.include_router(auctions.router)
app.include_router(expenses.router)
app.include_router(finance.router)
app.include_router(loans.router)
app.include_router(reports.router)
app.include_router(monthly_auctions.router)
app.include_router(ledger.router)
app.include_router(settings.router)


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": os.getenv("APP_NAME", "Sangam Auction Management"),
        "version": "1.0.0",
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",
        "version": "1.0.0",
    }
