"""Module: public/unauthenticated surface — games, mods listing, filters, search, download."""
import requests
from conftest import API


def test_games_list():
    r = requests.get(f"{API}/games", timeout=30)
    assert r.status_code == 200
    games = r.json()
    assert isinstance(games, list) and len(games) >= 1
    mc = next((g for g in games if g["slug"] == "minecraft"), None)
    assert mc is not None
    assert mc["name"] == "Minecraft"
    assert isinstance(mc["mod_count"], int) and mc["mod_count"] >= 8
    assert "_id" not in mc
    assert isinstance(mc["mod_loaders"], list)


def test_game_detail_and_404():
    r = requests.get(f"{API}/games/minecraft", timeout=30)
    assert r.status_code == 200
    assert r.json()["slug"] == "minecraft"
    assert requests.get(f"{API}/games/does-not-exist", timeout=30).status_code == 404


def test_mods_list_only_approved():
    r = requests.get(f"{API}/mods", timeout=30)
    assert r.status_code == 200
    mods = r.json()
    assert len(mods) >= 8
    assert all(m["status"] == "approved" for m in mods)
    assert all("_id" not in m for m in mods)


def test_mods_filters():
    r = requests.get(f"{API}/mods", params={"category": "Shaders"}, timeout=30)
    assert r.status_code == 200
    assert all(m["category"] == "Shaders" for m in r.json())

    r = requests.get(f"{API}/mods", params={"loader": "Fabric"}, timeout=30)
    assert r.status_code == 200 and len(r.json()) > 0
    assert all("Fabric" in m["mod_loaders"] for m in r.json())

    r = requests.get(f"{API}/mods", params={"game_version": "1.20.1"}, timeout=30)
    assert all("1.20.1" in m["game_versions"] for m in r.json())

    r = requests.get(f"{API}/mods", params={"staff_pick": "true"}, timeout=30)
    picks = r.json()
    assert len(picks) >= 3 and all(m["staff_pick"] for m in picks)


def test_mods_search_and_sort():
    r = requests.get(f"{API}/mods", params={"q": "aether"}, timeout=30)
    assert r.status_code == 200
    assert "Aether Knight" in [m["title"] for m in r.json()]

    r = requests.get(f"{API}/mods", params={"sort": "downloads"}, timeout=30)
    dls = [m["downloads"] for m in r.json()]
    assert dls == sorted(dls, reverse=True)

    # regex-injection safety
    assert requests.get(f"{API}/mods", params={"q": "((("}, timeout=30).status_code == 200


def test_mod_detail_shape():
    r = requests.get(f"{API}/mods/aether-knight", timeout=30)
    assert r.status_code == 200
    mod = r.json()
    assert mod["title"] == "Aether Knight"
    assert mod["description"].startswith("#")
    assert isinstance(mod["versions"], list) and len(mod["versions"]) >= 1
    assert isinstance(mod["reviews"], list)
    assert "1.0.0" in [v["version_number"] for v in mod["versions"]]
    assert all(v["status"] == "approved" for v in mod["versions"])
    assert requests.get(f"{API}/mods/nope-nope", timeout=30).status_code == 404


def test_comments_endpoint():
    r = requests.get(f"{API}/mods/aether-knight/comments", timeout=30)
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert requests.get(f"{API}/mods/nope-nope/comments", timeout=30).status_code == 404


def test_download_increments_count():
    detail = requests.get(f"{API}/mods/aether-knight", timeout=30).json()
    before = detail["downloads"]
    vid = detail["versions"][0]["id"]
    d = requests.get(f"{API}/download/{vid}", timeout=60)
    assert d.status_code == 200
    assert "attachment" in d.headers.get("content-disposition", "")
    assert len(d.content) > 0
    after = requests.get(f"{API}/mods/aether-knight", timeout=30).json()["downloads"]
    assert after == before + 1


def test_download_unknown_version_404():
    assert requests.get(f"{API}/download/00000000-0000-0000-0000-000000000000", timeout=30).status_code == 404


def test_unapproved_mod_detail_exposure():
    """Pending mod detail should not be publicly readable (privacy of in_review content)."""
    r = requests.get(f"{API}/mods/neon-golem-beta", timeout=30)
    assert r.status_code == 404, f"in_review mod is publicly readable (status={r.json().get('status')})"
