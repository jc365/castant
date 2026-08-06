"""
@file notifications.py
@module orchestration/workflows/notifications
"""

import logging
import smtplib
from email.mime.text import MIMEText

from orchestration.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
from orchestration.utils.backend_client import get_user
from orchestration.workflows.base import BaseWorkflow, Event, WorkflowResult

logger = logging.getLogger(__name__)


def _send_email(to: str, subject: str, body: str) -> None:
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = EMAIL_FROM
    msg["To"] = to

    if not SMTP_HOST:
        logger.warning("SMTP not configured — email logged only:\nTo: %s\nSubject: %s\n%s", to, subject, body)
        return

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        if SMTP_PORT != 25:
            server.starttls()
        if SMTP_USER:
            server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
    logger.info("Email sent to %s: %s", to, subject)


class NotificationWorkflow(BaseWorkflow):
    event_type = "review.completed"

    async def execute(self, event: Event) -> WorkflowResult:
        payload = event.payload
        submission_id = payload.get("submission_id", "")
        actor_id = payload.get("actor_id", "")
        score = payload.get("score", 0)
        feedback = payload.get("feedback", "")

        if not actor_id:
            return WorkflowResult(success=False, message="actor_id is required")

        try:
            user = await get_user(actor_id)
        except Exception as e:
            return WorkflowResult(success=False, message=f"Failed to fetch user: {e}")

        actor_name = user.get("name", "Actor")
        actor_email = user.get("email", "")

        if not actor_email:
            return WorkflowResult(success=False, message="Actor has no email")

        stars = "★" * score + "☆" * (5 - score) if score else "Sin calificación"
        body = (
            f"Hola {actor_name},\n\n"
            f"Tu submission {submission_id} ha sido revisada.\n\n"
            f"Calificación: {stars} ({score}/10)\n"
        )
        if feedback:
            body += f"\nFeedback del director:\n{feedback}\n"
        body += "\n— Castant"

        subject = f"Castant: Submission {submission_id} revisada"

        loop = __import__("asyncio").get_running_loop()
        await loop.run_in_executor(None, _send_email, actor_email, subject, body)

        return WorkflowResult(
            success=True,
            message=f"Notification sent to {actor_email}",
            data={"email": actor_email, "actor_name": actor_name},
        )
