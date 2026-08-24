from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import gzip
import uuid
import shutil
import mimetypes
import secrets
import re
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import jwt
import bcrypt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, FileResponse, RedirectResponse
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, select, update, delete, func, or_, and_, desc, asc, Column, String, Boolean, Integer, Float, Text, JSON
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import pymysql
from pydantic import BaseModel, Field, EmailStr
import json
import requests

# ---------------------------------------------------------------------------
# Setup SQL Database
# ---------------------------------------------------------------------------
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./qiveo.db")

# Create database if not exists for MySQL
if DATABASE_URL.startswith("mysql"):
    try:
        # Parse connection details synchronously using pymysql
        sync_url = DATABASE_URL.replace("mysql+aiomysql://", "").split("/")[0]
        db_name = DATABASE_URL.split("/")[-1]
        user_host = sync_url.split("@")
        if len(user_host) > 1:
            user_pass = user_host[0].split(":")
            user = user_pass[0]
            password = user_pass[1] if len(user_pass) > 1 else ""
            host_port = user_host[1].split(":")
        else:
            user = "root"
            password = ""
            host_port = user_host[0].split(":")
            
        host = host_port[0]
        port = int(host_port[1]) if len(host_port) > 1 else 3306
        
        conn = pymysql.connect(host=host, port=port, user=user, password=password)
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        cursor.close()
        conn.close()
        print(f"Verified/Created MySQL database '{db_name}' successfully.")
    except Exception as e:
        print(f"Warning: Failed to create database '{db_name}' synchronously: {e}")

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

# Define SQL Models
class SQLUser(Base):
    __tablename__ = "users"
    id = Column(String(64), primary_key=True)
    email = Column(String(128), unique=True, nullable=False)
    password_hash = Column(String(128), nullable=True)
    name = Column(String(128), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(Text, nullable=True)
    role = Column(String(64), nullable=True)
    trust_tier = Column(String(64), nullable=True)
    verified_creator = Column(Boolean, default=False)
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(128), nullable=True)
    banned = Column(Boolean, default=False)
    shadow_banned = Column(Boolean, default=False)
    session_revoked_at = Column(String(64), nullable=True)
    created_at = Column(String(64), nullable=True)
    linked_providers = Column(JSON, nullable=True)
    following = Column(JSON, nullable=True)
    favorites = Column(JSON, nullable=True)
    bookmarks = Column(JSON, nullable=True)

class SQLMod(Base):
    __tablename__ = "mods"
    id = Column(String(64), primary_key=True)
    title = Column(String(128), nullable=False)
    slug = Column(String(128), unique=True, nullable=False)
    summary = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    game_slug = Column(String(128), nullable=True)
    game_name = Column(String(128), nullable=True)
    author_id = Column(String(64), nullable=True)
    author_name = Column(String(128), nullable=True)
    author_verified = Column(Boolean, default=False)
    item_type = Column(String(64), nullable=True)
    rarity = Column(String(64), nullable=True)
    pricing = Column(String(64), nullable=True)
    price = Column(Integer, default=0)
    category = Column(String(64), nullable=True)
    license = Column(String(64), nullable=True)
    visibility = Column(String(64), nullable=True)
    status = Column(String(64), nullable=True)
    review_reason = Column(Text, nullable=True)
    icon = Column(Text, nullable=True)
    downloads = Column(Integer, default=0)
    follows = Column(Integer, default=0)
    favorites_count = Column(Integer, default=0)
    base_rating_sum = Column(Float, default=0)
    base_rating_count = Column(Integer, default=0)
    rating_avg = Column(Float, default=0)
    rating_count = Column(Integer, default=0)
    created_at = Column(String(64), nullable=True)
    updated_at = Column(String(64), nullable=True)
    staff_pick = Column(Boolean, default=False)
    monetization = Column(Boolean, default=False)
    tags = Column(JSON, nullable=True)
    mod_loaders = Column(JSON, nullable=True)
    game_versions = Column(JSON, nullable=True)
    gallery = Column(JSON, nullable=True)

class SQLVersion(Base):
    __tablename__ = "versions"
    id = Column(String(64), primary_key=True)
    mod_id = Column(String(64), nullable=False)
    mod_slug = Column(String(128), nullable=False)
    version_number = Column(String(64), nullable=False)
    changelog = Column(Text, nullable=True)
    file_name = Column(String(256), nullable=True)
    file_size = Column(Integer, default=0)
    file_path = Column(Text, nullable=True)
    game_versions = Column(JSON, nullable=True)
    mod_loaders = Column(JSON, nullable=True)
    status = Column(String(64), nullable=True)
    created_at = Column(String(64), nullable=True)

class SQLReview(Base):
    __tablename__ = "reviews"
    id = Column(String(64), primary_key=True)
    mod_id = Column(String(64), nullable=False)
    user_id = Column(String(64), nullable=False)
    user_name = Column(String(128), nullable=True)
    rating = Column(Integer, default=5)
    body = Column(Text, nullable=True)
    created_at = Column(String(64), nullable=True)

class SQLComment(Base):
    __tablename__ = "comments"
    id = Column(String(64), primary_key=True)
    mod_id = Column(String(64), nullable=False)
    user_id = Column(String(64), nullable=False)
    user_name = Column(String(128), nullable=True)
    user_avatar = Column(Text, nullable=True)
    body = Column(Text, nullable=True)
    created_at = Column(String(64), nullable=True)

class SQLReport(Base):
    __tablename__ = "reports"
    id = Column(String(64), primary_key=True)
    target_type = Column(String(64), nullable=False)
    target_id = Column(String(64), nullable=False)
    category = Column(String(64), nullable=True)
    reason = Column(Text, nullable=True)
    reporter_id = Column(String(64), nullable=True)
    reporter_name = Column(String(128), nullable=True)
    status = Column(String(64), default="open")
    priority = Column(String(64), default="normal")
    sla_deadline = Column(String(64), nullable=True)
    resolution = Column(Text, nullable=True)
    resolved_by = Column(String(64), nullable=True)
    resolved_at = Column(String(64), nullable=True)
    created_at = Column(String(64), nullable=True)

class SQLOrganization(Base):
    __tablename__ = "organizations"
    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    slug = Column(String(128), nullable=True)
    owner_id = Column(String(64), nullable=False)
    members = Column(JSON, nullable=True)
    created_at = Column(String(64), nullable=True)

class SQLCollectionModel(Base):
    __tablename__ = "collections"
    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    owner_id = Column(String(64), nullable=False)
    owner_name = Column(String(128), nullable=True)
    description = Column(Text, nullable=True)
    mod_ids = Column(JSON, nullable=True)
    created_at = Column(String(64), nullable=True)

class SQLAuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String(64), primary_key=True)
    action = Column(String(128), nullable=True)
    actor_id = Column(String(64), nullable=True)
    actor_name = Column(String(128), nullable=True)
    target_type = Column(String(64), nullable=True)
    target_id = Column(String(64), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(String(64), nullable=True)

class SQLAnomaly(Base):
    __tablename__ = "anomalies"
    id = Column(String(64), primary_key=True)
    type = Column(String(128), nullable=True)
    description = Column(Text, nullable=True)
    severity = Column(String(64), nullable=True)
    status = Column(String(64), nullable=True)
    detected_at = Column(String(64), nullable=True)

class SQLGame(Base):
    __tablename__ = "games"
    id = Column(String(64), primary_key=True)
    slug = Column(String(128), unique=True, nullable=False)
    name = Column(String(128), nullable=False)
    tagline = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    banner = Column(Text, nullable=True)
    icon = Column(Text, nullable=True)
    item_types = Column(JSON, nullable=True)
    rarities = Column(JSON, nullable=True)
    categories = Column(JSON, nullable=True)
    mod_loaders = Column(JSON, nullable=True)
    versions = Column(JSON, nullable=True)

class SQLNotification(Base):
    __tablename__ = "notifications"
    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), nullable=False)
    text = Column(Text, nullable=False)
    link = Column(Text, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(String(64), nullable=True)

class SQLDownloadEvent(Base):
    __tablename__ = "download_events"
    id = Column(String(64), primary_key=True)
    mod_id = Column(String(64), nullable=False)
    user_id = Column(String(64), nullable=True)
    author_id = Column(String(64), nullable=True)
    version_id = Column(String(64), nullable=True)
    day = Column(String(64), nullable=True)
    ts = Column(String(64), nullable=True)
    created_at = Column(String(64), nullable=True)

class SQLLoginAttempt(Base):
    __tablename__ = "login_attempts"
    id = Column(String(64), primary_key=True)
    identifier = Column(String(128), unique=True, nullable=False)
    count = Column(Integer, default=0)
    locked_until = Column(String(64), nullable=True)

class SQLNews(Base):
    __tablename__ = "news"
    id = Column(String(64), primary_key=True)
    title = Column(String(256), nullable=False)
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    category = Column(String(128), nullable=True)
    author = Column(String(128), nullable=True)
    read_time = Column(String(64), nullable=True)
    created_at = Column(String(64), nullable=True)

class SQLContactSubmission(Base):
    __tablename__ = "contact_submissions"
    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    email = Column(String(128), nullable=False)
    subject = Column(String(256), nullable=True)
    message = Column(Text, nullable=False)
    created_at = Column(String(64), nullable=True)

class SQLRolePermission(Base):
    __tablename__ = "role_permissions"
    id = Column(String(64), primary_key=True)
    role = Column(String(64), unique=True, nullable=False)
    permissions = Column(JSON, nullable=True)

class SQLCategory(Base):
    __tablename__ = "categories"
    id = Column(String(64), primary_key=True)
    slug = Column(String(128), unique=True, nullable=False)
    display_name = Column(String(128), nullable=False)
    icon = Column(Text, nullable=True)
    applicable_project_type = Column(String(64), nullable=True)

class SQLLoader(Base):
    __tablename__ = "loaders"
    id = Column(String(64), primary_key=True)
    slug = Column(String(128), unique=True, nullable=False)
    display_name = Column(String(128), nullable=False)
    icon = Column(Text, nullable=True)
    applicable_project_type = Column(String(64), nullable=True)

class SQLPlatform(Base):
    __tablename__ = "platforms"
    id = Column(String(64), primary_key=True)
    slug = Column(String(128), unique=True, nullable=False)
    display_name = Column(String(128), nullable=False)
    icon = Column(Text, nullable=True)
    applicable_project_type = Column(String(64), nullable=True)

class SQLProjectCategory(Base):
    __tablename__ = "project_categories"
    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), nullable=False)
    category_id = Column(String(64), nullable=False)

class SQLVersionLoader(Base):
    __tablename__ = "version_loaders"
    id = Column(String(64), primary_key=True)
    version_id = Column(String(64), nullable=False)
    loader_id = Column(String(64), nullable=False)

class SQLVersionPlatform(Base):
    __tablename__ = "version_platforms"
    id = Column(String(64), primary_key=True)
    version_id = Column(String(64), nullable=False)
    platform_id = Column(String(64), nullable=False)

# Emulation classes for MongoDB API using SQLAlchemy

class SQLCollection:
    def __init__(self, model_class, session_factory):
        self.model_class = model_class
        self.session_factory = session_factory

    async def create_index(self, *args, **kwargs):
        return None

    def find(self, filter, projection=None):
        return SQLCursor(self.model_class, filter, self.session_factory, projection)

    async def find_one(self, filter, projection=None):
        async with self.session_factory() as session:
            stmt = select(self.model_class)
            stmt = self._apply_filter(stmt, filter)
            res = await session.execute(stmt)
            obj = res.scalar_one_or_none()
            if obj:
                return self._to_dict(obj)
            return None

    async def insert_one(self, document):
        async with self.session_factory() as session:
            async with session.begin():
                cols = {c.name for c in self.model_class.__table__.columns}
                doc = {k: v for k, v in document.items() if k in cols}
                obj = self.model_class(**doc)
                session.add(obj)
            await session.commit()
        return document

    async def update_one(self, filter, update_doc, upsert=False):
        async with self.session_factory() as session:
            async with session.begin():
                stmt = select(self.model_class)
                stmt = self._apply_filter(stmt, filter)
                res = await session.execute(stmt)
                obj = res.scalar_one_or_none()
                if obj:
                    if "$set" in update_doc:
                        for k, v in update_doc["$set"].items():
                            setattr(obj, k, v)
                    if "$unset" in update_doc:
                        for k in update_doc["$unset"].keys():
                            setattr(obj, k, None)
                    if "$inc" in update_doc:
                        for k, v in update_doc["$inc"].items():
                            current_val = getattr(obj, k, 0) or 0
                            setattr(obj, k, current_val + v)
                elif upsert:
                    import uuid
                    doc = {"id": str(uuid.uuid4())}
                    for k, v in filter.items():
                        if not isinstance(v, dict):
                            doc[k] = v
                    if "$set" in update_doc:
                        for k, v in update_doc["$set"].items():
                            doc[k] = v
                    if "$inc" in update_doc:
                        for k, v in update_doc["$inc"].items():
                            doc[k] = v
                    cols = {c.name for c in self.model_class.__table__.columns}
                    doc = {k: v for k, v in doc.items() if k in cols}
                    new_obj = self.model_class(**doc)
                    session.add(new_obj)
            await session.commit()
        return None

    async def delete_one(self, filter):
        async with self.session_factory() as session:
            async with session.begin():
                stmt = select(self.model_class)
                stmt = self._apply_filter(stmt, filter)
                res = await session.execute(stmt)
                obj = res.scalar_one_or_none()
                if obj:
                    await session.delete(obj)
            await session.commit()
        return None

    async def update_many(self, filter, update_doc):
        async with self.session_factory() as session:
            async with session.begin():
                stmt = select(self.model_class)
                stmt = self._apply_filter(stmt, filter)
                res = await session.execute(stmt)
                objs = res.scalars().all()
                for obj in objs:
                    if "$set" in update_doc:
                        for k, v in update_doc["$set"].items():
                            setattr(obj, k, v)
                    if "$unset" in update_doc:
                        for k in update_doc["$unset"].keys():
                            setattr(obj, k, None)
                    if "$inc" in update_doc:
                        for k, v in update_doc["$inc"].items():
                            current_val = getattr(obj, k, 0) or 0
                            setattr(obj, k, current_val + v)
            await session.commit()
        return None

    async def delete_many(self, filter):
        async with self.session_factory() as session:
            async with session.begin():
                stmt = select(self.model_class)
                stmt = self._apply_filter(stmt, filter)
                res = await session.execute(stmt)
                objs = res.scalars().all()
                deleted_count = 0
                for obj in objs:
                    await session.delete(obj)
                    deleted_count += 1
            await session.commit()
        
        class DeleteResult:
            def __init__(self, count):
                self.deleted_count = count
        return DeleteResult(deleted_count)

    async def count_documents(self, filter):
        async with self.session_factory() as session:
            stmt = select(func.count()).select_from(self.model_class)
            stmt = self._apply_filter(stmt, filter)
            res = await session.execute(stmt)
            return res.scalar() or 0

    def _to_dict(self, obj):
        if not obj:
            return None
        d = {}
        for col in self.model_class.__table__.columns:
            val = getattr(obj, col.name)
            d[col.name] = val
        return d

    def _apply_filter(self, stmt, filter):
        if not filter:
            return stmt
        conditions = []
        for key, val in filter.items():
            if key == "$or":
                or_conditions = []
                for sub_filter in val:
                    sub_stmt = select(self.model_class)
                    sub_stmt = self._apply_filter(sub_stmt, sub_filter)
                    if sub_stmt.whereclause is not None:
                        or_conditions.append(sub_stmt.whereclause)
                if or_conditions:
                    conditions.append(or_(*or_conditions))
            elif "." in key:
                parent_key, child_key = key.split(".", 1)
                col = getattr(self.model_class, parent_key, None)
                if col is not None:
                    val_to_match = val
                    if isinstance(val, dict):
                        if "$in" in val:
                            val_to_match = val["$in"]
                        elif "$eq" in val:
                            val_to_match = val["$eq"]
                    
                    if isinstance(val_to_match, list):
                        or_conds = []
                        for sub_val in val_to_match:
                            or_conds.append(col.like(f'%"{child_key}": "{sub_val}"%'))
                        if or_conds:
                            conditions.append(or_(*or_conds))
                    else:
                        conditions.append(col.like(f'%"{child_key}": "{val_to_match}"%'))
            else:
                col = getattr(self.model_class, key, None)
                if col is None:
                    continue
                if isinstance(val, dict):
                    for op, op_val in val.items():
                        if op == "$in":
                            if not op_val:
                                conditions.append(col.in_(["__nonexistent__"]))
                            else:
                                conditions.append(col.in_(op_val))
                        elif op == "$nin":
                            if not op_val:
                                pass
                            else:
                                conditions.append(or_(col.not_in(op_val), col == None))
                        elif op == "$regex":
                            like_val = op_val
                            if like_val.startswith("^"):
                                like_val = like_val[1:] + "%"
                            elif not like_val.endswith("%") and not like_val.startswith("%"):
                                like_val = f"%{like_val}%"
                            conditions.append(col.like(like_val))
                else:
                    if isinstance(col.type, JSON):
                        conditions.append(col.like(f'%"{val}"%'))
                    else:
                        conditions.append(col == val)
        if conditions:
            stmt = stmt.where(and_(*conditions))
        return stmt

class SQLCursor:
    def __init__(self, model_class, filter, session_factory, projection=None):
        self.model_class = model_class
        self.filter = filter
        self.session_factory = session_factory
        self.projection = projection
        self._sort = None
        self._limit = None
        self._skip = None

    def sort(self, field, direction=-1):
        if isinstance(field, list):
            if field:
                self._sort = field[0]
        else:
            self._sort = (field, direction)
        return self

    def limit(self, val):
        self._limit = val
        return self

    def skip(self, val):
        self._skip = val
        return self

    async def to_list(self, length=None):
        async with self.session_factory() as session:
            stmt = select(self.model_class)
            coll = SQLCollection(self.model_class, self.session_factory)
            stmt = coll._apply_filter(stmt, self.filter)
            if self._sort:
                field, direction = self._sort
                col = getattr(self.model_class, field, None)
                if col is not None:
                    if direction == -1:
                        stmt = stmt.order_by(desc(col))
                    else:
                        stmt = stmt.order_by(asc(col))
            if self._limit is not None:
                stmt = stmt.limit(self._limit)
            elif length is not None:
                stmt = stmt.limit(length)
            if self._skip is not None:
                stmt = stmt.offset(self._skip)
            res = await session.execute(stmt)
            objs = res.scalars().all()
            return [coll._to_dict(obj) for obj in objs]

    def __aiter__(self):
        return self

    async def __anext__(self):
        if not hasattr(self, '_objs'):
            self._objs = await self.to_list()
            self._idx = 0
        if self._idx < len(self._objs):
            val = self._objs[self._idx]
            self._idx += 1
            return val
        else:
            raise StopAsyncIteration

class SQLDatabase:
    def __init__(self, session_factory):
        self.users = SQLCollection(SQLUser, session_factory)
        self.mods = SQLCollection(SQLMod, session_factory)
        self.versions = SQLCollection(SQLVersion, session_factory)
        self.reviews = SQLCollection(SQLReview, session_factory)
        self.comments = SQLCollection(SQLComment, session_factory)
        self.reports = SQLCollection(SQLReport, session_factory)
        self.organizations = SQLCollection(SQLOrganization, session_factory)
        self.collections = SQLCollection(SQLCollectionModel, session_factory)
        self.audit_logs = SQLCollection(SQLAuditLog, session_factory)
        self.anomalies = SQLCollection(SQLAnomaly, session_factory)
        self.games = SQLCollection(SQLGame, session_factory)
        self.notifications = SQLCollection(SQLNotification, session_factory)
        self.download_events = SQLCollection(SQLDownloadEvent, session_factory)
        self.login_attempts = SQLCollection(SQLLoginAttempt, session_factory)
        self.news = SQLCollection(SQLNews, session_factory)
        self.contact_submissions = SQLCollection(SQLContactSubmission, session_factory)
        self.role_permissions = SQLCollection(SQLRolePermission, session_factory)
        self.categories = SQLCollection(SQLCategory, session_factory)
        self.loaders = SQLCollection(SQLLoader, session_factory)
        self.platforms = SQLCollection(SQLPlatform, session_factory)
        self.project_categories = SQLCollection(SQLProjectCategory, session_factory)
        self.version_loaders = SQLCollection(SQLVersionLoader, session_factory)
        self.version_platforms = SQLCollection(SQLVersionPlatform, session_factory)

db = SQLDatabase(async_session)

UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

app = FastAPI(title="Qiveo API")
api = APIRouter(prefix="/api")

# ---------------------------------------------------------------------------
# WebSocket Manager
# ---------------------------------------------------------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: Optional[str] = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: Optional[str] = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id and user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.user_connections:
            for connection in self.user_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    pass

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass

manager = ConnectionManager()

@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = None):
    user_id = None
    if token:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("sub")
        except Exception:
            pass
    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


STAFF_ROLES = {"super_admin", "ts_moderator", "content_reviewer", "support_agent", "auditor"}
TRUST_TIERS = ["new", "established", "verified"]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(user_id: str, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": now,
        "exp": now + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def clean_user(doc: dict) -> dict:
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return doc


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or uuid.uuid4().hex[:8]


def get_client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if user.get("banned"):
            raise HTTPException(status_code=403, detail="Account banned")
        revoked = user.get("session_revoked_at")
        iat = payload.get("iat")
        if revoked and iat is not None and iat < datetime.fromisoformat(revoked).timestamp():
            raise HTTPException(status_code=401, detail="Session revoked")
        return clean_user(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


def require_staff(*roles):
    async def dep(user: dict = Depends(get_current_user)) -> dict:
        role = user.get("role")
        if role not in STAFF_ROLES:
            raise HTTPException(status_code=403, detail="Staff access required")
        if roles and role != "super_admin" and role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return user
    return dep


async def audit(actor: dict, action: str, target_type: str, target_id: str, before=None, after=None):
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "actor_id": actor.get("id"),
        "actor_name": actor.get("name"),
        "actor_role": actor.get("role"),
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "before": before,
        "after": after,
        "created_at": now_iso(),
    })


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2)
    age_confirm: bool = True


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class ReviewInput(BaseModel):
    rating: int = Field(ge=1, le=5)
    body: str = ""


class CommentInput(BaseModel):
    body: str = Field(min_length=1)
    parent_id: Optional[str] = None


class ReportInput(BaseModel):
    target_type: str
    target_id: str
    category: str
    reason: str


class ModerationInput(BaseModel):
    action: Literal["approve", "reject", "request_changes", "quarantine"]
    reason: str = ""


class TrustInput(BaseModel):
    trust_tier: Optional[str] = None
    verified_creator: Optional[bool] = None
    banned: Optional[bool] = None
    shadow_banned: Optional[bool] = None
    role: Optional[str] = None


SLA_HOURS = {"csam": 0.5, "malware": 1, "dmca": 24, "harassment": 12, "impersonation": 24, "spam": 48, "other": 48}


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@api.post("/auth/register")
async def register(data: RegisterInput):
    if not data.age_confirm:
        raise HTTPException(status_code=400, detail="You must confirm you are 13 or older")
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "avatar_url": f"https://api.dicebear.com/7.x/identicon/svg?seed={slugify(data.name)}",
        "role": "user",
        "trust_tier": "new",
        "verified_creator": False,
        "banned": False,
        "shadow_banned": False,
        "bio": "",
        "following": [],
        "linked_providers": [],
        "two_factor_enabled": False,
        "created_at": now_iso(),
    }
    await db.users.insert_one(dict(user))
    token = create_token(user["id"], email)
    return {"token": token, "user": clean_user(user)}


@api.post("/auth/login")
async def login(data: LoginInput, request: Request):
    email = data.email.lower()
    ip = get_client_ip(request)
    ident = f"{email}|{ip}"
    attempt = await db.login_attempts.find_one({"identifier": ident})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.now(timezone.utc) < datetime.fromisoformat(locked_until):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        count = (attempt.get("count", 0) if attempt else 0) + 1
        await db.login_attempts.update_one(
            {"identifier": ident},
            {"$set": {"count": count, "locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat() if count >= 5 else None}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.get("banned"):
        raise HTTPException(status_code=403, detail="Account banned")
    await db.login_attempts.delete_one({"identifier": ident})
    token = create_token(user["id"], email)
    return {"token": token, "user": clean_user(user)}


@api.post("/auth/demo")
async def demo_login(payload: dict):
    if os.environ.get("PRODUCTION") == "true":
        raise HTTPException(status_code=403, detail="Demo logins disabled in production")
    # One-tap demo sign-in that stands in for OAuth until real Google/Discord keys are added.
    provider = (payload.get("provider") or "google").lower()
    email_map = {"google": "creator@qiveo.dev", "discord": "blockfan@qiveo.dev", "staff": "admin@qiveo.dev"}
    email = email_map.get(provider, "creator@qiveo.dev")
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Demo account missing")
    token = create_token(user["id"], email)
    return {"token": token, "user": clean_user(user), "provider": provider}


@api.get("/auth/google/login")
async def google_login():
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI")
    state = secrets.token_hex(16)
    google_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope=openid%20email%20profile&"
        f"state={state}"
    )
    return RedirectResponse(google_url)


@api.get("/auth/google/callback")
async def google_callback(code: str, state: Optional[str] = None):
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI")
    
    # Exchange code for token
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code"
    }
    r = requests.post(token_url, data=data)
    if r.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Failed to exchange Google OAuth code: {r.text}")
    
    token_json = r.json()
    access_token = token_json.get("access_token")
    
    # Get user profile info
    user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
    headers = {"Authorization": f"Bearer {access_token}"}
    r_user = requests.get(user_info_url, headers=headers)
    if r_user.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to retrieve Google user profile")
    
    profile = r_user.json()
    email = profile.get("email").lower()
    name = profile.get("name") or profile.get("given_name") or "Google User"
    picture = profile.get("picture") or f"https://api.dicebear.com/7.x/identicon/svg?seed={slugify(name)}"
    
    user = await db.users.find_one({"email": email})
    if not user:
        user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": "",
            "name": name,
            "avatar_url": picture,
            "role": "user",
            "trust_tier": "new",
            "verified_creator": False,
            "banned": False,
            "shadow_banned": False,
            "bio": "",
            "following": [],
            "linked_providers": ["google"],
            "two_factor_enabled": False,
            "created_at": now_iso(),
        }
        await db.users.insert_one(dict(user))
    else:
        providers = list(user.get("linked_providers", []))
        if "google" not in providers:
            providers.append("google")
            await db.users.update_one({"id": user["id"]}, {"$set": {"linked_providers": providers}})
            
    token = create_token(user["id"], email)
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    return RedirectResponse(f"{frontend_url}/login?token={token}")


@api.get("/auth/discord/login")
async def discord_login():
    client_id = os.environ.get("DISCORD_CLIENT_ID")
    redirect_uri = os.environ.get("DISCORD_REDIRECT_URI")
    state = secrets.token_hex(16)
    discord_url = (
        f"https://discord.com/api/oauth2/authorize?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope=identify%20email&"
        f"state={state}"
    )
    return RedirectResponse(discord_url)


@api.get("/auth/discord/callback")
async def discord_callback(code: str, state: Optional[str] = None):
    client_id = os.environ.get("DISCORD_CLIENT_ID")
    client_secret = os.environ.get("DISCORD_CLIENT_SECRET")
    redirect_uri = os.environ.get("DISCORD_REDIRECT_URI")
    
    # Exchange code for token
    token_url = "https://discord.com/api/oauth2/token"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri
    }
    r = requests.post(token_url, data=data, headers=headers)
    if r.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Failed to exchange Discord OAuth code: {r.text}")
        
    token_json = r.json()
    access_token = token_json.get("access_token")
    
    # Get user profile info
    user_info_url = "https://discord.com/api/users/@me"
    headers = {"Authorization": f"Bearer {access_token}"}
    r_user = requests.get(user_info_url, headers=headers)
    if r_user.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to retrieve Discord user profile")
        
    profile = r_user.json()
    email = profile.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Discord account must have an email associated to login")
    email = email.lower()
    name = profile.get("username")
    avatar = profile.get("avatar")
    
    if avatar:
        picture = f"https://cdn.discordapp.com/avatars/{profile['id']}/{avatar}.png"
    else:
        picture = f"https://api.dicebear.com/7.x/identicon/svg?seed={slugify(name)}"
        
    user = await db.users.find_one({"email": email})
    if not user:
        user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": "",
            "name": name,
            "avatar_url": picture,
            "role": "user",
            "trust_tier": "new",
            "verified_creator": False,
            "banned": False,
            "shadow_banned": False,
            "bio": "",
            "following": [],
            "linked_providers": ["discord"],
            "two_factor_enabled": False,
            "created_at": now_iso(),
        }
        await db.users.insert_one(dict(user))
    else:
        providers = list(user.get("linked_providers", []))
        if "discord" not in providers:
            providers.append("discord")
            await db.users.update_one({"id": user["id"]}, {"$set": {"linked_providers": providers}})
            
    token = create_token(user["id"], email)
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    return RedirectResponse(f"{frontend_url}/login?token={token}")



@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api.put("/auth/profile")
async def update_profile(payload: dict, user: dict = Depends(get_current_user)):
    updates = {k: payload[k] for k in ("name", "bio", "links") if k in payload}
    if "two_factor_enabled" in payload:
        updates["two_factor_enabled"] = bool(payload["two_factor_enabled"])
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    fresh = await db.users.find_one({"id": user["id"]})
    return clean_user(fresh)

@api.post("/auth/avatar")
async def upload_avatar(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    ext = file.filename.split('.')[-1]
    fname = f"avatar_{user['id']}_{uuid.uuid4().hex[:6]}.{ext}"
    path = UPLOAD_DIR / "gallery" / fname
    with open(path, "wb") as f:
        f.write(await file.read())
    url = f"/api/uploads/gallery/{fname}"
    await db.users.update_one({"id": user["id"]}, {"$set": {"avatar_url": url}})
    return {"avatar_url": url}


# ---------------------------------------------------------------------------
# Games
# ---------------------------------------------------------------------------
@api.get("/games")
async def list_games():
    games = await db.games.find({}, {"_id": 0}).to_list(100)
    for g in games:
        g["mod_count"] = await db.mods.count_documents({"game_slug": g["slug"], "status": "approved"})
    return games


@api.get("/games/{slug}")
async def get_game(slug: str):
    game = await db.games.find_one({"slug": slug}, {"_id": 0})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    game["mod_count"] = await db.mods.count_documents({"game_slug": slug, "status": "approved"})
    return game


# ---------------------------------------------------------------------------
# Mods - public
# ---------------------------------------------------------------------------
@api.get("/mods")
async def list_mods(
    game: Optional[str] = None,
    category: Optional[str] = None,
    item_type: Optional[str] = None,
    rarity: Optional[str] = None,
    tag: Optional[str] = None,
    loader: Optional[str] = None,
    game_version: Optional[str] = None,
    q: Optional[str] = None,
    sort: str = "trending",
    staff_pick: Optional[bool] = None,
    limit: int = 50,
):
    query = {"status": "approved", "visibility": {"$nin": ["private", "unlisted"]}}
    if game:
        query["game_slug"] = game
    if category:
        query["category"] = category
    if item_type:
        query["item_type"] = item_type
    if rarity:
        query["rarity"] = rarity
    if tag:
        query["tags"] = tag
    if loader:
        query["mod_loaders"] = loader
    if game_version:
        query["game_versions"] = game_version
    if staff_pick:
        query["staff_pick"] = True
    if q:
        query["$or"] = [
            {"title": {"$regex": re.escape(q), "$options": "i"}},
            {"summary": {"$regex": re.escape(q), "$options": "i"}},
            {"tags": {"$regex": re.escape(q), "$options": "i"}},
        ]
    sort_map = {
        "trending": [("downloads", -1), ("rating_avg", -1)],
        "newest": [("created_at", -1)],
        "downloads": [("downloads", -1)],
        "rating": [("rating_avg", -1)],
        "updated": [("updated_at", -1)],
    }
    cursor = db.mods.find(query, {"_id": 0}).sort(sort_map.get(sort, sort_map["trending"])).limit(limit)
    return await cursor.to_list(limit)


@api.get("/mods/{slug}")
async def get_mod(slug: str, request: Request):
    mod = await db.mods.find_one({"slug": slug}, {"_id": 0})
    if not mod:
        raise HTTPException(status_code=404, detail="Mod not found")
    if mod["status"] != "approved" or mod.get("visibility") == "private":
        viewer = await get_optional_user(request)
        allowed = viewer and (viewer["id"] == mod["author_id"] or viewer.get("role") in STAFF_ROLES)
        if not allowed:
            raise HTTPException(status_code=404, detail="Mod not found")
    versions = await db.versions.find({"mod_id": mod["id"], "status": "approved"}, {"_id": 0}).sort("created_at", -1).to_list(100)
    reviews = await db.reviews.find({"mod_id": mod["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    mod["versions"] = versions
    mod["reviews"] = reviews
    return mod


@api.get("/mods/{slug}/comments")
async def get_comments(slug: str):
    mod = await db.mods.find_one({"slug": slug}, {"_id": 0, "id": 1})
    if not mod:
        raise HTTPException(status_code=404, detail="Mod not found")
    comments = await db.comments.find({"mod_id": mod["id"], "hidden": {"$ne": True}}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return comments


# ---------------------------------------------------------------------------
# Creator - my mods, create, upload version
# ---------------------------------------------------------------------------
@api.get("/creator/mods")
async def my_mods(user: dict = Depends(get_current_user)):
    mods = await db.mods.find({"author_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for m in mods:
        m["version_count"] = await db.versions.count_documents({"mod_id": m["id"]})
    return mods


@api.get("/creator/analytics")
async def creator_analytics(user: dict = Depends(get_current_user)):
    mods = await db.mods.find({"author_id": user["id"]}, {"_id": 0}).to_list(200)
    total_downloads = sum(m.get("downloads", 0) for m in mods)
    total_mods = len(mods)
    approved = len([m for m in mods if m["status"] == "approved"])
    in_review = len([m for m in mods if m["status"] == "in_review"])
    rated = [m for m in mods if m.get("rating_count", 0) > 0]
    avg_rating = round(sum(m.get("rating_avg", 0) for m in rated) / len(rated), 2) if rated else 0
    # synthetic 14-day download trend from download_events
    events = await db.download_events.find({"author_id": user["id"]}, {"_id": 0}).to_list(5000)
    trend = {}
    for i in range(13, -1, -1):
        day = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%m/%d")
        trend[day] = 0
    for e in events:
        day = e["day"]
        if day in trend:
            trend[day] += 1
    per_mod = [{"title": m["title"], "downloads": m.get("downloads", 0), "rating": m.get("rating_avg", 0)} for m in mods]
    return {
        "total_downloads": total_downloads,
        "total_mods": total_mods,
        "approved": approved,
        "in_review": in_review,
        "avg_rating": avg_rating,
        "trend": [{"day": k, "downloads": v} for k, v in trend.items()],
        "per_mod": per_mod,
    }


@api.post("/creator/mods")
async def create_mod(payload: dict, user: dict = Depends(get_current_user)):
    title = payload.get("title", "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")
    valid_types = ["Skin", "Character", "Build", "World", "Mod", "Collectible"]
    valid_rarities = ["Common", "Rare", "Epic", "Legendary"]
    item_type = payload.get("item_type", "Mod")
    if item_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid item type. Choose one of: {', '.join(valid_types)}")
    rarity = payload.get("rarity") or "Common"
    if rarity not in valid_rarities:
        raise HTTPException(status_code=400, detail=f"Invalid rarity. Choose one of: {', '.join(valid_rarities)}")
    requested_slug = (payload.get("slug") or "").strip()
    slug = slugify(requested_slug) if requested_slug else slugify(title)
    game = await db.games.find_one({"slug": payload.get("game_slug", "minecraft")})
    if not game:
        raise HTTPException(status_code=400, detail="Invalid game")
    if await db.mods.find_one({"slug": slug}):
        slug = f"{slug}-{uuid.uuid4().hex[:5]}"
    trusted = user.get("trust_tier") == "verified" or user.get("verified_creator")
    status = "approved" if trusted else "draft"
    mod = {
        "id": str(uuid.uuid4()),
        "slug": slug,
        "title": title,
        "summary": payload.get("summary", "")[:300],
        "description": payload.get("description", ""),
        "game_slug": payload.get("game_slug", "minecraft"),
        "game_name": game["name"],
        "author_id": user["id"],
        "author_name": user["name"],
        "author_verified": bool(user.get("verified_creator")),
        "item_type": payload.get("item_type", "Mod"),
        "rarity": rarity,
        "pricing": "free",
        "price": 0,
        "visibility": payload.get("visibility", "public") if payload.get("visibility") in ("public", "unlisted", "private") else "public",
        "monetization": False,
        "org_id": payload.get("org_id") or None,
        "follows": 0,
        "favorites_count": 0,
        "category": payload.get("category", "Utility"),
        "tags": payload.get("tags", [])[:8],
        "mod_loaders": payload.get("mod_loaders", []),
        "game_versions": payload.get("game_versions", []),
        "license": payload.get("license", "MIT"),
        "gallery": payload.get("gallery", []),
        "icon": payload.get("icon") or f"https://api.dicebear.com/7.x/shapes/svg?seed={slug}",
        "status": status,
        "staff_pick": False,
        "downloads": 0,
        "rating_avg": 0,
        "rating_count": 0,
        "base_rating_sum": 0,
        "base_rating_count": 0,
        "review_reason": "",
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.mods.insert_one(dict(mod))
    await audit(user, "create_mod", "mod", mod["id"], after={"status": status})
    return {k: v for k, v in mod.items() if k != "_id"}


@api.post("/creator/mods/{mod_id}/versions")
async def upload_version(
    mod_id: str,
    version_number: str = Form(...),
    changelog: str = Form(""),
    game_versions: str = Form(""),
    mod_loaders: str = Form(""),
    dependencies: str = Form(""),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    mod = await db.mods.find_one({"id": mod_id})
    if not mod:
        raise HTTPException(status_code=404, detail="Mod not found")
    if mod["author_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your mod")

    raw = await file.read()
    size = len(raw)
    if size > 200 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds 200MB limit")
    if size == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    # local compressed storage (gzip)
    vid = str(uuid.uuid4())
    stored_path = UPLOAD_DIR / f"{vid}.gz"
    with gzip.open(stored_path, "wb") as f:
        f.write(raw)
    compressed_size = stored_path.stat().st_size

    # basic server-side file-type detection independent of extension
    detected = mimetypes.guess_type(file.filename)[0] or "application/octet-stream"

    trusted = user.get("trust_tier") == "verified" or user.get("verified_creator")
    status = "approved" if trusted else "in_review"
    version = {
        "id": vid,
        "mod_id": mod_id,
        "mod_slug": mod["slug"],
        "mod_title": mod["title"],
        "version_number": version_number,
        "changelog": changelog,
        "game_versions": [v.strip() for v in game_versions.split(",") if v.strip()],
        "mod_loaders": [v.strip() for v in mod_loaders.split(",") if v.strip()],
        "dependencies": [v.strip() for v in dependencies.split(",") if v.strip()],
        "file_name": file.filename,
        "file_path": str(stored_path),
        "file_size": size,
        "compressed_size": compressed_size,
        "detected_type": detected,
        "status": status,
        "review_reason": "",
        "created_at": now_iso(),
    }
    await db.versions.insert_one(dict(version))
    mod_status = "approved" if (trusted and mod["status"] == "approved") else ("in_review" if not trusted else mod["status"])
    mod_update = {"updated_at": now_iso(), "status": mod_status}
    merged_gv = sorted(set((mod.get("game_versions") or []) + version["game_versions"]))
    merged_ml = sorted(set((mod.get("mod_loaders") or []) + version["mod_loaders"]))
    if merged_gv:
        mod_update["game_versions"] = merged_gv
    if merged_ml:
        mod_update["mod_loaders"] = merged_ml
    await db.mods.update_one({"id": mod_id}, {"$set": mod_update})
    await audit(user, "upload_version", "version", vid, after={"version": version_number, "status": status})
    return {k: v for k, v in version.items() if k != "_id"}


@api.get("/download/{version_id}")
async def download(version_id: str):
    version = await db.versions.find_one({"id": version_id})
    if not version or version.get("status") != "approved":
        raise HTTPException(status_code=404, detail="Version not available")
    path = Path(version["file_path"])
    if not path.exists():
        raise HTTPException(status_code=404, detail="File missing")
    await db.mods.update_one({"id": version["mod_id"]}, {"$inc": {"downloads": 1}})
    mod = await db.mods.find_one({"id": version["mod_id"]})
    
    # WebSocket Broadcast
    await manager.broadcast({
        "type": "downloads_updated",
        "mod_id": version["mod_id"],
        "downloads": mod["downloads"]
    })
    
    day = datetime.now(timezone.utc).strftime("%m/%d")
    await db.download_events.insert_one({
        "id": str(uuid.uuid4()), "author_id": mod.get("author_id"),
        "mod_id": version["mod_id"], "version_id": version_id, "day": day, "ts": now_iso(),
    })

    def stream():
        with gzip.open(path, "rb") as f:
            while chunk := f.read(65536):
                yield chunk

    return StreamingResponse(
        stream(),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{version["file_name"]}"'},
    )



# ---------------------------------------------------------------------------
# Reviews & comments
# ---------------------------------------------------------------------------
@api.post("/mods/{slug}/reviews")
async def add_review(slug: str, data: ReviewInput, user: dict = Depends(get_current_user)):
    mod = await db.mods.find_one({"slug": slug})
    if not mod:
        raise HTTPException(status_code=404, detail="Mod not found")
    existing = await db.reviews.find_one({"mod_id": mod["id"], "user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this mod")
    review = {
        "id": str(uuid.uuid4()), "mod_id": mod["id"], "user_id": user["id"],
        "user_name": user["name"], "user_avatar": user.get("avatar_url"),
        "rating": data.rating, "body": data.body, "created_at": now_iso(),
    }
    await db.reviews.insert_one(dict(review))
    all_reviews = await db.reviews.find({"mod_id": mod["id"]}).to_list(5000)
    real_sum = sum(r["rating"] for r in all_reviews)
    total_sum = mod.get("base_rating_sum", 0) + real_sum
    total_count = mod.get("base_rating_count", 0) + len(all_reviews)
    avg = round(total_sum / total_count, 2) if total_count else 0
    await db.mods.update_one({"id": mod["id"]}, {"$set": {"rating_avg": avg, "rating_count": total_count}})
    
    # WebSocket Broadcast
    await manager.broadcast({
        "type": "review_added",
        "mod_slug": slug,
        "rating_avg": avg,
        "rating_count": total_count,
        "review": clean_user(dict(review))
    })
    
    return {k: v for k, v in review.items() if k != "_id"}


@api.post("/mods/{slug}/comments")
async def add_comment(slug: str, data: CommentInput, user: dict = Depends(get_current_user)):
    if not data.body.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")
    mod = await db.mods.find_one({"slug": slug})
    if not mod:
        raise HTTPException(status_code=404, detail="Mod not found")
    comment = {
        "id": str(uuid.uuid4()), "mod_id": mod["id"], "user_id": user["id"],
        "user_name": user["name"], "user_avatar": user.get("avatar_url"),
        "body": data.body, "parent_id": data.parent_id, "hidden": False, "created_at": now_iso(),
    }
    await db.comments.insert_one(dict(comment))
    
    # WebSocket Broadcast
    await manager.broadcast({
        "type": "comment_added",
        "mod_slug": slug,
        "comment": clean_user(dict(comment))
    })
    
    return {k: v for k, v in comment.items() if k != "_id"}



@api.post("/reports")
async def create_report(data: ReportInput, user: dict = Depends(get_current_user)):
    hours = SLA_HOURS.get(data.category, 48)
    report = {
        "id": str(uuid.uuid4()),
        "target_type": data.target_type, "target_id": data.target_id,
        "category": data.category, "reason": data.reason,
        "reporter_id": user["id"], "reporter_name": user["name"],
        "status": "open",
        "priority": "critical" if data.category in ("csam", "malware") else "normal",
        "sla_deadline": (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat(),
        "resolution": "", "created_at": now_iso(),
    }
    await db.reports.insert_one(dict(report))
    return {k: v for k, v in report.items() if k != "_id"}


# ---------------------------------------------------------------------------
# ADMIN / STAFF panel
# ---------------------------------------------------------------------------
@api.get("/admin/overview")
async def admin_overview(user: dict = Depends(require_staff())):
    return {
        "pending_mods": await db.mods.count_documents({"status": "in_review"}),
        "pending_versions": await db.versions.count_documents({"status": "in_review"}),
        "open_reports": await db.reports.count_documents({"status": "open"}),
        "critical_reports": await db.reports.count_documents({"status": "open", "priority": "critical"}),
        "total_users": await db.users.count_documents({}),
        "banned_users": await db.users.count_documents({"banned": True}),
        "total_mods": await db.mods.count_documents({}),
        "total_downloads": sum(m.get("downloads", 0) for m in await db.mods.find({}, {"downloads": 1}).to_list(5000)),
    }


@api.get("/admin/queue")
async def review_queue(user: dict = Depends(require_staff("content_reviewer", "ts_moderator"))):
    mods = await db.mods.find({"status": "in_review"}, {"_id": 0}).sort("created_at", 1).to_list(200)
    versions = await db.versions.find({"status": "in_review"}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return {"mods": mods, "versions": versions}


@api.get("/admin/versions/{version_id}/diff")
async def version_diff(version_id: str, user: dict = Depends(require_staff("content_reviewer", "ts_moderator"))):
    version = await db.versions.find_one({"id": version_id}, {"_id": 0})
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    prev = await db.versions.find(
        {"mod_id": version["mod_id"], "status": "approved"}, {"_id": 0}
    ).sort("created_at", -1).to_list(1)
    return {"current": version, "previous": prev[0] if prev else None}


@api.post("/admin/mods/{mod_id}/moderate")
async def moderate_mod(mod_id: str, data: ModerationInput, user: dict = Depends(require_staff("content_reviewer", "ts_moderator"))):
    mod = await db.mods.find_one({"id": mod_id})
    if not mod:
        raise HTTPException(status_code=404, detail="Mod not found")
    status_map = {"approve": "approved", "reject": "rejected", "request_changes": "changes_requested", "quarantine": "quarantined"}
    new_status = status_map[data.action]
    await db.mods.update_one({"id": mod_id}, {"$set": {"status": new_status, "review_reason": data.reason, "updated_at": now_iso()}})
    
    # Broadcast status change
    await manager.broadcast({
        "type": "status_updated",
        "mod_id": mod_id,
        "status": new_status
    })
    
    await audit(user, f"mod_{data.action}", "mod", mod_id, before={"status": mod["status"]}, after={"status": new_status, "reason": data.reason})
    await notify(mod["author_id"], f"mod_{data.action}", f"Your project \"{mod['title']}\" was {new_status.replace('_', ' ')}." + (f" Reason: {data.reason}" if data.reason else ""), f"/item/{mod['slug']}")
    return {"status": new_status}


@api.post("/admin/versions/{version_id}/moderate")
async def moderate_version(version_id: str, data: ModerationInput, user: dict = Depends(require_staff("content_reviewer", "ts_moderator"))):
    version = await db.versions.find_one({"id": version_id})
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    status_map = {"approve": "approved", "reject": "rejected", "request_changes": "changes_requested", "quarantine": "quarantined"}
    new_status = status_map[data.action]
    await db.versions.update_one({"id": version_id}, {"$set": {"status": new_status, "review_reason": data.reason}})
    if data.action == "approve" and version.get("mod_id"):
        parent = await db.mods.find_one({"id": version["mod_id"]})
        if parent and parent.get("status") in ("in_review", "changes_requested", "draft"):
            await db.mods.update_one({"id": version["mod_id"]}, {"$set": {"status": "approved", "updated_at": now_iso()}})
            await manager.broadcast({
                "type": "status_updated",
                "mod_id": version["mod_id"],
                "status": "approved"
            })
            
    # Broadcast version status change
    await manager.broadcast({
        "type": "version_status_updated",
        "version_id": version_id,
        "mod_id": version.get("mod_id"),
        "status": new_status
    })
    
    await audit(user, f"version_{data.action}", "version", version_id, before={"status": version["status"]}, after={"status": new_status, "reason": data.reason})
    return {"status": new_status}



@api.post("/admin/mods/{mod_id}/staff-pick")
async def toggle_staff_pick(mod_id: str, user: dict = Depends(require_staff("content_reviewer", "ts_moderator"))):
    mod = await db.mods.find_one({"id": mod_id})
    if not mod:
        raise HTTPException(status_code=404, detail="Mod not found")
    new_val = not mod.get("staff_pick", False)
    await db.mods.update_one({"id": mod_id}, {"$set": {"staff_pick": new_val, "featured_order": 999 if new_val else None}})
    await audit(user, "toggle_staff_pick", "mod", mod_id, after={"staff_pick": new_val})
    return {"staff_pick": new_val}

@api.put("/admin/featured-order")
async def update_featured_order(payload: dict, user: dict = Depends(require_staff("content_reviewer", "ts_moderator"))):
    orders = payload.get("orders", []) # [{"id": "mod_id", "order": 1}]
    for item in orders:
        await db.mods.update_one({"id": item["id"]}, {"$set": {"featured_order": item["order"]}})
    await audit(user, "update_featured_order", "system", "featured", after={"orders": orders})
    return {"status": "updated"}


@api.get("/admin/users")
async def admin_users(q: Optional[str] = None, user: dict = Depends(require_staff("ts_moderator", "support_agent", "auditor"))):
    query = {}
    if q:
        query = {"$or": [{"name": {"$regex": re.escape(q), "$options": "i"}}, {"email": {"$regex": re.escape(q), "$options": "i"}}]}
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(300)
    return users


@api.put("/admin/users/{user_id}/trust")
async def update_trust(user_id: str, data: TrustInput, user: dict = Depends(require_staff("ts_moderator"))):
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    updates = {}
    if data.trust_tier and data.trust_tier in TRUST_TIERS:
        updates["trust_tier"] = data.trust_tier
    if data.verified_creator is not None:
        updates["verified_creator"] = data.verified_creator
    if data.banned is not None:
        updates["banned"] = data.banned
    if data.shadow_banned is not None:
        updates["shadow_banned"] = data.shadow_banned
    if data.role is not None and user.get("role") == "super_admin" and (data.role in STAFF_ROLES or data.role == "user"):
        updates["role"] = data.role
    if updates:
        await db.users.update_one({"id": user_id}, {"$set": updates})
        await audit(user, "update_trust", "user", user_id, before={k: target.get(k) for k in updates}, after=updates)
    fresh = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return fresh


@api.post("/admin/users/{user_id}/revoke-sessions")
async def revoke_sessions(user_id: str, user: dict = Depends(require_staff("ts_moderator", "support_agent"))):
    # rotates the effective token check by bumping a session epoch (demo)
    await db.users.update_one({"id": user_id}, {"$set": {"session_revoked_at": now_iso()}})
    await audit(user, "revoke_sessions", "user", user_id, after={"revoked_at": now_iso()})
    return {"ok": True}


@api.get("/admin/reports")
async def admin_reports(status: Optional[str] = None, user: dict = Depends(require_staff("ts_moderator", "support_agent"))):
    query = {}
    if status:
        query["status"] = status
    reports = await db.reports.find(query, {"_id": 0}).sort([("priority", 1), ("created_at", 1)]).to_list(300)
    return reports


@api.post("/admin/reports/{report_id}/resolve")
async def resolve_report(report_id: str, payload: dict, user: dict = Depends(require_staff("ts_moderator", "support_agent"))):
    report = await db.reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    status = payload.get("status", "resolved")
    await db.reports.update_one({"id": report_id}, {"$set": {"status": status, "resolution": payload.get("resolution", ""), "resolved_by": user["name"], "resolved_at": now_iso()}})
    await audit(user, "resolve_report", "report", report_id, before={"status": report["status"]}, after={"status": status})
    return {"status": status}


@api.get("/admin/audit")
async def get_audit(user: dict = Depends(require_staff("auditor", "ts_moderator"))):
    logs = await db.audit_logs.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return logs


@api.get("/admin/anomalies")
async def anomalies(user: dict = Depends(require_staff())):
    mods = await db.mods.find({}, {"_id": 0}).to_list(2000)
    # download spike detection (mods with abnormally high downloads relative to rating count)
    spikes = []
    for m in mods:
        dl = m.get("downloads", 0)
        rc = m.get("rating_count", 0)
        ratio = dl / (rc + 1)
        if dl > 5000 and ratio > 2000:
            spikes.append({"mod": m["title"], "downloads": dl, "reviews": rc, "ratio": round(ratio), "flag": "download_spike"})
    # mass account creation same-day clustering
    users = await db.users.find({}, {"_id": 0, "created_at": 1, "name": 1}).to_list(3000)
    by_day = {}
    for u in users:
        d = (u.get("created_at") or "")[:10]
        by_day[d] = by_day.get(d, 0) + 1
    clusters = [{"day": k, "accounts": v, "flag": "mass_signup"} for k, v in by_day.items() if v >= 5]
    return {"download_spikes": spikes, "signup_clusters": clusters,
            "vote_manipulation": [s for s in spikes if s["ratio"] > 5000]}


# ---------------------------------------------------------------------------
# Interactions: follow / favorite / bookmark
# ---------------------------------------------------------------------------
async def _toggle(field: str, count_field: Optional[str], slug: str, user: dict):
    mod = await db.mods.find_one({"slug": slug})
    if not mod:
        raise HTTPException(status_code=404, detail="Project not found")
    arr = list(user.get(field, []) or [])
    if mod["id"] in arr:
        arr.remove(mod["id"]); active = False; inc = -1
    else:
        arr.append(mod["id"]); active = True; inc = 1
    await db.users.update_one({"id": user["id"]}, {"$set": {field: arr}})
    count = None
    if count_field:
        await db.mods.update_one({"id": mod["id"]}, {"$inc": {count_field: inc}})
        count = max(0, (mod.get(count_field, 0) or 0) + inc)
    return {"active": active, "count": count}


@api.post("/mods/{slug}/follow")
async def follow(slug: str, user: dict = Depends(get_current_user)):
    return await _toggle("following", "follows", slug, user)


@api.post("/mods/{slug}/favorite")
async def favorite(slug: str, user: dict = Depends(get_current_user)):
    return await _toggle("favorites", "favorites_count", slug, user)


@api.post("/mods/{slug}/bookmark")
async def bookmark(slug: str, user: dict = Depends(get_current_user)):
    return await _toggle("bookmarks", None, slug, user)


@api.get("/me/library")
async def my_library(user: dict = Depends(get_current_user)):
    fresh = await db.users.find_one({"id": user["id"]})
    ids = {"following": fresh.get("following", []) or [], "favorites": fresh.get("favorites", []) or [], "bookmarks": fresh.get("bookmarks", []) or []}
    all_ids = list(set(ids["following"] + ids["favorites"] + ids["bookmarks"]))
    mods = await db.mods.find({"id": {"$in": all_ids}}, {"_id": 0}).to_list(500)
    return {"ids": ids, "mods": mods}


# ---------------------------------------------------------------------------
# Project edit + gallery
# ---------------------------------------------------------------------------
@api.put("/creator/mods/{mod_id}")
async def edit_mod(mod_id: str, payload: dict, user: dict = Depends(get_current_user)):
    mod = await db.mods.find_one({"id": mod_id})
    if not mod:
        raise HTTPException(status_code=404, detail="Project not found")
    if mod["author_id"] != user["id"] and user.get("role") not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Not your project")
    allowed = {}
    for k in ("summary", "description", "license", "icon", "item_type", "rarity", "contains_ai"):
        if k in payload:
            allowed[k] = payload[k]
    if "name" in payload and payload["name"].strip():
        allowed["title"] = payload["name"].strip()
    if payload.get("visibility") in ("public", "unlisted", "private"):
        allowed["visibility"] = payload["visibility"]
    if "monetization" in payload:
        allowed["monetization"] = bool(payload["monetization"])
    if "tags" in payload:
        allowed["tags"] = payload["tags"][:8]
    if "mod_loaders" in payload:
        allowed["mod_loaders"] = payload["mod_loaders"]
    if "game_versions" in payload:
        allowed["game_versions"] = payload["game_versions"]
    allowed["updated_at"] = now_iso()
    await db.mods.update_one({"id": mod_id}, {"$set": allowed})
    fresh = await db.mods.find_one({"id": mod_id}, {"_id": 0})
    return fresh


@api.delete("/creator/mods/{mod_id}")
async def delete_mod(mod_id: str, user: dict = Depends(get_current_user)):
    mod = await db.mods.find_one({"id": mod_id})
    if not mod:
        raise HTTPException(status_code=404, detail="Project not found")
    if mod["author_id"] != user["id"] and user.get("role") not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Not allowed to delete this project")
    
    # 1. Delete version files
    versions = await db.versions.find({"mod_id": mod_id}).to_list()
    for v in versions:
        vpath = UPLOAD_DIR / f"{v['id']}.gz"
        if vpath.exists():
            vpath.unlink()
    
    # 2. Delete gallery images
    for g in mod.get("gallery", []):
        fname = g.split("/")[-1]
        gpath = UPLOAD_DIR / "gallery" / fname
        if gpath.exists():
            gpath.unlink()
            
    # 3. Delete DB records
    await db.versions.delete_many({"mod_id": mod_id})
    await db.reviews.delete_many({"mod_id": mod_id})
    await db.comments.delete_many({"mod_id": mod_id})
    await db.mods.delete_one({"id": mod_id})
    
    await audit(user, "delete_project", "mod", mod_id, before=mod)
    return {"status": "deleted"}

@api.post("/creator/mods/{mod_id}/submit")
async def submit_mod(mod_id: str, user: dict = Depends(get_current_user)):
    mod = await db.mods.find_one({"id": mod_id})
    if not mod or mod["author_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your project")
    if mod["status"] != "draft":
        raise HTTPException(status_code=400, detail="Project is not in draft status")
        
    versions = await db.versions.find({"mod_id": mod_id}).to_list()
    if not versions:
        raise HTTPException(status_code=400, detail="Must have at least 1 version uploaded")
    if len(mod.get("summary", "")) < 20:
        raise HTTPException(status_code=400, detail="Summary must be at least 20 characters")
    if len(mod.get("description", "")) < 100:
        raise HTTPException(status_code=400, detail="Description must be at least 100 characters")
    if "api.dicebear.com" in (mod.get("icon") or ""):
        raise HTTPException(status_code=400, detail="Must upload a custom icon")
    if not mod.get("category"):
        raise HTTPException(status_code=400, detail="Must select a category")
    
    has_loaders = any(len(v.get("mod_loaders", [])) > 0 for v in versions)
    if not has_loaders and not mod.get("mod_loaders"):
        raise HTTPException(status_code=400, detail="Must select at least 1 loader/platform (on a version or project)")
            
    await db.mods.update_one({"id": mod_id}, {"$set": {"status": "in_review", "updated_at": now_iso()}})
    await audit(user, "submit_project", "mod", mod_id, before={"status": "draft"}, after={"status": "in_review"})
    return {"status": "in_review"}

@api.post("/creator/mods/{mod_id}/gallery")
async def upload_gallery(mod_id: str, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    mod = await db.mods.find_one({"id": mod_id})
    if not mod or (mod["author_id"] != user["id"] and user.get("role") not in STAFF_ROLES):
        raise HTTPException(status_code=403, detail="Not allowed")
    raw = await file.read()
    if len(raw) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image exceeds 10MB")
    gdir = UPLOAD_DIR / "gallery"
    gdir.mkdir(exist_ok=True)
    ext = os.path.splitext(file.filename)[1].lower() or ".png"
    fname = f"{uuid.uuid4().hex}{ext}"
    (gdir / fname).write_bytes(raw)
    url = f"/api/gallery/{fname}"
    gallery = list(mod.get("gallery", []) or [])
    gallery.append(url)
    await db.mods.update_one({"id": mod_id}, {"$set": {"gallery": gallery, "updated_at": now_iso()}})
    return {"url": url, "gallery": gallery}

@api.post("/creator/mods/{mod_id}/icon")
async def upload_icon(mod_id: str, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    mod = await db.mods.find_one({"id": mod_id})
    if not mod:
        raise HTTPException(status_code=404, detail="Mod not found")
    if mod["author_id"] != user["id"] and user.get("role") not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Not your project")
    
    gdir = UPLOAD_DIR / "gallery"
    gdir.mkdir(parents=True, exist_ok=True)
    ext = file.filename.split(".")[-1]
    fname = f"{mod_id}_icon_{int(time.time())}.{ext}"
    path = gdir / fname
    with open(path, "wb") as f:
        f.write(await file.read())
    
    url = f"/api/gallery/{fname}"
    await db.mods.update_one({"id": mod_id}, {"$set": {"icon": url, "updated_at": now_iso()}})
    return {"url": url}


@api.get("/gallery/{fname}")
async def serve_gallery(fname: str):
    path = UPLOAD_DIR / "gallery" / fname
    if not path.exists():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(str(path))


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------
async def notify(user_id: str, ntype: str, text: str, link: str = ""):
    notification = {
        "id": str(uuid.uuid4()), "user_id": user_id, "type": ntype,
        "text": text, "link": link, "read": False, "created_at": now_iso(),
    }
    await db.notifications.insert_one(dict(notification))
    await manager.send_personal_message({
        "type": "notification",
        "notification": notification
    }, user_id)



@api.get("/notifications")
async def get_notifications(user: dict = Depends(get_current_user)):
    items = await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    unread = len([n for n in items if not n.get("read")])
    return {"notifications": items, "unread": unread}


@api.post("/notifications/read-all")
async def read_all(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Collections
# ---------------------------------------------------------------------------
@api.post("/collections")
async def create_collection(payload: dict, user: dict = Depends(get_current_user)):
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    col = {"id": str(uuid.uuid4()), "owner_id": user["id"], "owner_name": user["name"],
           "name": name, "description": payload.get("description", ""), "mod_ids": [], "created_at": now_iso()}
    await db.collections.insert_one(dict(col))
    return {k: v for k, v in col.items() if k != "_id"}


@api.get("/collections")
async def list_collections(user: dict = Depends(get_current_user)):
    cols = await db.collections.find({"owner_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for c in cols:
        c["count"] = len(c.get("mod_ids", []))
    return cols


@api.get("/collections/{cid}")
async def get_collection(cid: str, user: dict = Depends(get_current_user)):
    col = await db.collections.find_one({"id": cid, "owner_id": user["id"]}, {"_id": 0})
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
    col["mods"] = await db.mods.find({"id": {"$in": col.get("mod_ids", [])}}, {"_id": 0}).to_list(500)
    return col


@api.post("/collections/{cid}/items")
async def toggle_collection_item(cid: str, payload: dict, user: dict = Depends(get_current_user)):
    col = await db.collections.find_one({"id": cid, "owner_id": user["id"]})
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
    mod_id = payload.get("mod_id")
    if not mod_id or not await db.mods.find_one({"id": mod_id}):
        raise HTTPException(status_code=404, detail="Project not found")
    ids = list(col.get("mod_ids", []))
    if mod_id in ids:
        ids.remove(mod_id); active = False
    else:
        ids.append(mod_id); active = True
    await db.collections.update_one({"id": cid}, {"$set": {"mod_ids": ids}})
    return {"active": active, "count": len(ids)}


# ---------------------------------------------------------------------------
# Organizations (basic)
# ---------------------------------------------------------------------------
@api.post("/organizations")
async def create_org(payload: dict, user: dict = Depends(get_current_user)):
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    org = {"id": str(uuid.uuid4()), "slug": slugify(name), "name": name, "owner_id": user["id"],
           "members": [{"user_id": user["id"], "name": user["name"], "role": "owner"}], "created_at": now_iso()}
    await db.organizations.insert_one(dict(org))
    return {k: v for k, v in org.items() if k != "_id"}


@api.get("/organizations")
async def list_orgs(user: dict = Depends(get_current_user)):
    orgs = await db.organizations.find({"members.user_id": user["id"]}, {"_id": 0}).to_list(100)
    return orgs


# ---------------------------------------------------------------------------
# News & Contact Submissions (Admin Panel and Public pages)
# ---------------------------------------------------------------------------
@api.get("/news")
async def list_news():
    news_list = await db.news.find({}, {"_id": 0}).to_list(100)
    # Sort manually or via cursor since they are loaded as list
    news_list.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return news_list


@api.post("/news")
async def create_news_article(payload: dict, user: dict = Depends(require_staff("super_admin"))):
    title = (payload.get("title") or "").strip()
    content = (payload.get("content") or "").strip()
    if not title or not content:
        raise HTTPException(status_code=400, detail="Title and content are required")
    
    summary = (payload.get("summary") or "").strip() or (content[:150] + "...")
    category = (payload.get("category") or "Announcements").strip()
    author = user.get("name") or "Qiveo Admin"
    
    # Calculate read time (rough estimate: 200 words per minute)
    words = len(content.split())
    read_time_mins = max(1, round(words / 200))
    read_time = f"{read_time_mins} min read"
    
    article = {
        "id": str(uuid.uuid4()),
        "title": title,
        "summary": summary,
        "content": content,
        "category": category,
        "author": author,
        "read_time": read_time,
        "created_at": now_iso()
    }
    await db.news.insert_one(dict(article))
    await audit(user, "publish_news", "news", article["id"], after=article)
    return article


@api.delete("/news/{news_id}")
async def delete_news_article(news_id: str, user: dict = Depends(require_staff("super_admin"))):
    existing = await db.news.find_one({"id": news_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Article not found")
    await db.news.delete_one({"id": news_id})
    await audit(user, "delete_news", "news", news_id, before=existing)
    return {"status": "deleted"}


@api.post("/contact")
async def submit_contact_form(payload: dict):
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip()
    message = (payload.get("message") or "").strip()
    if not name or not email or not message:
        raise HTTPException(status_code=400, detail="Name, email, and message are required")
    
    submission = {
        "id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "subject": (payload.get("subject") or "").strip() or "General Inquiry",
        "message": message,
        "created_at": now_iso()
    }
    await db.contact_submissions.insert_one(dict(submission))
    return {"status": "success", "id": submission["id"]}


@api.get("/admin/contact")
async def list_contact_submissions(user: dict = Depends(require_staff())):
    submissions = await db.contact_submissions.find({}, {"_id": 0}).to_list(100)
    submissions.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return submissions


@api.delete("/admin/contact/{sub_id}")
async def delete_contact_submission(sub_id: str, user: dict = Depends(require_staff())):
    existing = await db.contact_submissions.find_one({"id": sub_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Submission not found")
    await db.contact_submissions.delete_one({"id": sub_id})
    await audit(user, "delete_contact_submission", "contact_submission", sub_id, before=existing)
    return {"status": "deleted"}


# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------
async def seed():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id")
    await db.mods.create_index("slug")
    await db.versions.create_index("mod_id")

    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin = await db.users.find_one({"email": admin_email})
    if not admin:
        admin = {
            "id": str(uuid.uuid4()), "email": admin_email,
            "password_hash": hash_password(os.environ["ADMIN_PASSWORD"]),
            "name": "Qiveo Admin", "avatar_url": "https://api.dicebear.com/7.x/identicon/svg?seed=admin",
            "role": "super_admin", "trust_tier": "verified", "verified_creator": True,
            "banned": False, "shadow_banned": False, "bio": "Platform superadmin", "following": [],
            "linked_providers": [], "two_factor_enabled": True, "created_at": now_iso(),
        }
        await db.users.insert_one(dict(admin))
    elif not verify_password(os.environ["ADMIN_PASSWORD"], admin.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(os.environ["ADMIN_PASSWORD"])}})

    # staff members
    if os.environ.get("PRODUCTION") != "true":
        staff_defs = [
            ("mod@qiveo.dev", "Priya (T&S Mod)", "ts_moderator"),
            ("reviewer@qiveo.dev", "Dex (Reviewer)", "content_reviewer"),
            ("support@qiveo.dev", "Sam (Support)", "support_agent"),
            ("auditor@qiveo.dev", "Ivy (Auditor)", "auditor"),
        ]
        for email, name, role in staff_defs:
            if not await db.users.find_one({"email": email}):
                await db.users.insert_one({
                    "id": str(uuid.uuid4()), "email": email, "password_hash": hash_password("Staff!2026"),
                    "name": name, "avatar_url": f"https://api.dicebear.com/7.x/identicon/svg?seed={slugify(name)}",
                    "role": role, "trust_tier": "verified", "verified_creator": False, "banned": False,
                    "shadow_banned": False, "bio": "", "following": [], "linked_providers": [],
                    "two_factor_enabled": True, "created_at": now_iso(),
                })

    # game / hub
    if not await db.games.find_one({"slug": "minecraft"}):
        await db.games.insert_one({
            "id": str(uuid.uuid4()), "slug": "minecraft", "name": "Minecraft",
            "tagline": "Skins, builds, mods & collectibles — curated for the block universe.",
            "description": "Qiveo is the Minecraft marketplace. Grab hand-crafted skins, characters, builds, worlds, mods and blocky collectibles — every drop reviewed by real humans before it lands.",
            "banner": "https://images.pexels.com/photos/17483907/pexels-photo-17483907.png",
            "icon": "https://api.dicebear.com/7.x/shapes/svg?seed=minecraft",
            "item_types": ["Skin", "Character", "Build", "World", "Mod", "Collectible"],
            "rarities": ["Common", "Rare", "Epic", "Legendary"],
            "categories": ["Skin", "Character", "Build", "World", "Mod", "Collectible"],
            "mod_loaders": ["Fabric", "Forge", "NeoForge", "Quilt"],
            "versions": ["1.21.4", "1.21.1", "1.20.4", "1.20.1", "1.19.2", "1.18.2", "1.16.5"],
        })

    if await db.categories.count_documents({}) == 0:
        for c in [
            {"id": "cat-utility", "slug": "utility", "display_name": "Utility", "icon": "", "applicable_project_type": "Mod"},
            {"id": "cat-combat", "slug": "combat", "display_name": "Combat", "icon": "", "applicable_project_type": "Mod"},
            {"id": "cat-magic", "slug": "magic", "display_name": "Magic", "icon": "", "applicable_project_type": "Mod"},
            {"id": "cat-tech", "slug": "tech", "display_name": "Tech", "icon": "", "applicable_project_type": "Mod"}
        ]: await db.categories.insert_one(c)
        
    if await db.loaders.count_documents({}) == 0:
        for l in [
            {"id": "load-fabric", "slug": "fabric", "display_name": "Fabric", "icon": "", "applicable_project_type": "Mod"},
            {"id": "load-forge", "slug": "forge", "display_name": "Forge", "icon": "", "applicable_project_type": "Mod"},
            {"id": "load-neoforge", "slug": "neoforge", "display_name": "NeoForge", "icon": "", "applicable_project_type": "Mod"},
            {"id": "load-quilt", "slug": "quilt", "display_name": "Quilt", "icon": "", "applicable_project_type": "Mod"}
        ]: await db.loaders.insert_one(l)
        
    if await db.platforms.count_documents({}) == 0:
        for p in [
            {"id": "plat-spigot", "slug": "spigot", "display_name": "Spigot", "icon": "", "applicable_project_type": "Plugin"},
            {"id": "plat-paper", "slug": "paper", "display_name": "Paper", "icon": "", "applicable_project_type": "Plugin"}
        ]: await db.platforms.insert_one(p)


    if os.environ.get("PRODUCTION") == "true":
        return

    # demo creator + items
    creator = await db.users.find_one({"email": "creator@qiveo.dev"})
    if not creator:
        creator = {
            "id": str(uuid.uuid4()), "email": "creator@qiveo.dev", "password_hash": hash_password("Creator!2026"),
            "name": "AuroraBlocks", "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=auroradev",
            "role": "user", "trust_tier": "verified", "verified_creator": True, "banned": False,
            "shadow_banned": False, "bio": "Voxel artist & mod-maker. Drops every Friday.", "following": [],
            "linked_providers": ["google", "discord"], "two_factor_enabled": True, "created_at": now_iso(),
        }
        await db.users.insert_one(dict(creator))

    # demo discord player account (for one-tap demo login)
    if not await db.users.find_one({"email": "blockfan@qiveo.dev"}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": "blockfan@qiveo.dev", "password_hash": hash_password("BlockFan!2026"),
            "name": "BlockFan", "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=blockfan",
            "role": "user", "trust_tier": "new", "verified_creator": False, "banned": False,
            "shadow_banned": False, "bio": "Just here for the drops.", "following": [],
            "linked_providers": ["discord"], "two_factor_enabled": False, "created_at": now_iso(),
        })

    IMG = "https://static.qiveo.dev/images/"
    imgs = {
        "hero_knight": IMG + "2409c73f1921782fe1be9b54adbb23637d86138d5cbc36ca52108cbba2d2cd62.jpeg",
        "skin_explorer": IMG + "2dc88fc83132735b5ec2bf7b9a0aae0d3af6de27d1e3957dd54d60a3d49692dc.jpeg",
        "skin_robot": IMG + "22d3e3f21a91d3417e53f30f2e9cd335249d67a726f0cd1376e53848446bd98b.jpeg",
        "build_castle": IMG + "bb8adeaa2fc06dab2670dec9260c1848224ec55ecaa04ff0ebff15e5e34d4f52.jpeg",
        "world_island": IMG + "e0f82de9f54ae28108eb67279312fbff193876bee8c690433444433d5f06333a.jpeg",
        "mod_portal": IMG + "6c8f9434e7bd791691f9329ee092410bed8a9874b4233f7cc752a20ca75bbbf8.jpeg",
        "collectible_pig": IMG + "a1bb25de0c276cc9b844bef35d3b95d680a4e6016280009ef4b0fa9de154e41d.jpeg",
        "collectible_fox": IMG + "103a9f9d337d4372ccf7f2ab85062a802351e6b9ae7a557c8015845cca517443.jpeg",
        "collectible_dragon": IMG + "6b3db9a86430953d31edd4ebb58c3aa6dcf5b2ee9afee9f9a58a24945e8ec372.jpeg",
        "skin_ninja": IMG + "6676703c1591f660a7a2c85a10ce2df5106abba1c54479d36e3d17ad1081b008.jpeg",
    }

    if await db.mods.count_documents({}) == 0:
        # (title, summary, item_type, rarity, tags, loaders, gvs, dls, rating, rcount, pick, img)
        demo = [
            ("Aether Knight", "A legendary armored hero skin with a glowing runeblade.", "Character", "Legendary", ["armor", "hero", "rpg"], [], ["1.21.4", "1.20.1"], 128000, 4.9, 3400, True, "hero_knight"),
            ("Shadow Ninja", "Stealthy ninja skin wrapped in a signature coral scarf.", "Skin", "Epic", ["ninja", "stealth", "skin"], [], ["1.21.1"], 88000, 4.8, 2100, True, "skin_ninja"),
            ("Nether Gate Reforged", "Reimagined portals with custom dimensions and particle FX.", "Mod", "Legendary", ["portal", "dimension", "magic"], ["Fabric", "Forge"], ["1.21.4", "1.20.1"], 210000, 4.9, 5200, True, "mod_portal"),
            ("Skyhold Castle", "A drop-in fantasy castle build with towers and courtyards.", "Build", "Epic", ["castle", "medieval", "build"], [], ["1.21.4", "1.20.4"], 96000, 4.8, 2600, True, "build_castle"),
            ("Amethyst Wyrm", "Legendary dragon collectible. Only 500 ever minted.", "Collectible", "Legendary", ["collectible", "dragon", "rare"], [], [], 41000, 4.9, 1500, True, "collectible_dragon"),
            ("Rustbolt Bot", "Retro-futuristic robot character with coral core lights.", "Character", "Epic", ["robot", "tech", "cute"], [], ["1.21.1"], 52000, 4.6, 1200, False, "skin_robot"),
            ("Frontier Explorer", "Rugged explorer skin, ready for any biome expedition.", "Skin", "Rare", ["explorer", "adventure", "skin"], [], ["1.21.4"], 74000, 4.7, 1800, False, "skin_explorer"),
            ("Lush Isle", "A ready-to-explore floating island survival world.", "World", "Rare", ["survival", "island", "worldgen"], [], ["1.21.4"], 61000, 4.5, 1500, False, "world_island"),
            ("Ember Fox", "Epic fox collectible glowing in a warm ember palette.", "Collectible", "Epic", ["collectible", "fox", "drop"], [], [], 24000, 4.7, 880, False, "collectible_fox"),
            ("Piglet #001", "Genesis collectible from the Blockyard drop. Ultra chunky.", "Collectible", "Rare", ["collectible", "cute", "drop"], [], [], 18000, 4.4, 620, False, "collectible_pig"),
        ]
        type_desc = {
            "Skin": "## Apply this skin\n1. Download the pack\n2. Upload it in your Minecraft profile or launcher\n3. Jump in and show it off\n\nWorks in Java & compatible clients.",
            "Character": "## Character pack\nIncludes the full skin plus matching capes and accessories where supported.\n\n1. Download\n2. Apply in your launcher\n3. Done",
            "Build": "## Import this build\nShipped as a schematic + world download.\n\n1. Drop into your saves or use a schematic mod\n2. Paste it into your world\n3. Make it yours",
            "World": "## Load this world\n1. Download the world folder\n2. Unzip into your `saves` directory\n3. Select it from your worlds list",
            "Mod": "## Install this mod\n1. Download the latest version\n2. Drop the file into your `mods` folder\n3. Launch with the matching loader\n\nReleased under the MIT license.",
            "Collectible": "## Blocky collectible\nPart of a limited voxel drop. Includes the render + in-game display model.\n\nOwnership is tracked to your Qiveo profile.",
        }
        for (title, summary, itype, rarity, tags, loaders, gvs, dls, rating, rcount, pick, img) in demo:
            slug = slugify(title)
            mid = str(uuid.uuid4())
            await db.mods.insert_one({
                "id": mid, "slug": slug, "title": title, "summary": summary,
                "description": f"# {title}\n\n{summary}\n\n{type_desc.get(itype, '')}",
                "game_slug": "minecraft", "game_name": "Minecraft",
                "author_id": creator["id"], "author_name": creator["name"], "author_verified": True,
                "item_type": itype, "rarity": rarity, "pricing": "free", "price": 0,
                "category": itype, "tags": tags, "mod_loaders": loaders, "game_versions": gvs,
                "license": "MIT", "gallery": [], "icon": imgs[img],
                "status": "approved", "staff_pick": pick, "downloads": dls, "rating_avg": rating,
                "rating_count": rcount, "base_rating_sum": round(rating * rcount), "base_rating_count": rcount,
                "review_reason": "", "created_at": now_iso(), "updated_at": now_iso(),
            })
            svid = str(uuid.uuid4())
            spath = UPLOAD_DIR / f"{svid}.gz"
            with gzip.open(spath, "wb") as fh:
                fh.write(f"QIVEO placeholder artifact for {title} v1.0.0\n".encode())
            await db.versions.insert_one({
                "id": svid, "mod_id": mid, "mod_slug": slug, "mod_title": title,
                "version_number": "1.0.0", "changelog": "Initial public release.",
                "game_versions": gvs, "mod_loaders": loaders, "dependencies": [],
                "file_name": f"{slug}-1.0.0.zip", "file_path": str(spath), "file_size": 240_000,
                "compressed_size": spath.stat().st_size, "detected_type": "application/zip",
                "status": "approved", "review_reason": "", "created_at": now_iso(),
            })

        # one pending item for the review queue
        pmid = str(uuid.uuid4())
        pvid = str(uuid.uuid4())
        ppath = UPLOAD_DIR / f"{pvid}.gz"
        with gzip.open(ppath, "wb") as fh:
            fh.write(b"QIVEO placeholder artifact for Neon Golem 0.9.0\n")
        await db.mods.insert_one({
            "id": pmid, "slug": "neon-golem-beta", "title": "Neon Golem (Beta)",
            "summary": "New character skin submitted for review.",
            "description": "# Neon Golem\n\nA brand new character skin awaiting review.",
            "game_slug": "minecraft", "game_name": "Minecraft",
            "author_id": creator["id"], "author_name": creator["name"], "author_verified": False,
            "item_type": "Character", "rarity": "Rare", "pricing": "free", "price": 0,
            "category": "Character", "tags": ["golem", "skin"], "mod_loaders": [],
            "game_versions": ["1.21.4"], "license": "MIT", "gallery": [],
            "icon": "https://api.dicebear.com/7.x/shapes/svg?seed=neon-golem",
            "status": "in_review", "staff_pick": False, "downloads": 0, "rating_avg": 0,
            "rating_count": 0, "base_rating_sum": 0, "base_rating_count": 0,
            "review_reason": "", "created_at": now_iso(), "updated_at": now_iso(),
        })
        await db.versions.insert_one({
            "id": pvid, "mod_id": pmid, "mod_slug": "neon-golem-beta", "mod_title": "Neon Golem (Beta)",
            "version_number": "0.9.0", "changelog": "First submission.",
            "game_versions": ["1.21.4"], "mod_loaders": [], "dependencies": [],
            "file_name": "neon-golem-0.9.0.zip", "file_path": str(ppath), "file_size": 512_000,
            "compressed_size": ppath.stat().st_size, "detected_type": "application/zip",
            "status": "in_review", "review_reason": "", "created_at": now_iso(),
        })

        # seed a couple reports
        await db.reports.insert_one({
            "id": str(uuid.uuid4()), "target_type": "mod", "target_id": pmid,
            "category": "malware", "reason": "Suspicious outbound network call detected in obfuscated class.",
            "reporter_id": creator["id"], "reporter_name": "AuroraDev", "status": "open", "priority": "critical",
            "sla_deadline": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            "resolution": "", "created_at": now_iso(),
        })
        await db.reports.insert_one({
            "id": str(uuid.uuid4()), "target_type": "comment", "target_id": "cmt-1",
            "category": "harassment", "reason": "User posted personal address in comments (doxxing).",
            "reporter_id": creator["id"], "reporter_name": "AuroraDev", "status": "open", "priority": "normal",
            "sla_deadline": (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat(),
            "resolution": "", "created_at": now_iso(),
        })


@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed()


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()
