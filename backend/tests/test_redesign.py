"""Redesign-iteration tests: demo auth, item_type/rarity filters, marketplace fields."""
import requests
import pytest
from conftest import API


# ---------------- demo one-tap auth ----------------
class TestDemoAuth:
    @pytest.mark.parametrize("provider,email,name", [
        ("google", "creator@qiveo.dev", "AuroraBlocks"),
        ("discord", "blockfan@qiveo.dev", "BlockFan"),
        ("staff", "admin@qiveo.dev", None),
    ])
    def test_demo_login(self, provider, email, name):
        r = requests.post(f"{API}/auth/demo", json={"provider": provider}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert isinstance(d.get("token"), str) and len(d["token"]) > 10
        assert d["provider"] == provider
        assert d["user"]["email"] == email
        if name:
            assert d["user"]["name"] == name
        assert "_id" not in d["user"]
        # token works on /auth/me
        me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {d['token']}"}, timeout=30)
        assert me.status_code == 200
        assert me.json()["email"] == email

    def test_demo_google_is_verified_creator(self):
        d = requests.post(f"{API}/auth/demo", json={"provider": "google"}, timeout=30).json()
        assert d["user"]["verified_creator"] is True

    def test_demo_staff_is_super_admin(self):
        d = requests.post(f"{API}/auth/demo", json={"provider": "staff"}, timeout=30).json()
        assert d["user"]["role"] == "super_admin"

    def test_demo_discord_is_regular_user(self):
        d = requests.post(f"{API}/auth/demo", json={"provider": "discord"}, timeout=30).json()
        assert d["user"]["role"] == "user"

    def test_demo_unknown_provider_falls_back(self):
        r = requests.post(f"{API}/auth/demo", json={"provider": "myspace"}, timeout=30)
        # documented behaviour: falls back to creator account
        assert r.status_code == 200
        assert r.json()["user"]["email"] == "creator@qiveo.dev"

    def test_demo_empty_body(self):
        r = requests.post(f"{API}/auth/demo", json={}, timeout=30)
        assert r.status_code == 200
        assert r.json()["provider"] == "google"

    def test_discord_user_cannot_access_admin(self):
        d = requests.post(f"{API}/auth/demo", json={"provider": "discord"}, timeout=30).json()
        h = {"Authorization": f"Bearer {d['token']}"}
        for path in ["overview", "queue", "reports", "users", "audit", "anomalies"]:
            r = requests.get(f"{API}/admin/{path}", headers=h, timeout=30)
            assert r.status_code == 403, f"/admin/{path} -> {r.status_code}"

    def test_admin_endpoints_require_token(self):
        for path in ["overview", "queue", "reports", "users", "audit", "anomalies"]:
            r = requests.get(f"{API}/admin/{path}", timeout=30)
            assert r.status_code in (401, 403), f"/admin/{path} -> {r.status_code}"


# ---------------- marketplace item fields & filters ----------------
class TestMarketplaceListing:
    def test_list_returns_marketplace_fields(self):
        r = requests.get(f"{API}/mods", params={"limit": 60}, timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 10, f"only {len(items)} items"
        for it in items:
            if it["slug"].startswith("test-"):
                continue  # QA-created fixtures
            assert "_id" not in it
            assert it["item_type"] in ["Skin", "Character", "Build", "World", "Mod", "Collectible"], it["item_type"]
            assert it["rarity"] in ["Common", "Rare", "Epic", "Legendary"], it.get("rarity")
            assert it.get("pricing") == "free"
            assert isinstance(it["downloads"], int)
            assert it["icon"].startswith("http")
            assert it["status"] == "approved"

    @pytest.mark.parametrize("itype", ["Skin", "Character", "Build", "World", "Mod", "Collectible"])
    def test_item_type_filter(self, itype):
        r = requests.get(f"{API}/mods", params={"item_type": itype, "limit": 60}, timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert all(i["item_type"] == itype for i in items)

    @pytest.mark.parametrize("rar", ["Common", "Rare", "Epic", "Legendary"])
    def test_rarity_filter(self, rar):
        r = requests.get(f"{API}/mods", params={"rarity": rar, "limit": 60}, timeout=30)
        assert r.status_code == 200
        assert all(i["rarity"] == rar for i in r.json())

    def test_combined_filter(self):
        r = requests.get(f"{API}/mods", params={"item_type": "Skin", "rarity": "Legendary"}, timeout=30)
        assert r.status_code == 200
        for i in r.json():
            assert i["item_type"] == "Skin" and i["rarity"] == "Legendary"

    def test_unknown_filter_returns_empty(self):
        r = requests.get(f"{API}/mods", params={"item_type": "Nonexistent"}, timeout=30)
        assert r.status_code == 200
        assert r.json() == []

    def test_staff_pick_filter(self):
        r = requests.get(f"{API}/mods", params={"staff_pick": "true"}, timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        assert all(i["staff_pick"] for i in items)

    @pytest.mark.parametrize("sort", ["trending", "downloads", "rating", "newest"])
    def test_sorts(self, sort):
        r = requests.get(f"{API}/mods", params={"sort": sort, "limit": 60}, timeout=30)
        assert r.status_code == 200
        assert len(r.json()) >= 10

    def test_downloads_sort_is_descending(self):
        items = requests.get(f"{API}/mods", params={"sort": "downloads", "limit": 60}, timeout=30).json()
        dls = [i["downloads"] for i in items]
        assert dls == sorted(dls, reverse=True)

    def test_search_query(self):
        r = requests.get(f"{API}/mods", params={"q": "aether"}, timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        assert any("aether" in i["title"].lower() or "aether" in i["summary"].lower() for i in items)


class TestProductDetail:
    def test_seeded_detail(self):
        r = requests.get(f"{API}/mods/aether-knight", timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["slug"] == "aether-knight"
        assert d["item_type"] and d["rarity"]
        assert d["author_name"] == "AuroraBlocks"
        assert isinstance(d["versions"], list) and len(d["versions"]) >= 1
        assert "_id" not in d

    def test_missing_slug_404(self):
        r = requests.get(f"{API}/mods/definitely-not-real", timeout=30)
        assert r.status_code == 404

    def test_download_increments_grabs(self):
        before = requests.get(f"{API}/mods/aether-knight", timeout=30).json()
        vid = before["versions"][0]["id"]
        dl = requests.get(f"{API}/download/{vid}", timeout=60)
        assert dl.status_code == 200, f"download failed {dl.status_code} {dl.text[:200]}"
        assert len(dl.content) > 0
        after = requests.get(f"{API}/mods/aether-knight", timeout=30).json()
        assert after["downloads"] == before["downloads"] + 1

    def test_pending_item_not_in_public_list(self):
        items = requests.get(f"{API}/mods", params={"limit": 60}, timeout=30).json()
        assert "neon-golem-beta" not in [i["slug"] for i in items]


class TestSeededReviewQueue:
    def test_queue_has_neon_golem(self, admin_session):
        r = admin_session.get(f"{API}/admin/queue", timeout=30)
        assert r.status_code == 200
        d = r.json()
        slugs = [m["slug"] for m in d.get("mods", [])]
        assert "neon-golem-beta" in slugs, f"queue mods: {slugs}"

    def test_reports_seeded(self, admin_session):
        r = admin_session.get(f"{API}/admin/reports", timeout=30)
        assert r.status_code == 200
        reports = r.json()
        assert len(reports) >= 2
        assert any(x["category"] == "malware" for x in reports)

    def test_overview(self, admin_session):
        r = admin_session.get(f"{API}/admin/overview", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["total_users", "total_mods", "pending_mods", "open_reports", "critical_reports", "total_downloads"]:
            assert k in d, f"missing {k} in {list(d)}"


class TestGameHub:
    def test_minecraft_hub(self):
        r = requests.get(f"{API}/games/minecraft", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["slug"] == "minecraft"
        assert d["mod_count"] >= 10
        assert set(d.get("item_types", [])) >= {"Skin", "Character", "Build", "World", "Mod", "Collectible"}
