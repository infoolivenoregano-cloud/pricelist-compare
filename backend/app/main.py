from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import distributors, uploads, items, compare, orders

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pricelist Comparator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(distributors.router, prefix="/api/distributors", tags=["distributors"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])
app.include_router(items.router, prefix="/api/items", tags=["items"])
app.include_router(compare.router, prefix="/api/compare", tags=["compare"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
