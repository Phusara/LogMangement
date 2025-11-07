from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import List
import httpx
import json
from dependencies import get_db
from schemas.logs import LogEntry
from services.logs_service import ingest_logs_service


router = APIRouter(tags=["Logs"])


@router.post("/ingest")
def ingest_event(logs: List[LogEntry], db: Session = Depends(get_db)):
    """Ingest log events into the database"""
    return ingest_logs_service(logs, db)


@router.post("/routerlog/")
async def create_router_log(request: Request):
    """Route logs to appropriate port based on log type"""
    body = await request.body()
    source_data = body.decode()
    print(source_data)
    
    try:
        # Parse the JSON to check log type
        source_json = json.loads(source_data)
        source = source_json.get('source')
        
        # Route based on log type
        port_mapping = {
            'api': 9000,
            'm365': 9001,
            'crowdstrike': 9002,
            'aws': 9003,
            'ad': 9004
        }
        
        target_port = port_mapping.get(source)
        
        if target_port:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"http://vector:{target_port}", 
                    json=source_json
                )
                print(f"Sent {source} log to port {target_port}")
                return {"status": "ok", "sent_to": target_port, "log_type": source}
        else:
            return {"status": "error", "message": f"Unknown source: {source}"}
            
    except Exception as e:
        print(f"Error: {e}")
        return {"status": "error", "message": str(e)}
