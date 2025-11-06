from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import auth_route, logs_route, dashboard_route, alerts_route

app = FastAPI(title="Log Management API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_route.router)
app.include_router(logs_route.router)
app.include_router(dashboard_route.router)
app.include_router(alerts_route.router)


@app.get("/")
def read_root():
    return {"message": "Log Management API", "version": "1.0.0"}


