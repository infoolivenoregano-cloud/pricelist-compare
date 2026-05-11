from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import TableInterest
from ..schemas import TableInterestCreate, TableInterestOut

router = APIRouter()


@router.post("/interest", response_model=TableInterestOut, status_code=201)
def submit_interest(data: TableInterestCreate, db: Session = Depends(get_db)):
    record = TableInterest(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/interest", response_model=list[TableInterestOut])
def list_interest(db: Session = Depends(get_db)):
    return db.query(TableInterest).order_by(TableInterest.created_at.desc()).all()
