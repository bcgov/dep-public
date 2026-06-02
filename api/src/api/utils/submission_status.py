"""Calculate the submission status."""

from datetime import timezone

from api.constants.engagement_status import Status, SubmissionStatus
from api.utils.datetime import utc_datetime


def _as_utc_aware(value):
    """Return a UTC-aware datetime."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def get_submission_status(obj):
    """Get the submission status of the engagement."""
    now = _as_utc_aware(utc_datetime())
    start_date = _as_utc_aware(obj.start_date)
    end_date = _as_utc_aware(obj.end_date)

    if obj.status_id in (Status.Draft.value, Status.Scheduled.value):
        submission_status = SubmissionStatus.Upcoming.value
    elif obj.status_id == Status.Closed.value:
        submission_status = SubmissionStatus.Closed.value
    elif now < start_date:
        submission_status = SubmissionStatus.Upcoming.value
    elif now < end_date:
        submission_status = SubmissionStatus.Open.value
    else:
        submission_status = SubmissionStatus.Closed.value

    return submission_status
