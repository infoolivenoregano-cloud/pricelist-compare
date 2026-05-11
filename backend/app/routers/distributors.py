from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Distributor, Upload
from ..schemas import DistributorCreate, DistributorOut

router = APIRouter()


@router.get("", response_model=list[DistributorOut])
def list_distributors(db: Session = Depends(get_db)):
    distributors = db.query(Distributor).order_by(Distributor.name).all()
    result = []
    for d in distributors:
        latest = (
            db.query(func.max(Upload.week_date))
            .filter(Upload.distributor_id == d.id)
            .scalar()
        )
        out = DistributorOut.model_validate(d)
        out.has_mapping = d.column_mapping is not None
        out.latest_upload = latest
        result.append(out)
    return result


@router.post("", response_model=DistributorOut, status_code=201)
def create_distributor(data: DistributorCreate, db: Session = Depends(get_db)):
    existing = db.query(Distributor).filter(Distributor.name == data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Distributor name already exists")
    d = Distributor(**data.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    out = DistributorOut.model_validate(d)
    out.has_mapping = False
    return out


@router.put("/{distributor_id}", response_model=DistributorOut)
def update_distributor(distributor_id: int, data: DistributorCreate, db: Session = Depends(get_db)):
    d = db.query(Distributor).filter(Distributor.id == distributor_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(d, k, v)
    db.commit()
    db.refresh(d)
    out = DistributorOut.model_validate(d)
    out.has_mapping = d.column_mapping is not None
    return out


@router.delete("/{distributor_id}", status_code=204)
def delete_distributor(distributor_id: int, db: Session = Depends(get_db)):
    d = db.query(Distributor).filter(Distributor.id == distributor_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(d)
    db.commit()
