import re
import io
import json
from datetime import date
from typing import Optional

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Distributor, ColumnMapping, Upload, UploadItem, CanonicalItem
from ..schemas import ExcelPreview, ColumnMappingOut, UploadOut

router = APIRouter()


def clean_price(val) -> Optional[float]:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    s = str(val).strip().replace("$", "").replace(",", "").strip()
    if not s or s.lower() in ("n/a", "na", "-", ""):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def parse_file(contents: bytes, filename: str, sheet_name: Optional[str], header_row: int) -> tuple[pd.DataFrame, list[str]]:
    """Parse Excel or CSV, return (dataframe, sheet_names)."""
    fname = (filename or "").lower()
    if fname.endswith(".csv") or fname.endswith(".txt"):
        df = pd.read_csv(io.BytesIO(contents), header=header_row, dtype=str)
        df.columns = [str(c).strip() for c in df.columns]
        return df, ["Sheet1"]
    else:
        xls = pd.ExcelFile(io.BytesIO(contents))
        sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
        df = pd.read_excel(io.BytesIO(contents), sheet_name=sheet, header=header_row, dtype=str)
        df.columns = [str(c).strip() for c in df.columns]
        return df, xls.sheet_names


def parse_excel(contents: bytes, sheet_name: Optional[str], header_row: int) -> pd.DataFrame:
    df, _ = parse_file(contents, "file.xlsx", sheet_name, header_row)
    return df


@router.post("/preview")
async def preview_upload(
    file: UploadFile = File(...),
    distributor_id: int = Form(...),
    sheet_name: Optional[str] = Form(None),
    header_row: int = Form(0),
    db: Session = Depends(get_db),
):
    contents = await file.read()
    try:
        df, sheets = parse_file(contents, file.filename or "", sheet_name, header_row)
        columns = list(df.columns)
        preview_rows = df.head(5).fillna("").to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {e}")

    existing_mapping = None
    mapping = db.query(ColumnMapping).filter(ColumnMapping.distributor_id == distributor_id).first()
    if mapping:
        existing_mapping = ColumnMappingOut.model_validate(mapping)

    return ExcelPreview(
        sheets=sheets,
        columns=columns,
        rows=preview_rows,
        existing_mapping=existing_mapping,
    )


@router.post("/confirm", response_model=UploadOut, status_code=201)
async def confirm_upload(
    file: UploadFile = File(...),
    distributor_id: int = Form(...),
    week_date: str = Form(...),
    mapping_json: str = Form(...),
    db: Session = Depends(get_db),
):
    distributor = db.query(Distributor).filter(Distributor.id == distributor_id).first()
    if not distributor:
        raise HTTPException(status_code=404, detail="Distributor not found")

    try:
        mapping_data = json.loads(mapping_json)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid mapping JSON")

    try:
        parsed_date = date.fromisoformat(week_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid week_date format, use YYYY-MM-DD")

    contents = await file.read()
    sheet = mapping_data.get("sheet_name")
    header_row = mapping_data.get("header_row", 0)

    try:
        df, _ = parse_file(contents, file.filename or "", sheet, header_row)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {e}")

    name_col = mapping_data["name_column"]
    price_col = mapping_data["price_column"]
    sku_col = mapping_data.get("sku_column")
    pack_col = mapping_data.get("pack_size_column")
    unit_col = mapping_data.get("unit_column")
    notes_col = mapping_data.get("notes_column")

    if name_col not in df.columns or price_col not in df.columns:
        raise HTTPException(status_code=400, detail="Mapped columns not found in spreadsheet")

    # Upsert column mapping
    cm = db.query(ColumnMapping).filter(ColumnMapping.distributor_id == distributor_id).first()
    if cm:
        for k, v in mapping_data.items():
            if hasattr(cm, k):
                setattr(cm, k, v)
    else:
        cm = ColumnMapping(distributor_id=distributor_id, **{k: v for k, v in mapping_data.items() if hasattr(ColumnMapping, k) and k != "distributor_id"})
        db.add(cm)

    upload = Upload(
        distributor_id=distributor_id,
        filename=file.filename,
        week_date=parsed_date,
        item_count=0,
    )
    db.add(upload)
    db.flush()

    # Collect all valid item names from the sheet first
    valid_rows = []
    for _, row in df.iterrows():
        name_val = str(row.get(name_col, "")).strip()
        if not name_val or name_val.lower() in ("nan", "none", ""):
            continue
        price_val = clean_price(row.get(price_col))
        if price_val is None:
            continue
        valid_rows.append((name_val, price_val, row))

    # Build name→canonical lookup; auto-create canonical items for any new names
    canonicals = db.query(CanonicalItem).all()
    name_to_canonical = {c.name.lower(): c.id for c in canonicals}

    new_names = {name.lower(): name for name, _, _ in valid_rows if name.lower() not in name_to_canonical}
    for lower_name, original_name in new_names.items():
        ci = CanonicalItem(name=original_name)
        db.add(ci)
        db.flush()
        name_to_canonical[lower_name] = ci.id

    count = 0
    for name_val, price_val, row in valid_rows:
        canonical_id = name_to_canonical.get(name_val.lower())

        item = UploadItem(
            upload_id=upload.id,
            sku=str(row[sku_col]).strip() if sku_col and sku_col in df.columns and not pd.isna(row.get(sku_col, float("nan"))) else None,
            name=name_val,
            pack_size=str(row[pack_col]).strip() if pack_col and pack_col in df.columns and not pd.isna(row.get(pack_col, float("nan"))) else None,
            unit=str(row[unit_col]).strip() if unit_col and unit_col in df.columns and not pd.isna(row.get(unit_col, float("nan"))) else None,
            price=price_val,
            notes=str(row[notes_col]).strip() if notes_col and notes_col in df.columns and not pd.isna(row.get(notes_col, float("nan"))) else None,
            canonical_id=canonical_id,
        )
        db.add(item)
        count += 1

    upload.item_count = count
    db.commit()
    db.refresh(upload)

    return UploadOut(
        id=upload.id,
        distributor_id=distributor.id,
        distributor_name=distributor.name,
        distributor_color=distributor.color,
        filename=upload.filename,
        week_date=upload.week_date,
        created_at=upload.created_at,
        item_count=upload.item_count,
    )


@router.get("", response_model=list[UploadOut])
def list_uploads(db: Session = Depends(get_db)):
    uploads = (
        db.query(Upload)
        .join(Distributor)
        .order_by(Upload.week_date.desc(), Distributor.name)
        .all()
    )
    return [
        UploadOut(
            id=u.id,
            distributor_id=u.distributor_id,
            distributor_name=u.distributor.name,
            distributor_color=u.distributor.color,
            filename=u.filename,
            week_date=u.week_date,
            created_at=u.created_at,
            item_count=u.item_count,
        )
        for u in uploads
    ]


@router.delete("/{upload_id}", status_code=204)
def delete_upload(upload_id: int, db: Session = Depends(get_db)):
    u = db.query(Upload).filter(Upload.id == upload_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(u)
    db.commit()
