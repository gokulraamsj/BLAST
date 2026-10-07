import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Defaults to a local SQLite file. On Render, set DATABASE_URL to a
# managed Postgres connection string for data that survives redeploys
# (Render's free-tier disk is ephemeral, so SQLite there will reset).
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./registrations.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
