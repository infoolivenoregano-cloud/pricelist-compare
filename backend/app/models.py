from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    restaurant_name = Column(String, nullable=True)
    role = Column(String, default="owner")  # owner | manager | admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Distributor(Base):
    __tablename__ = "distributors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    color = Column(String, default="#6B7280")
    contact_name = Column(String)
    contact_email = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    uploads = relationship("Upload", back_populates="distributor", cascade="all, delete")
    column_mapping = relationship("ColumnMapping", back_populates="distributor", uselist=False, cascade="all, delete")


class ColumnMapping(Base):
    __tablename__ = "column_mappings"

    id = Column(Integer, primary_key=True)
    distributor_id = Column(Integer, ForeignKey("distributors.id"), unique=True)
    header_row = Column(Integer, default=0)
    sheet_name = Column(String)
    sku_column = Column(String)
    name_column = Column(String, nullable=False)
    pack_size_column = Column(String)
    unit_column = Column(String)
    price_column = Column(String, nullable=False)
    notes_column = Column(String)

    distributor = relationship("Distributor", back_populates="column_mapping")


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    distributor_id = Column(Integer, ForeignKey("distributors.id"))
    filename = Column(String)
    week_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    item_count = Column(Integer, default=0)

    distributor = relationship("Distributor", back_populates="uploads")
    items = relationship("UploadItem", back_populates="upload", cascade="all, delete")


class UploadItem(Base):
    __tablename__ = "upload_items"

    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, ForeignKey("uploads.id"))
    sku = Column(String)
    name = Column(String, nullable=False)
    pack_size = Column(String)
    unit = Column(String)
    price = Column(Float, nullable=False)
    notes = Column(Text)
    canonical_id = Column(Integer, ForeignKey("canonical_items.id"), nullable=True)

    upload = relationship("Upload", back_populates="items")
    canonical_item = relationship("CanonicalItem", back_populates="upload_items")


class CanonicalItem(Base):
    __tablename__ = "canonical_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(String)
    menu_price = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    upload_items = relationship("UploadItem", back_populates="canonical_item")


class OrderSession(Base):
    __tablename__ = "order_sessions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    week_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)

    lines = relationship("OrderLine", back_populates="session", cascade="all, delete")


class OrderLine(Base):
    __tablename__ = "order_lines"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("order_sessions.id"))
    upload_item_id = Column(Integer, ForeignKey("upload_items.id"))
    quantity = Column(Float, default=1)
    unit_override = Column(String)
    notes = Column(String)

    session = relationship("OrderSession", back_populates="lines")
    upload_item = relationship("UploadItem")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    author = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    item_ref = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class TableInterest(Base):
    __tablename__ = "table_interest"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_name = Column(String, nullable=False)
    contact_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    tier = Column(String, nullable=False)  # 'professional' | 'enterprise'
    locations = Column(Integer, default=1)
    notes = Column(Text, nullable=True)
    status = Column(String, default='pending')  # pending | contacted | subscribed
    created_at = Column(DateTime, default=datetime.utcnow)
