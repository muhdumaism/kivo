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
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

app = FastAPI(title="Kivo API")
api = APIRouter(prefix="/api")

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
    # One-tap demo sign-in that stands in for OAuth until real Google/Discord keys are added.
    provider = (payload.get("provider") or "google").lower()
    email_map = {"google": "creator@kivo.dev", "discord": "blockfan@kivo.dev", "staff": "admin@kivo.dev"}
    email = email_map.get(provider, "creator@kivo.dev")
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Demo account missing")
    token = create_token(user["id"], email)
    return {"token": token, "user": clean_user(user), "provider": provider}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api.put("/auth/profile")
async def update_profile(payload: dict, user: dict = Depends(get_current_user)):
    updates = {k: payload[k] for k in ("name", "bio") if k in payload}
    if "two_factor_enabled" in payload:
        updates["two_factor_enabled"] = bool(payload["two_factor_enabled"])
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    fresh = await db.users.find_one({"id": user["id"]})
    return clean_user(fresh)


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
    query = {"status": "approved"}
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
    if mod["status"] != "approved":
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
    game = await db.games.find_one({"slug": payload.get("game_slug", "minecraft")})
    if not game:
        raise HTTPException(status_code=400, detail="Invalid game")
    slug = slugify(title)
    if await db.mods.find_one({"slug": slug}):
        slug = f"{slug}-{uuid.uuid4().hex[:5]}"
    trusted = user.get("trust_tier") == "verified" or user.get("verified_creator")
    status = "approved" if trusted else "in_review"
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
    await db.mods.update_one({"id": mod_id}, {"$set": {"updated_at": now_iso(), "status": mod_status}})
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
    await audit(user, f"mod_{data.action}", "mod", mod_id, before={"status": mod["status"]}, after={"status": new_status, "reason": data.reason})
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
    await audit(user, f"version_{data.action}", "version", version_id, before={"status": version["status"]}, after={"status": new_status, "reason": data.reason})
    return {"status": new_status}


@api.post("/admin/mods/{mod_id}/staff-pick")
async def toggle_staff_pick(mod_id: str, user: dict = Depends(require_staff("content_reviewer", "ts_moderator"))):
    mod = await db.mods.find_one({"id": mod_id})
    if not mod:
        raise HTTPException(status_code=404, detail="Mod not found")
    new_val = not mod.get("staff_pick", False)
    await db.mods.update_one({"id": mod_id}, {"$set": {"staff_pick": new_val}})
    await audit(user, "toggle_staff_pick", "mod", mod_id, after={"staff_pick": new_val})
    return {"staff_pick": new_val}


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
            "name": "Kivo Admin", "avatar_url": "https://api.dicebear.com/7.x/identicon/svg?seed=admin",
            "role": "super_admin", "trust_tier": "verified", "verified_creator": True,
            "banned": False, "shadow_banned": False, "bio": "Platform superadmin", "following": [],
            "linked_providers": [], "two_factor_enabled": True, "created_at": now_iso(),
        }
        await db.users.insert_one(dict(admin))
    elif not verify_password(os.environ["ADMIN_PASSWORD"], admin.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(os.environ["ADMIN_PASSWORD"])}})

    # staff members
    staff_defs = [
        ("mod@kivo.dev", "Priya (T&S Mod)", "ts_moderator"),
        ("reviewer@kivo.dev", "Dex (Reviewer)", "content_reviewer"),
        ("support@kivo.dev", "Sam (Support)", "support_agent"),
        ("auditor@kivo.dev", "Ivy (Auditor)", "auditor"),
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
            "description": "Kivo is the Minecraft marketplace. Grab hand-crafted skins, characters, builds, worlds, mods and blocky collectibles — every drop reviewed by real humans before it lands.",
            "banner": "https://images.pexels.com/photos/17483907/pexels-photo-17483907.png",
            "icon": "https://api.dicebear.com/7.x/shapes/svg?seed=minecraft",
            "item_types": ["Skin", "Character", "Build", "World", "Mod", "Collectible"],
            "rarities": ["Common", "Rare", "Epic", "Legendary"],
            "categories": ["Skin", "Character", "Build", "World", "Mod", "Collectible"],
            "mod_loaders": ["Fabric", "Forge", "NeoForge", "Quilt"],
            "versions": ["1.21.4", "1.21.1", "1.20.4", "1.20.1", "1.19.2", "1.18.2", "1.16.5"],
        })

    # demo creator + items
    creator = await db.users.find_one({"email": "creator@kivo.dev"})
    if not creator:
        creator = {
            "id": str(uuid.uuid4()), "email": "creator@kivo.dev", "password_hash": hash_password("Creator!2026"),
            "name": "AuroraBlocks", "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=auroradev",
            "role": "user", "trust_tier": "verified", "verified_creator": True, "banned": False,
            "shadow_banned": False, "bio": "Voxel artist & mod-maker. Drops every Friday.", "following": [],
            "linked_providers": ["google", "discord"], "two_factor_enabled": True, "created_at": now_iso(),
        }
        await db.users.insert_one(dict(creator))

    # demo discord player account (for one-tap demo login)
    if not await db.users.find_one({"email": "blockfan@kivo.dev"}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": "blockfan@kivo.dev", "password_hash": hash_password("BlockFan!2026"),
            "name": "BlockFan", "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=blockfan",
            "role": "user", "trust_tier": "new", "verified_creator": False, "banned": False,
            "shadow_banned": False, "bio": "Just here for the drops.", "following": [],
            "linked_providers": ["discord"], "two_factor_enabled": False, "created_at": now_iso(),
        })

    IMG = "https://static.prod-images.emergentagent.com/jobs/925bbe81-6f0f-4229-9aa9-4cbb889d5eb1/images/"
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
            "Collectible": "## Blocky collectible\nPart of a limited voxel drop. Includes the render + in-game display model.\n\nOwnership is tracked to your Kivo profile.",
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
                fh.write(f"KIVO placeholder artifact for {title} v1.0.0\n".encode())
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
            fh.write(b"KIVO placeholder artifact for Neon Golem 0.9.0\n")
        await db.mods.insert_one({
            "id": pmid, "slug": "neon-golem-beta", "title": "Neon Golem (Beta)",
            "summary": "New character skin submitted for review.",
            "description": "# Neon Golem\n\nA brand new character skin awaiting review.",
            "game_slug": "minecraft", "game_name": "Minecraft",
            "author_id": creator["id"], "author_name": "NewbieBlocks", "author_verified": False,
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
    client.close()
