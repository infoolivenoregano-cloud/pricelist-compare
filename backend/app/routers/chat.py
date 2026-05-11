from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ChatMessage
from ..schemas import ChatMessageCreate, ChatMessageOut

router = APIRouter()


@router.get("", response_model=list[ChatMessageOut])
def list_messages(db: Session = Depends(get_db)):
    return db.query(ChatMessage).order_by(ChatMessage.created_at.asc()).all()


@router.post("", response_model=ChatMessageOut, status_code=201)
def create_message(data: ChatMessageCreate, db: Session = Depends(get_db)):
    msg = ChatMessage(**data.model_dump())
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.delete("/{message_id}", status_code=204)
def delete_message(message_id: int, db: Session = Depends(get_db)):
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if msg:
        db.delete(msg)
        db.commit()
