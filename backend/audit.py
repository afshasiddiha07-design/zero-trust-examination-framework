import hashlib
import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models import AuditLog


def create_audit_log(
    db: Session,
    username: str,
    action: str,
    details: str
):
    previous_log = (
        db.query(AuditLog)
        .order_by(AuditLog.id.desc())
        .first()
    )

    previous_hash = (
        previous_log.log_hash
        if previous_log
        else ""
    )

    timestamp = datetime.now(timezone.utc).isoformat()

    log_data = {
        "username": username,
        "action": action,
        "details": details,
        "timestamp": timestamp,
        "previous_hash": previous_hash
    }

    log_hash = hashlib.sha256(
        json.dumps(
            log_data,
            sort_keys=True
        ).encode("utf-8")
    ).hexdigest()

    new_log = AuditLog(
        username=username,
        action=action,
        details=details,
        timestamp=timestamp,
        previous_hash=previous_hash,
        log_hash=log_hash
    )

    db.add(new_log)

    return new_log