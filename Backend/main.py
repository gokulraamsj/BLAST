import csv
import io
import os
import secrets

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.templating import Jinja2Templates
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Registration
from schemas import EVENT_CHOICES, RegistrationCreate, RegistrationOut

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="BLAST Symposium API")

# Comma-separated list, e.g. "https://yourname.github.io,http://localhost:5500"
ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory="templates")
security = HTTPBasic()

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "changeme")


def require_admin(credentials: HTTPBasicCredentials = Depends(security)) -> str:
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/events")
def list_events():
    return EVENT_CHOICES


@app.get("/api/stats")
def stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Registration.id)).scalar()
    return {"total_registrations": total}


@app.post("/api/register", response_model=RegistrationOut, status_code=201)
def register(payload: RegistrationCreate, db: Session = Depends(get_db)):
    existing = db.query(Registration).filter(Registration.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="This email has already been registered. Contact us to make changes.",
        )

    reg = Registration(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        college=payload.college,
        year_of_study=payload.year_of_study,
        events=",".join(payload.events),
        team_name=payload.team_name,
        team_size=payload.team_size,
    )
    db.add(reg)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This email has already been registered.")
    db.refresh(reg)
    return RegistrationOut(id=reg.id, message="Registration successful")


@app.get("/admin", response_class=HTMLResponse)
def admin_dashboard(
    request: Request,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    registrations = db.query(Registration).order_by(Registration.created_at.desc()).all()
    return templates.TemplateResponse(request,
        "admin_dashboard.html",
        {
            "registrations": registrations,
            "event_names": EVENT_CHOICES,
            "total": len(registrations),
        },
    )


@app.get("/admin/export.csv")
def export_csv(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    registrations = db.query(Registration).order_by(Registration.created_at.desc()).all()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        ["ID", "Name", "Email", "Phone", "College", "Year", "Events",
         "Team Name", "Team Size", "Registered At"]
    )
    for r in registrations:
        writer.writerow(
            [r.id, r.full_name, r.email, r.phone, r.college, r.year_of_study or "",
             r.events, r.team_name or "", r.team_size or "", r.created_at]
        )
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=blast_registrations.csv"},
    )
