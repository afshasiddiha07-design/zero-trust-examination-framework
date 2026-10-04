from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from database import get_db
from audit import create_audit_log
from sqlalchemy.orm import Session
from fastapi import Depends

router = APIRouter(prefix="/security", tags=["Security"])

SECURITY_MONITOR_KEY = "change-this-monitor-key"


class SecurityIncident(BaseModel):
    incident_type: str
    confidence: float
    source: str = "AI_SECURITY_MONITOR"


@router.post("/incidents")
def create_security_incident(
    incident: SecurityIncident,
    x_monitor_key: str = Header(None),
    db: Session = Depends(get_db)
):
    if x_monitor_key != SECURITY_MONITOR_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid security monitor key"
        )

    create_audit_log(
        db=db,
        username="AI_SECURITY_MONITOR",
        action=incident.incident_type,
        details=(
            f"Security incident detected. "
            f"Confidence: {incident.confidence:.2f}, "
            f"Source: {incident.source}"
        )
    )

    db.commit()

    return {
        "status": "recorded",
        "incident_type": incident.incident_type,
        "confidence": incident.confidence,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }