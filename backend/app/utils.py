from datetime import date, datetime


def parse_date(value: str | None) -> date | None:
  if not value:
    return None
  if not isinstance(value, str):
    raise ValueError("Date value must be an ISO string")
  value = value.strip()
  if not value:
    return None
  # Accept YYYY-MM by coercing to first day of month.
  if len(value) == 7:
    value = f"{value}-01"
  return datetime.fromisoformat(value).date()


def days_until(target: date | None) -> int | None:
  if not target:
    return None
  today = date.today()
  return (target - today).days
