from datetime import date, datetime


def parse_date(value: str | None) -> date | None:
  if not value:
    return None
  return datetime.fromisoformat(value).date()


def days_until(target: date | None) -> int | None:
  if not target:
    return None
  today = date.today()
  return (target - today).days
