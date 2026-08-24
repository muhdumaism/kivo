"""Module: creator tools — my mods, analytics, create mod (trust gating), version upload."""
import io
import uuid

import requests
from conftest import API


def test_creator_mods_requires_auth():
    assert requests.get(f"{API}/creator/mods", timeout=30).status_code == 401
    assert requests.get(f"{API}/creator/analytics", timeout=30).status_code == 401


def test_creator_mods_list(creator_session):
    r = creator_session.get(f"{API}/creator/mods", timeout=30)
    assert r.status_code == 200
    mods = r.json()
    assert len(mods) >= 8
    assert all(m["author_id"] == creator_session.user["id"] for m in mods)
    assert all("version_count" in m and isinstance(m["version_count"], int) for m in mods)
    assert all("_id" not in m for m in mods)


def test_creator_analytics(creator_session):
    r = creator_session.get(f"{API}/creator/analytics", timeout=30)
    assert r.status_code == 200
    a = r.json()
    for k in ("total_downloads", "total_mods", "approved", "in_review", "avg_rating", "trend", "per_mod"):
        assert k in a, f"missing analytics key {k}"
    assert len(a["trend"]) == 14
    assert all(set(p.keys()) == {"day", "downloads"} for p in a["trend"])
    assert a["total_downloads"] > 0
    assert a["total_mods"] == a["approved"] + a["in_review"] or a["total_mods"] >= a["approved"]


def test_verified_creator_mod_autopublishes(creator_session):
    title = f"TEST_Auto Mod {uuid.uuid4().hex[:6]}"
    r = creator_session.post(f"{API}/creator/mods", json={
        "title": title, "summary": "auto publish test", "description": "# body",
        "game_slug": "minecraft", "category": "Utility", "tags": ["test"],
        "mod_loaders": ["Fabric"], "game_versions": ["1.21.4"], "license": "MIT",
    }, timeout=30)
    assert r.status_code == 200, r.text[:300]
    mod = r.json()
    assert mod["status"] == "approved"
    assert mod["author_verified"] is True
    assert mod["title"] == title
    # verify persisted + publicly visible
    pub = requests.get(f"{API}/mods/{mod['slug']}", timeout=30)
    assert pub.status_code == 200
    assert pub.json()["title"] == title


def test_new_user_mod_goes_to_review(new_user_session):
    title = f"TEST_Gated Mod {uuid.uuid4().hex[:6]}"
    r = new_user_session.post(f"{API}/creator/mods", json={
        "title": title, "summary": "gating test", "description": "# body",
        "game_slug": "minecraft", "category": "Utility", "tags": ["test"],
        "mod_loaders": ["Fabric"], "game_versions": ["1.21.4"],
    }, timeout=30)
    assert r.status_code == 200, r.text[:300]
    mod = r.json()
    assert mod["status"] == "in_review", f"non-verified creator auto-published: {mod['status']}"
    # not in public listing
    assert title not in [m["title"] for m in requests.get(f"{API}/mods", params={"q": "TEST_Gated"}, timeout=30).json()]


def test_create_mod_validation(creator_session):
    assert creator_session.post(f"{API}/creator/mods", json={"title": "", "game_slug": "minecraft"}, timeout=30).status_code == 400
    r = creator_session.post(f"{API}/creator/mods", json={"title": "TEST_BadGame", "game_slug": "not-a-game"}, timeout=30)
    assert r.status_code == 400
    # Minecraft-only marketplace: missing game_slug now defaults to minecraft (by design)
    r = creator_session.post(f"{API}/creator/mods", json={"title": "TEST_NoGame"}, timeout=30)
    assert r.status_code == 200, f"missing game_slug produced {r.status_code}"
    assert r.json()["game_slug"] == "minecraft"


def test_upload_version_verified_creator(creator_session):
    mods = creator_session.get(f"{API}/creator/mods", timeout=30).json()
    mod = next(m for m in mods if m["slug"] == "aether-knight")
    vnum = f"9.9.{uuid.uuid4().hex[:3]}"
    files = {"file": ("test-artifact.jar", io.BytesIO(b"PK\x03\x04TEST-JAR-CONTENT" * 100), "application/java-archive")}
    r = creator_session.post(f"{API}/creator/mods/{mod['id']}/versions", data={
        "version_number": vnum, "changelog": "TEST changelog",
        "game_versions": "1.21.4,1.20.1", "mod_loaders": "Fabric", "dependencies": "fabric-api",
    }, files=files, timeout=60)
    assert r.status_code == 200, r.text[:300]
    v = r.json()
    assert v["version_number"] == vnum
    assert v["status"] == "approved"
    assert v["game_versions"] == ["1.21.4", "1.20.1"]
    assert v["mod_loaders"] == ["Fabric"]
    assert v["file_size"] > 0 and v["compressed_size"] > 0
    # persisted + downloadable
    detail = requests.get(f"{API}/mods/aether-knight", timeout=30).json()
    assert vnum in [x["version_number"] for x in detail["versions"]]
    d = requests.get(f"{API}/download/{v['id']}", timeout=60)
    assert d.status_code == 200
    assert d.content.startswith(b"PK\x03\x04TEST-JAR-CONTENT")


def test_upload_version_new_user_in_review(new_user_session):
    mod = new_user_session.post(f"{API}/creator/mods", json={
        "title": f"TEST_VerGate {uuid.uuid4().hex[:6]}", "game_slug": "minecraft"}, timeout=30).json()
    files = {"file": ("x.jar", io.BytesIO(b"abc123"), "application/java-archive")}
    r = new_user_session.post(f"{API}/creator/mods/{mod['id']}/versions",
                              data={"version_number": "0.1.0"}, files=files, timeout=60)
    assert r.status_code == 200, r.text[:300]
    assert r.json()["status"] == "in_review"
    # unapproved version is not downloadable
    assert requests.get(f"{API}/download/{r.json()['id']}", timeout=30).status_code == 404


def test_upload_version_ownership_enforced(new_user_session):
    mods = requests.get(f"{API}/mods", timeout=30).json()
    other_id = mods[0]["id"]
    files = {"file": ("x.jar", io.BytesIO(b"abc"), "application/java-archive")}
    r = new_user_session.post(f"{API}/creator/mods/{other_id}/versions",
                              data={"version_number": "1.0.0"}, files=files, timeout=60)
    assert r.status_code == 403


def test_upload_version_unknown_mod(creator_session):
    files = {"file": ("x.jar", io.BytesIO(b"abc"), "application/java-archive")}
    r = creator_session.post(f"{API}/creator/mods/00000000-0000-0000-0000-000000000000/versions",
                             data={"version_number": "1.0.0"}, files=files, timeout=60)
    assert r.status_code == 404
