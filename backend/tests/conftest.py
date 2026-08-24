import os
import re
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
_base = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not _base:
    raise RuntimeError("REACT_APP_BACKEND_URL missing from env and /app/frontend/.env")
BASE_URL = _base.rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def admin_creds():
    path = Path("/app/memory/test_credentials.md")
    if not path.exists():
        path = Path(__file__).parents[2] / "memory" / "test_credentials.md"
    if not path.exists():
        pytest.skip("missing test_credentials.md")
    txt = path.read_text(encoding="utf-8")
    # supports "Email: `x`/Password: `y`" and "- Super admin: `x` / `y` (super_admin)"
    m = re.search(r"(?im)^\s*[-*]?\s*(?:\*\*)?Super admin(?:\*\*)?\s*:\s*`([^`]+)`\s*/\s*`([^`]+)`", txt)
    if m:
        return {"email": m.group(1), "password": m.group(2)}
    email = re.search(r"Email:\s*`([^`]+)`", txt)
    pwd = re.search(r"Password:\s*`([^`]+)`", txt)
    if not email or not pwd:
        pytest.fail("admin creds not parseable from /app/memory/test_credentials.md")
    return {"email": email.group(1), "password": pwd.group(1)}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed for {creds['email']}: {r.status_code} {r.text[:300]}")
    data = r.json()
    assert data.get("token")
    return data


def _session(data):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {data['token']}"})
    s.user = data["user"]
    return s


@pytest.fixture(scope="session")
def admin_session(admin_creds):
    return _session(_login(admin_creds))


@pytest.fixture(scope="session")
def creator_session():
    return _session(_login({"email": "creator@qiveo.dev", "password": "Creator!2026"}))


@pytest.fixture(scope="session")
def staff_sessions():
    out = {}
    for email in ["mod@qiveo.dev", "reviewer@qiveo.dev", "support@qiveo.dev", "auditor@qiveo.dev"]:
        data = _login({"email": email, "password": "Staff!2026"})
        out[data["user"]["role"]] = _session(data)
    return out


@pytest.fixture(scope="session")
def new_user_session():
    """Freshly registered non-verified user (trust_tier=new)."""
    email = f"test_newuser_{uuid.uuid4().hex[:8]}@qiveoqa.io"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "TestPass!2026", "name": "TEST_NewUser", "age_confirm": True
    }, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"register failed: {r.status_code} {r.text[:300]}")
    data = r.json()
    s = _session(data)
    s.email = email
    s.password = "TestPass!2026"
    return s
