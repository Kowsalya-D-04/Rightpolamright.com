"""RightPolamRight Logistics Platform -- FastAPI application entrypoint."""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import Base, engine
import models  # noqa: F401  (registers all tables)
from routers import (
    auth, locations, uploads, customer_portal, customers, dashboard, driver_portal, drivers,
    load_requests, notifications, payments, pricing, reports, trips, trucks,
)
import migrate

Base.metadata.create_all(bind=engine)
# Bring an older database up to date without losing its data.
_applied = migrate.run()
if _applied:
    print("Schema migration applied:", ", ".join(_applied))

app = FastAPI(
    title="RightPolamRight API",
    description="Smart Logistics Partner -- loads, matching, trips, payments.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",
                   "http://localhost:4173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth.router,
          # customer and driver portals
          customer_portal.router, driver_portal.router,
          # admin console
          dashboard.router, load_requests.router, drivers.router,
          trucks.router, customers.router, trips.router, payments.router,
          notifications.router, reports.router, pricing.router,
          locations.router, uploads.router,
          pricing.quote_router):
    app.include_router(r)


# Uploaded load images are served straight from disk.
_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(_UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_UPLOAD_DIR), name="uploads")


@app.get("/")
def root():
    return {"name": "RightPolamRight API", "status": "running", "docs": "/docs"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
