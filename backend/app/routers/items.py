from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from rapidfuzz import process, fuzz

from ..database import get_db
from ..models import CanonicalItem, UploadItem, Upload, Distributor
from ..schemas import (
    CanonicalItemCreate, CanonicalItemUpdate, CanonicalItemOut,
    LinkItemRequest, UnlinkedItem,
)

router = APIRouter()


@router.get("/canonical", response_model=list[CanonicalItemOut])
def list_canonical(db: Session = Depends(get_db)):
    items = db.query(CanonicalItem).order_by(CanonicalItem.name).all()
    result = []
    for item in items:
        linked = db.query(func.count(UploadItem.id)).filter(UploadItem.canonical_id == item.id).scalar()
        out = CanonicalItemOut.model_validate(item)
        out.linked_count = linked
        result.append(out)
    return result


@router.post("/canonical", response_model=CanonicalItemOut, status_code=201)
def create_canonical(data: CanonicalItemCreate, db: Session = Depends(get_db)):
    existing = db.query(CanonicalItem).filter(CanonicalItem.name == data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Item already exists")
    item = CanonicalItem(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    out = CanonicalItemOut.model_validate(item)
    out.linked_count = 0
    return out


@router.put("/canonical/{item_id}", response_model=CanonicalItemOut)
def update_canonical(item_id: int, data: CanonicalItemUpdate, db: Session = Depends(get_db)):
    item = db.query(CanonicalItem).filter(CanonicalItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    linked = db.query(func.count(UploadItem.id)).filter(UploadItem.canonical_id == item.id).scalar()
    out = CanonicalItemOut.model_validate(item)
    out.linked_count = linked
    return out


@router.delete("/canonical/{item_id}", status_code=204)
def delete_canonical(item_id: int, db: Session = Depends(get_db)):
    item = db.query(CanonicalItem).filter(CanonicalItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.query(UploadItem).filter(UploadItem.canonical_id == item_id).update({"canonical_id": None})
    db.delete(item)
    db.commit()


@router.post("/link", status_code=200)
def link_item(data: LinkItemRequest, db: Session = Depends(get_db)):
    ui = db.query(UploadItem).filter(UploadItem.id == data.upload_item_id).first()
    if not ui:
        raise HTTPException(status_code=404, detail="Upload item not found")
    ci = db.query(CanonicalItem).filter(CanonicalItem.id == data.canonical_id).first()
    if not ci:
        raise HTTPException(status_code=404, detail="Canonical item not found")
    ui.canonical_id = data.canonical_id
    db.commit()
    return {"ok": True}


@router.post("/unlink/{upload_item_id}", status_code=200)
def unlink_item(upload_item_id: int, db: Session = Depends(get_db)):
    ui = db.query(UploadItem).filter(UploadItem.id == upload_item_id).first()
    if not ui:
        raise HTTPException(status_code=404, detail="Not found")
    ui.canonical_id = None
    db.commit()
    return {"ok": True}


@router.post("/auto-link")
def auto_link(db: Session = Depends(get_db)):
    canonicals = db.query(CanonicalItem).all()
    if not canonicals:
        return {"linked": 0}

    canonical_names = [c.name for c in canonicals]
    name_to_id = {c.name: c.id for c in canonicals}

    unlinked = db.query(UploadItem).filter(UploadItem.canonical_id.is_(None)).all()
    linked_count = 0

    for ui in unlinked:
        match = process.extractOne(ui.name, canonical_names, scorer=fuzz.WRatio, score_cutoff=85)
        if match:
            ui.canonical_id = name_to_id[match[0]]
            linked_count += 1

    db.commit()
    return {"linked": linked_count}


@router.get("/unlinked", response_model=list[UnlinkedItem])
def get_unlinked(db: Session = Depends(get_db)):
    rows = (
        db.query(UploadItem, Upload, Distributor)
        .join(Upload, UploadItem.upload_id == Upload.id)
        .join(Distributor, Upload.distributor_id == Distributor.id)
        .filter(UploadItem.canonical_id.is_(None))
        .order_by(Distributor.name, UploadItem.name)
        .all()
    )

    canonicals = db.query(CanonicalItem).all()
    canonical_names = [c.name for c in canonicals]
    name_to_id = {c.name: c.id for c in canonicals}

    result = []
    for ui, upload, dist in rows:
        suggestions = []
        if canonical_names:
            matches = process.extract(ui.name, canonical_names, scorer=fuzz.WRatio, limit=3)
            suggestions = [
                {"id": name_to_id[m[0]], "name": m[0], "score": m[1]}
                for m in matches if m[1] >= 60
            ]
        result.append(UnlinkedItem(
            id=ui.id,
            upload_item_id=ui.id,
            name=ui.name,
            sku=ui.sku,
            pack_size=ui.pack_size,
            unit=ui.unit,
            price=ui.price,
            distributor_id=dist.id,
            distributor_name=dist.name,
            distributor_color=dist.color,
            week_date=upload.week_date,
            suggestions=suggestions,
        ))
    return result


@router.post("/create-and-link/{upload_item_id}", response_model=CanonicalItemOut, status_code=201)
def create_and_link(upload_item_id: int, data: CanonicalItemCreate, db: Session = Depends(get_db)):
    ui = db.query(UploadItem).filter(UploadItem.id == upload_item_id).first()
    if not ui:
        raise HTTPException(status_code=404, detail="Upload item not found")
    existing = db.query(CanonicalItem).filter(CanonicalItem.name == data.name).first()
    if existing:
        ui.canonical_id = existing.id
        db.commit()
        out = CanonicalItemOut.model_validate(existing)
        out.linked_count = db.query(func.count(UploadItem.id)).filter(UploadItem.canonical_id == existing.id).scalar()
        return out
    ci = CanonicalItem(**data.model_dump())
    db.add(ci)
    db.flush()
    ui.canonical_id = ci.id
    db.commit()
    db.refresh(ci)
    out = CanonicalItemOut.model_validate(ci)
    out.linked_count = 1
    return out
