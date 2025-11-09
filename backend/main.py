from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import auth_route, logs_route, dashboard_route, alerts_route, retention_route
from apscheduler.schedulers.background import BackgroundScheduler
from database import SessionLocal, Base, engine
from services.retention_service import delete_old_data
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# Base.metadata.create_all(bind=engine)
app = FastAPI(title="Log Management API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
        result = delete_old_data(db, days=7)
        logger.info(f"Cleanup completed: {result}")
    except Exception as e:
        logger.error(f"Scheduled cleanup failed: {e}")
    finally:
        db.close()

scheduler = BackgroundScheduler()
# Run every 30 minutes
scheduler.add_job(run_delete_old_data, 'interval', minutes=30, id='cleanup_job')
scheduler.start()

logger.info("Scheduler started: Data retention cleanup runs every 30 minutes")

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
    logger.info("Scheduler shutdown")


