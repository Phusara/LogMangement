from datetime import datetime
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
