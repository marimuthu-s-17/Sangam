from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from decimal import Decimal

class SettingUpdate(BaseModel):
    community_name: str = Field(..., min_length=1, max_length=100)
    default_commission: Decimal = Field(..., ge=0, le=100)
    default_monthly_contribution: Decimal = Field(..., ge=0)
    currency: str = Field(..., min_length=1, max_length=10)
    theme: str = Field(..., min_length=1, max_length=20)

class SettingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    community_name: str
    default_commission: Decimal
    default_monthly_contribution: Decimal
    currency: str
    theme: str
    created_at: datetime
    updated_at: datetime
