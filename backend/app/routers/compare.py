from collections import defaultdict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date

from ..database import get_db
from ..models import CanonicalItem, UploadItem, Upload, Distributor
from ..schemas import CompareResponse, CompareItem, PriceEntry

router = APIRouter()


def latest_upload_per_distributor(db: Session, as_of: date) -> dict[int, int]:
    """Returns {distributor_id: upload_id} for the latest upload on or before as_of."""
    subq = (
        db.query(Upload.distributor_id, func.max(Upload.week_date).label("max_date"))
        .filter(Upload.week_date <= as_of)
        .group_by(Upload.distributor_id)
        .subquery()
    )
    rows = (
        db.query(Upload.distributor_id, Upload.id)
        .join(subq, (Upload.distributor_id == subq.c.distributor_id) & (Upload.week_date == subq.c.max_date))
        .all()
    )
    return {r.distributor_id: r.id for r in rows}


def prev_upload_per_distributor(db: Session, current_upload_ids: dict[int, int]) -> dict[int, int]:
    """For each distributor's current upload, find the previous upload."""
    result = {}
    for dist_id, upload_id in current_upload_ids.items():
        current_date = db.query(Upload.week_date).filter(Upload.id == upload_id).scalar()
        prev = (
            db.query(func.max(Upload.week_date))
            .filter(Upload.distributor_id == dist_id, Upload.week_date < current_date)
            .scalar()
        )
        if prev:
            prev_upload = db.query(Upload.id).filter(
                Upload.distributor_id == dist_id, Upload.week_date == prev
            ).scalar()
            result[dist_id] = prev_upload
    return result


@router.get("/weeks")
def available_weeks(db: Session = Depends(get_db)):
    rows = db.query(func.distinct(Upload.week_date)).order_by(Upload.week_date.desc()).all()
    return [r[0] for r in rows]


@router.get("", response_model=CompareResponse)
def compare(
    week_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    all_weeks = db.query(func.distinct(Upload.week_date)).order_by(Upload.week_date.desc()).all()
    available = [r[0] for r in all_weeks]

    if week_date:
        target_date = date.fromisoformat(week_date)
    elif available:
        target_date = available[0]
    else:
        return CompareResponse(week_date=date.today(), distributors=[], items=[], available_weeks=[])

    current_uploads = latest_upload_per_distributor(db, target_date)
    prev_uploads = prev_upload_per_distributor(db, current_uploads)

    distributors = db.query(Distributor).order_by(Distributor.name).all()
    dist_list = [
        {
            "id": d.id,
            "name": d.name,
            "color": d.color,
            "upload_id": current_uploads.get(d.id),
        }
        for d in distributors
        if d.id in current_uploads
    ]
    active_upload_ids = list(current_uploads.values())

    # Get all upload items from current uploads that have a canonical link
    rows = (
        db.query(UploadItem, Upload)
        .join(Upload, UploadItem.upload_id == Upload.id)
        .filter(
            UploadItem.upload_id.in_(active_upload_ids),
            UploadItem.canonical_id.isnot(None),
        )
        .all()
    )

    # Group by canonical_id
    canonical_prices: dict[int, dict[int, PriceEntry]] = defaultdict(dict)
    for ui, upload in rows:
        dist_id = upload.distributor_id
        canonical_prices[ui.canonical_id][dist_id] = PriceEntry(
            upload_item_id=ui.id,
            price=ui.price,
            pack_size=ui.pack_size,
            unit=ui.unit,
            prev_price=None,
            change_pct=None,
            sku=ui.sku,
        )

    # Get previous prices
    prev_upload_ids = list(prev_uploads.values())
    if prev_upload_ids:
        prev_rows = (
            db.query(UploadItem, Upload)
            .join(Upload, UploadItem.upload_id == Upload.id)
            .filter(
                UploadItem.upload_id.in_(prev_upload_ids),
                UploadItem.canonical_id.isnot(None),
            )
            .all()
        )
        for ui, upload in prev_rows:
            dist_id = upload.distributor_id
            if ui.canonical_id in canonical_prices and dist_id in canonical_prices[ui.canonical_id]:
                entry = canonical_prices[ui.canonical_id][dist_id]
                entry.prev_price = ui.price
                if ui.price and ui.price != 0:
                    entry.change_pct = round((entry.price - ui.price) / ui.price * 100, 1)

    # Fetch canonical items
    canonical_ids = list(canonical_prices.keys())
    canonicals = db.query(CanonicalItem).filter(CanonicalItem.id.in_(canonical_ids)).all()
    canonical_map = {c.id: c for c in canonicals}

    items = []
    for cid, prices in canonical_prices.items():
        ci = canonical_map.get(cid)
        if not ci:
            continue
        best_dist_id = min(prices, key=lambda did: prices[did].price) if prices else None
        items.append(CompareItem(
            canonical_id=cid,
            canonical_name=ci.name,
            category=ci.category,
            menu_price=ci.menu_price,
            prices=prices,
            best_distributor_id=best_dist_id,
        ))

    items.sort(key=lambda x: (x.category or "zzz", x.canonical_name))

    return CompareResponse(
        week_date=target_date,
        distributors=dist_list,
        items=items,
        available_weeks=available,
    )
