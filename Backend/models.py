from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from database import Base


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True, unique=True)
    phone = Column(String, nullable=False)
    college = Column(String, nullable=False)
    year_of_study = Column(String, nullable=True)
    events = Column(String, nullable=False)  # comma-separated event codes
    team_name = Column(String, nullable=True)
    team_size = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
