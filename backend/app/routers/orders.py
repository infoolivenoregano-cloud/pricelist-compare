from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from collections import defaultdict

from ..database import get_db
from ..models import OrderSession, OrderLine, UploadItem, Distributor
from ..schemas import OrderSessionCreate, OrderSessionOut, OrderLineOut

router = APIRouter()


def build_line_out(line: OrderLine, db: Session) -> OrderLineOut:
    ui = line.upload_item
    upload = ui.upload
    dist = db.query(Distributor).filter(Distributor.id == upload.distributor_id).first()
    total = ui.price * line.quantity
    return OrderLineOut(
        id=line.id,
        upload_item_id=ui.id,
        item_name=ui.name,
        item_sku=ui.sku,
        item_pack_size=ui.pack_size,
        item_unit=line.unit_override or ui.unit,
        price=ui.price,
        distributor_id=dist.id,
        distributor_name=dist.name,
        distributor_color=dist.color,
        quantity=line.quantity,
        unit_override=line.unit_override,
        notes=line.notes,
        line_total=total,
    )


@router.post("", response_model=OrderSessionOut, status_code=201)
def create_order(data: OrderSessionCreate, db: Session = Depends(get_db)):
    session = OrderSession(
        name=data.name,
        week_date=data.week_date,
        notes=data.notes,
    )
    db.add(session)
    db.flush()

    for line_data in data.lines:
        ui = db.query(UploadItem).filter(UploadItem.id == line_data.upload_item_id).first()
        if not ui:
            continue
        line = OrderLine(
            session_id=session.id,
            upload_item_id=line_data.upload_item_id,
            quantity=line_data.quantity,
            unit_override=line_data.unit_override,
            notes=line_data.notes,
        )
        db.add(line)

    db.commit()
    db.refresh(session)
    return _session_out(session, db)


@router.get("", response_model=list[OrderSessionOut])
def list_orders(db: Session = Depends(get_db)):
    sessions = db.query(OrderSession).order_by(OrderSession.created_at.desc()).all()
    return [_session_out(s, db, include_lines=False) for s in sessions]


@router.get("/{session_id}", response_model=OrderSessionOut)
def get_order(session_id: int, db: Session = Depends(get_db)):
    session = db.query(OrderSession).filter(OrderSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Not found")
    return _session_out(session, db)


@router.delete("/{session_id}", status_code=204)
def delete_order(session_id: int, db: Session = Depends(get_db)):
    session = db.query(OrderSession).filter(OrderSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(session)
    db.commit()


@router.put("/{session_id}/lines/{line_id}")
def update_line(session_id: int, line_id: int, quantity: float, db: Session = Depends(get_db)):
    line = db.query(OrderLine).filter(
        OrderLine.id == line_id, OrderLine.session_id == session_id
    ).first()
    if not line:
        raise HTTPException(status_code=404, detail="Not found")
    line.quantity = quantity
    db.commit()
    return {"ok": True}


@router.delete("/{session_id}/lines/{line_id}", status_code=204)
def remove_line(session_id: int, line_id: int, db: Session = Depends(get_db)):
    line = db.query(OrderLine).filter(
        OrderLine.id == line_id, OrderLine.session_id == session_id
    ).first()
    if not line:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(line)
    db.commit()


def _session_out(session: OrderSession, db: Session, include_lines=True) -> OrderSessionOut:
    lines = []
    grand_total = 0.0
    if include_lines:
        for line in session.lines:
            lo = build_line_out(line, db)
            lines.append(lo)
            grand_total += lo.line_total
    return OrderSessionOut(
        id=session.id,
        name=session.name,
        week_date=session.week_date,
        created_at=session.created_at,
        notes=session.notes,
        lines=lines,
        grand_total=grand_total,
    )
