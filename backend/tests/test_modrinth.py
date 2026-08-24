"""Iteration 3 (Modrinth-structure) backend tests:
follow/favorite/bookmark, /me/library, project edit (PUT), gallery upload,
notifications (incl. moderation notify), collections CRUD, organizations,
visibility (private/unlisted hidden from listing but reachable directly).
"""
import io
import uuid

import pytest
import requests

from conftest import API

QA_TAG = "TEST_QA3"
created_mod_ids = []
created_collection_ids = []


def _create_project(session, title, visibility="public", item_type="Mod"):
    r = session.post(f"{API}/creator/mods", json={
        "title": title, "summary": "QA iteration3 project", "item_type": item_type,
        "rarity": "Rare", "visibility": visibility, "tags": [QA_TAG],
        "game_versions": ["1.21"], "mod_loaders": ["Fabric"], "license": "MIT",
    }, timeout=30)
    assert r.status_code == 200, f"create failed {r.status_code} {r.text[:300]}"
    data = r.json()
    created_mod_ids.append(data["id"])
    return data


# --------------------------------------------------------------- interactions
class TestInteractions:
    def test_follow_toggle_and_persist(self, creator_session):
        r1 = creator_session.post(f"{API}/mods/aether-knight/follow", timeout=30)
        assert r1.status_code == 200
        d1 = r1.json()
        assert set(["active", "count"]).issubset(d1.keys())
        lib = creator_session.get(f"{API}/me/library", timeout=30).json()
        mod = creator_session.get(f"{API}/mods/aether-knight", timeout=30).json()
        if d1["active"]:
            assert mod["id"] in lib["ids"]["following"]
        # toggle back
        r2 = creator_session.post(f"{API}/mods/aether-knight/follow", timeout=30)
        assert r2.status_code == 200
        assert r2.json()["active"] != d1["active"]
        lib2 = creator_session.get(f"{API}/me/library", timeout=30).json()
        assert (mod["id"] in lib2["ids"]["following"]) == r2.json()["active"]

    def test_favorite_and_bookmark_toggle(self, creator_session):
        mod = creator_session.get(f"{API}/mods/shadow-ninja", timeout=30).json()
        for field, key in (("favorite", "favorites"), ("bookmark", "bookmarks")):
            r = creator_session.post(f"{API}/mods/shadow-ninja/{field}", timeout=30)
            assert r.status_code == 200, f"{field}: {r.status_code}"
            active = r.json()["active"]
            lib = creator_session.get(f"{API}/me/library", timeout=30).json()
            assert (mod["id"] in lib["ids"][key]) == active
            # revert
            back = creator_session.post(f"{API}/mods/shadow-ninja/{field}", timeout=30)
            assert back.json()["active"] != active

    def test_favorite_count_increments(self, creator_session):
        before = creator_session.get(f"{API}/mods/ember-fox", timeout=30).json().get("favorites_count", 0)
        r = creator_session.post(f"{API}/mods/ember-fox/favorite", timeout=30)
        assert r.status_code == 200 and r.json()["active"] is True
        after = creator_session.get(f"{API}/mods/ember-fox", timeout=30).json().get("favorites_count", 0)
        assert after == before + 1, f"favorites_count {before} -> {after}"
        creator_session.post(f"{API}/mods/ember-fox/favorite", timeout=30)

    def test_follow_requires_auth(self):
        r = requests.post(f"{API}/mods/aether-knight/follow", timeout=30)
        assert r.status_code in (401, 403)

    def test_follow_unknown_slug_404(self, creator_session):
        r = creator_session.post(f"{API}/mods/does-not-exist-xyz/follow", timeout=30)
        assert r.status_code == 404

    def test_library_requires_auth(self):
        assert requests.get(f"{API}/me/library", timeout=30).status_code in (401, 403)


# ----------------------------------------------------------------- visibility
class TestVisibility:
    def test_private_hidden_from_listing_but_owner_can_open(self, creator_session, staff_sessions):
        p = _create_project(creator_session, f"TEST_QA3 Private {uuid.uuid4().hex[:5]}", visibility="private")
        assert p["visibility"] == "private"
        listing = requests.get(f"{API}/mods?limit=100", timeout=30).json()
        assert p["slug"] not in [m["slug"] for m in listing], "private project leaked in /api/mods"
        # owner can open
        r = creator_session.get(f"{API}/mods/{p['slug']}", timeout=30)
        assert r.status_code == 200 and r.json()["slug"] == p["slug"]
        # anonymous direct link -- documents current behaviour
        anon = requests.get(f"{API}/mods/{p['slug']}", timeout=30)
        assert anon.status_code in (200, 404)
        if anon.status_code == 200:
            pytest.fail("PRIVATE project is readable anonymously via direct link GET /api/mods/{slug}")

    def test_unlisted_hidden_from_listing_reachable_by_link(self, creator_session):
        p = _create_project(creator_session, f"TEST_QA3 Unlisted {uuid.uuid4().hex[:5]}", visibility="unlisted")
        assert p["visibility"] == "unlisted"
        listing = requests.get(f"{API}/mods?limit=100", timeout=30).json()
        assert p["slug"] not in [m["slug"] for m in listing], "unlisted project leaked in /api/mods"
        anon = requests.get(f"{API}/mods/{p['slug']}", timeout=30)
        assert anon.status_code == 200, "unlisted must be reachable by direct link"

    def test_public_project_appears_in_listing(self, creator_session):
        p = _create_project(creator_session, f"TEST_QA3 Public {uuid.uuid4().hex[:5]}")
        listing = requests.get(f"{API}/mods?limit=100", timeout=30).json()
        assert p["slug"] in [m["slug"] for m in listing]

    def test_invalid_visibility_falls_back_public(self, creator_session):
        r = creator_session.post(f"{API}/creator/mods", json={
            "title": f"TEST_QA3 BadVis {uuid.uuid4().hex[:5]}", "item_type": "Mod",
            "rarity": "Common", "visibility": "nonsense", "tags": [QA_TAG]}, timeout=30)
        assert r.status_code == 200
        created_mod_ids.append(r.json()["id"])
        assert r.json()["visibility"] == "public"


# ---------------------------------------------------------------- project edit
class TestProjectEdit:
    def test_edit_fields_persist(self, creator_session):
        p = _create_project(creator_session, f"TEST_QA3 Edit {uuid.uuid4().hex[:5]}")
        payload = {"name": "TEST_QA3 Renamed", "summary": "edited summary",
                   "description": "# Hello\nmarkdown body", "license": "GPL-3.0",
                   "visibility": "unlisted", "tags": [QA_TAG, "edited"],
                   "monetization": True, "icon": "https://example.com/i.png"}
        r = creator_session.put(f"{API}/creator/mods/{p['id']}", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["title"] == "TEST_QA3 Renamed"
        assert d["summary"] == "edited summary"
        assert d["license"] == "GPL-3.0"
        assert d["visibility"] == "unlisted"
        assert d["monetization"] is True
        assert "edited" in d["tags"]
        assert "_id" not in d
        # GET verifies persistence
        g = creator_session.get(f"{API}/mods/{d['slug']}", timeout=30).json()
        assert g["title"] == "TEST_QA3 Renamed"
        assert g["description"].startswith("# Hello")
        assert g["monetization"] is True

    def test_edit_forbidden_for_other_user(self, creator_session, new_user_session):
        p = _create_project(creator_session, f"TEST_QA3 Perm {uuid.uuid4().hex[:5]}")
        r = new_user_session.put(f"{API}/creator/mods/{p['id']}", json={"summary": "hax"}, timeout=30)
        assert r.status_code == 403

    def test_edit_unknown_id_404(self, creator_session):
        r = creator_session.put(f"{API}/creator/mods/{uuid.uuid4()}", json={"summary": "x"}, timeout=30)
        assert r.status_code == 404

    def test_gallery_upload_and_serve(self, creator_session):
        p = _create_project(creator_session, f"TEST_QA3 Gallery {uuid.uuid4().hex[:5]}")
        png = (b"\x89PNG\r\n\x1a\n" + b"\x00" * 64)
        r = creator_session.post(f"{API}/creator/mods/{p['id']}/gallery",
                                 files={"file": ("shot.png", io.BytesIO(png), "image/png")}, timeout=60)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["url"].startswith("/api/gallery/")
        assert d["url"] in d["gallery"]
        served = requests.get(f"{API}{d['url'][4:]}", timeout=30)
        assert served.status_code == 200 and len(served.content) == len(png)
        fresh = creator_session.get(f"{API}/mods/{p['slug']}", timeout=30).json()
        assert d["url"] in fresh["gallery"]

    def test_gallery_upload_forbidden_other_user(self, creator_session, new_user_session):
        p = _create_project(creator_session, f"TEST_QA3 GalPerm {uuid.uuid4().hex[:5]}")
        r = new_user_session.post(f"{API}/creator/mods/{p['id']}/gallery",
                                  files={"file": ("x.png", io.BytesIO(b"123"), "image/png")}, timeout=60)
        assert r.status_code == 403


# --------------------------------------------------------------- notifications
class TestNotifications:
    def test_notifications_shape(self, creator_session):
        r = creator_session.get(f"{API}/notifications", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d["notifications"], list) and isinstance(d["unread"], int)

    def test_moderation_creates_owner_notification(self, creator_session, staff_sessions):
        p = _create_project(creator_session, f"TEST_QA3 Moderate {uuid.uuid4().hex[:5]}")
        mod_staff = staff_sessions.get("ts_moderator") or staff_sessions.get("content_reviewer")
        r = mod_staff.post(f"{API}/admin/mods/{p['id']}/moderate",
                           json={"action": "reject", "reason": "QA notify test"}, timeout=30)
        assert r.status_code == 200 and r.json()["status"] == "rejected"
        notes = creator_session.get(f"{API}/notifications", timeout=30).json()["notifications"]
        match = [n for n in notes if p["title"] in n["text"]]
        assert match, "owner did not receive a notification after moderation"
        assert match[0]["read"] is False
        assert match[0]["link"] == f"/item/{p['slug']}"
        assert "QA notify test" in match[0]["text"]

    def test_read_all_clears_unread(self, creator_session):
        assert creator_session.post(f"{API}/notifications/read-all", timeout=30).status_code == 200
        assert creator_session.get(f"{API}/notifications", timeout=30).json()["unread"] == 0

    def test_notifications_requires_auth(self):
        assert requests.get(f"{API}/notifications", timeout=30).status_code in (401, 403)


# ----------------------------------------------------------------- collections
class TestCollections:
    def test_create_list_get_and_items(self, creator_session):
        name = f"TEST_QA3 Coll {uuid.uuid4().hex[:5]}"
        r = creator_session.post(f"{API}/collections", json={"name": name, "description": "qa"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        col = r.json()
        created_collection_ids.append(col["id"])
        assert col["name"] == name and col["mod_ids"] == [] and "_id" not in col
        listed = creator_session.get(f"{API}/collections", timeout=30).json()
        target = [c for c in listed if c["id"] == col["id"]]
        assert target and target[0]["count"] == 0
        mod = requests.get(f"{API}/mods/aether-knight", timeout=30).json()
        add = creator_session.post(f"{API}/collections/{col['id']}/items", json={"mod_id": mod["id"]}, timeout=30)
        assert add.status_code == 200 and add.json() == {"active": True, "count": 1}
        detail = creator_session.get(f"{API}/collections/{col['id']}", timeout=30).json()
        assert [m["slug"] for m in detail["mods"]] == ["aether-knight"]
        rem = creator_session.post(f"{API}/collections/{col['id']}/items", json={"mod_id": mod["id"]}, timeout=30)
        assert rem.json() == {"active": False, "count": 0}

    def test_create_collection_requires_name(self, creator_session):
        assert creator_session.post(f"{API}/collections", json={"name": "  "}, timeout=30).status_code == 400

    def test_collection_isolated_per_owner(self, creator_session, new_user_session):
        r = creator_session.post(f"{API}/collections", json={"name": f"TEST_QA3 Priv {uuid.uuid4().hex[:5]}"}, timeout=30)
        cid = r.json()["id"]
        created_collection_ids.append(cid)
        assert new_user_session.get(f"{API}/collections/{cid}", timeout=30).status_code == 404

    def test_collections_requires_auth(self):
        assert requests.get(f"{API}/collections", timeout=30).status_code in (401, 403)


# --------------------------------------------------------------- organizations
class TestOrganizations:
    def test_create_and_list_org(self, creator_session):
        name = f"TEST_QA3 Org {uuid.uuid4().hex[:5]}"
        r = creator_session.post(f"{API}/organizations", json={"name": name}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        org = r.json()
        assert org["name"] == name and org["slug"] and org["members"][0]["role"] == "owner"
        orgs = creator_session.get(f"{API}/organizations", timeout=30).json()
        assert name in [o["name"] for o in orgs]

    def test_org_requires_name(self, creator_session):
        assert creator_session.post(f"{API}/organizations", json={}, timeout=30).status_code == 400


# ------------------------------------------------------------------- teardown
@pytest.fixture(scope="module", autouse=True)
def _cleanup(request):
    yield
    import sys
    import asyncio
    from pathlib import Path
    sys.path.append(str(Path(__file__).parents[1]))
    from server import db, engine

    async def run():
        await db.mods.delete_many({"tags": QA_TAG})
        await db.mods.delete_many({"title": {"$regex": "^TEST_QA3"}})
        await db.collections.delete_many({"name": {"$regex": "^TEST_QA3"}})
        await db.organizations.delete_many({"name": {"$regex": "^TEST_QA3"}})
        await db.notifications.delete_many({"text": {"$regex": "TEST_QA3"}})
        await db.users.delete_many({"email": {"$regex": "^test_newuser_"}})
        await engine.dispose()

    asyncio.run(run())
