from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

class ReminderSettingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    auction_id: int
    is_enabled: bool
    sms_enabled: bool
    whatsapp_enabled: bool
    automatic_reminder: bool
    due_day: int
    template: str

class ReminderSettingUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    whatsapp_enabled: Optional[bool] = None
    automatic_reminder: Optional[bool] = None
    due_day: Optional[int] = None
    template: Optional[str] = None

class ReminderHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    auction_id: int
    member_id: int
    member_name: Optional[str] = None
    reminder_type: str
    status: str
    sent_at: datetime
    message: str

    @classmethod
    def model_validate(cls, obj, **kwargs):
        # Override to add member_name convenience field
        res = super().model_validate(obj, **kwargs)
        if hasattr(obj, "member") and obj.member:
            res.member_name = obj.member.name
        return res

class SendRemindersRequest(BaseModel):
    member_ids: Optional[List[int]] = None


class GlobalReminderSettingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_enabled: bool
    sms_enabled: bool
    whatsapp_enabled: bool
    reminder_time: str
    template: str


class GlobalReminderSettingUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    whatsapp_enabled: Optional[bool] = None
    reminder_time: Optional[str] = None
    template: Optional[str] = None
