from datetime import datetime, timezone
from typing import Optional


def parse_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    """Parse datetime string to datetime object"""
    if not dt_str:
        return None
    
    # Try multiple formats
    formats = [
        "%Y-%m-%dT%H:%M:%S",           # 2025-08-20T15:31:00
        "%Y-%m-%dT%H:%M:%S.%f",        # 2025-08-20T15:31:00.000
        "%Y-%m-%dT%H:%M:%SZ",          # 2025-08-20T15:31:00Z
        "%Y-%m-%dT%H:%M:%S.%fZ",       # 2025-08-20T15:31:00.000Z (FIXED!)
        "%Y-%m-%d %H:%M:%S",           # 2025-08-20 15:31:00
        "%Y-%m-%d",                    # 2025-08-20
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(dt_str, fmt)
        except ValueError:
            continue
    
    # If all formats fail, raise an error
    raise ValueError(f"Unable to parse datetime: {dt_str}. Use ISO format like '2025-08-20T15:31:00' or '2025-08-20T15:31:00.000Z'")


def format_datetime_utc(dt: Optional[datetime]) -> Optional[str]:
    """
    Format datetime as UTC ISO string with 'Z' suffix.
    Assumes naive datetimes are in UTC.
    
    Args:
        dt: datetime object (naive or timezone-aware)
    
    Returns:
        ISO format string with 'Z' suffix (e.g., '2025-01-20T15:31:00Z') or None
    """
    if not dt:
        return None
    
    # If datetime is naive, assume it's UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    # Convert to UTC if it has timezone info
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc)
    
    # Format as ISO with 'Z' suffix
    iso_str = dt.isoformat()
    # Replace '+00:00' with 'Z' for cleaner format
    if iso_str.endswith('+00:00'):
        iso_str = iso_str[:-6] + 'Z'
    elif not iso_str.endswith('Z'):
        iso_str = iso_str + 'Z'
    
    return iso_str
