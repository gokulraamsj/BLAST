from typing import List, Optional

from pydantic import BaseModel, EmailStr, field_validator

# Single source of truth for valid event codes — keep in sync with the
# event cards on the frontend (#events section).
EVENT_CHOICES = {
    "hack-the-grid": "Hack the Grid",
    "bot-arena": "Bot Arena",
    "paper-orbit": "Paper Orbit",
    "pitch-countdown": "Pitch Countdown",
    "cipher-run": "Cipher Run",
    "ui-launchpad": "UI Launchpad",
}


class RegistrationCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    college: str
    year_of_study: Optional[str] = None
    events: List[str]
    team_name: Optional[str] = None
    team_size: Optional[int] = None

    @field_validator("full_name", "phone", "college")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("This field cannot be blank")
        return v.strip()

    @field_validator("events")
    @classmethod
    def validate_events(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("Select at least one event")
        invalid = [e for e in v if e not in EVENT_CHOICES]
        if invalid:
            raise ValueError(f"Unknown event(s): {', '.join(invalid)}")
        return v

    @field_validator("team_size")
    @classmethod
    def positive_team_size(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 1:
            raise ValueError("Team size must be at least 1")
        return v


class RegistrationOut(BaseModel):
    id: int
    message: str
