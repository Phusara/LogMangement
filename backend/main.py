from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import auth_route, logs_route, dashboard_route, alerts_route, retention_route
from apscheduler.schedulers.background import BackgroundScheduler
from database import SessionLocal
from services.retention_service import delete_old_data
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Log Management API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Scheduler for data retention
def run_delete_old_data():
    db = SessionLocal()
    try:
        logger.info("Running scheduled task to delete old data.")
        delete_old_data(db)
    finally:
        db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(run_delete_old_data, 'interval', days=1)
scheduler.start()

# Include routers
app.include_router(auth_route.router)
app.include_router(logs_route.router)
app.include_router(dashboard_route.router)
app.include_router(alerts_route.router)
app.include_router(retention_route.router)


@app.get("/")
def read_root():
    return {"message": "Log Management API", "version": "1.0.0"}

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()


