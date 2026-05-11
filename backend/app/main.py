import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import distributors, uploads, items, compare, orders, chat, table, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pricelist Comparator")

_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
origins = ["*"] if _origins_env == "*" else [o.strip() for o in _origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(distributors.router, prefix="/api/distributors", tags=["distributors"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])
app.include_router(items.router, prefix="/api/items", tags=["items"])
app.include_router(compare.router, prefix="/api/compare", tags=["compare"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(table.router, prefix="/api/table", tags=["table"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
