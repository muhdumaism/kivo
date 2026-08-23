"""Module: auth — register, login, me, profile, bcrypt format, RBAC 401/403, brute-force."""
import uuid

import pytest
import requests
from conftest import API


def test_register_success_and_defaults():
    email = f"test_reg_{uuid.uuid4().hex[:8]}@kivoqa.io"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "TestPass!2026", "name": "TEST_Reg", "age_confirm": True}, timeout=30)
    assert r.status_code == 200, r.text[:300]
    d = r.json()
    assert isinstance(d["token"], str) and len(d["token"]) > 20
    u = d["user"]
    assert u["email"] == email
    assert u["role"] == "user"
    assert u["trust_tier"] == "new"
    assert u["verified_creator"] is False
    assert "password_hash" not in u and "_id" not in u
    # login with same creds works
    r2 = requests.post(f"{API}/auth/login", json={"email": email, "password": "TestPass!2026"}, timeout=30)
    assert r2.status_code == 200


def test_register_duplicate_email():
    r = requests.post(f"{API}/auth/register", json={
        "email": "creator@kivo.dev", "password": "TestPass!2026", "name": "Dup"}, timeout=30)
    assert r.status_code == 400
    assert "already" in r.json()["detail"].lower()


def test_register_validation():
    assert requests.post(f"{API}/auth/register", json={
        "email": "not-an-email", "password": "TestPass!2026", "name": "Bad"}, timeout=30).status_code == 422
    assert requests.post(f"{API}/auth/register", json={
        "email": f"test_{uuid.uuid4().hex[:6]}@kivoqa.io", "password": "123", "name": "Bad"}, timeout=30).status_code == 422


def test_register_age_confirm_enforced():
    """Server must reject registration when age_confirm is false (UI ticks it, API should too)."""
    email = f"test_age_{uuid.uuid4().hex[:8]}@kivoqa.io"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "TestPass!2026", "name": "TEST_Age", "age_confirm": False}, timeout=30)
    assert r.status_code in (400, 422), f"age_confirm=false accepted (status {r.status_code})"


def test_login_invalid_password(admin_creds):
    r = requests.post(f"{API}/auth/login", json={"email": admin_creds["email"], "password": "wrong-pass"}, timeout=30)
    assert r.status_code == 401
    assert "detail" in r.json()


def test_login_unknown_email():
    r = requests.post(f"{API}/auth/login", json={"email": "nobody@kivoqa.io", "password": "x"}, timeout=30)
    assert r.status_code == 401


def test_admin_login_and_role(admin_session):
    assert admin_session.user["role"] == "super_admin"
    r = admin_session.get(f"{API}/auth/me", timeout=30)
    assert r.status_code == 200
    assert r.json()["email"] == admin_session.user["email"]
    assert "password_hash" not in r.json()


def test_creator_login_verified(creator_session):
    assert creator_session.user["verified_creator"] is True
    assert creator_session.user["trust_tier"] == "verified"


def test_all_staff_logins(staff_sessions):
    assert set(staff_sessions.keys()) == {"ts_moderator", "content_reviewer", "support_agent", "auditor"}


def test_me_requires_auth():
    assert requests.get(f"{API}/auth/me", timeout=30).status_code == 401
    r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer garbage.token.here"}, timeout=30)
    assert r.status_code == 401


def test_profile_update_persists(creator_session):
    orig = creator_session.get(f"{API}/auth/me", timeout=30).json()
    r = creator_session.put(f"{API}/auth/profile", json={"bio": "TEST_bio_update"}, timeout=30)
    assert r.status_code == 200
    assert r.json()["bio"] == "TEST_bio_update"
    assert creator_session.get(f"{API}/auth/me", timeout=30).json()["bio"] == "TEST_bio_update"
    creator_session.put(f"{API}/auth/profile", json={"bio": orig.get("bio", "")}, timeout=30)


def test_bcrypt_hash_format(admin_creds):
    """Password hashes must be bcrypt $2b$ and never leak through the API."""
    import asyncio
    import os
    from motor.motor_asyncio import AsyncIOMotorClient
    from dotenv import dotenv_values
    env = dotenv_values("/app/backend/.env")

    async def _get():
        cl = AsyncIOMotorClient(env["MONGO_URL"])
        u = await cl[env["DB_NAME"]].users.find_one({"email": admin_creds["email"]})
        cl.close()
        return u

    u = asyncio.get_event_loop().run_until_complete(_get()) if False else asyncio.run(_get())
    assert u is not None
    assert u["password_hash"].startswith("$2b$"), f"unexpected hash prefix: {u['password_hash'][:6]}"


# ---- admin endpoint auth gating ----
ADMIN_GETS = ["/admin/overview", "/admin/queue", "/admin/reports", "/admin/users", "/admin/audit", "/admin/anomalies"]


@pytest.mark.parametrize("path", ADMIN_GETS)
def test_admin_endpoints_require_token(path):
    assert requests.get(f"{API}{path}", timeout=30).status_code in (401, 403)


@pytest.mark.parametrize("path", ADMIN_GETS)
def test_admin_endpoints_forbid_regular_user(path, new_user_session):
    r = new_user_session.get(f"{API}{path}", timeout=30)
    assert r.status_code == 403, f"{path} returned {r.status_code} for non-staff user"


def test_admin_write_endpoints_forbid_regular_user(new_user_session):
    r = new_user_session.post(f"{API}/admin/mods/xyz/moderate", json={"action": "approve"}, timeout=30)
    assert r.status_code == 403
    r = new_user_session.put(f"{API}/admin/users/xyz/trust", json={"trust_tier": "verified"}, timeout=30)
    assert r.status_code == 403


def test_role_scoping(staff_sessions):
    # auditor should not reach the moderation review queue
    assert staff_sessions["auditor"].get(f"{API}/admin/queue", timeout=30).status_code == 403
    # content_reviewer should not reach users list
    assert staff_sessions["content_reviewer"].get(f"{API}/admin/users", timeout=30).status_code == 403
    # support_agent should not reach audit log
    assert staff_sessions["support_agent"].get(f"{API}/admin/audit", timeout=30).status_code == 403
    # everyone staff can see overview + anomalies
    for role, s in staff_sessions.items():
        assert s.get(f"{API}/admin/overview", timeout=30).status_code == 200, role
        assert s.get(f"{API}/admin/anomalies", timeout=30).status_code == 200, role


def test_brute_force_lockout():
    """5 consecutive bad passwords should lock/throttle the account (429/423)."""
    email = f"test_bf_{uuid.uuid4().hex[:8]}@kivoqa.io"
    requests.post(f"{API}/auth/register", json={
        "email": email, "password": "TestPass!2026", "name": "TEST_BF"}, timeout=30)
    codes = []
    for _ in range(6):
        codes.append(requests.post(f"{API}/auth/login", json={"email": email, "password": "nope"}, timeout=30).status_code)
    assert any(c in (423, 429) for c in codes), f"no lockout after 6 failed logins: {codes}"


def test_login_sets_httponly_cookie(admin_creds):
    """get_current_user reads an access_token cookie; login should set it httpOnly."""
    r = requests.post(f"{API}/auth/login", json=admin_creds, timeout=30)
    assert r.status_code == 200
    cookie_header = r.headers.get("set-cookie", "")
    assert "access_token" in cookie_header and "HttpOnly" in cookie_header, f"no httpOnly cookie set: {cookie_header!r}"
