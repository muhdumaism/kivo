"""Module: admin/staff panel — overview, review queue + moderation, diff, reports, users/trust, audit, anomalies."""
import uuid

import requests
from conftest import API


def test_overview_counts(admin_session):
    r = admin_session.get(f"{API}/admin/overview", timeout=30)
    assert r.status_code == 200
    o = r.json()
    for k in ("pending_mods", "pending_versions", "open_reports", "critical_reports",
              "total_users", "banned_users", "total_mods", "total_downloads"):
        assert k in o and isinstance(o[k], int), f"bad key {k}"
    assert o["total_users"] >= 6
    assert o["total_mods"] >= 9
    assert o["total_downloads"] > 0


def test_queue_shape(admin_session):
    r = admin_session.get(f"{API}/admin/queue", timeout=30)
    assert r.status_code == 200
    q = r.json()
    assert isinstance(q["mods"], list) and isinstance(q["versions"], list)
    assert all(m["status"] == "in_review" for m in q["mods"])
    assert all(v["status"] == "in_review" for v in q["versions"])


def test_version_diff(admin_session):
    q = admin_session.get(f"{API}/admin/queue", timeout=30).json()
    assert q["versions"], "no pending versions to diff"
    vid = q["versions"][0]["id"]
    r = admin_session.get(f"{API}/admin/versions/{vid}/diff", timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert d["current"]["id"] == vid
    assert "previous" in d
    assert admin_session.get(f"{API}/admin/versions/bogus-id/diff", timeout=30).status_code == 404


def test_moderate_mod_approve_flow(admin_session, new_user_session):
    """Create in_review mod as a new user, approve it as staff, confirm it goes live + audited."""
    title = f"TEST_ApproveMe {uuid.uuid4().hex[:6]}"
    mod = new_user_session.post(f"{API}/creator/mods", json={
        "title": title, "summary": "approve flow", "game_slug": "minecraft"}, timeout=30).json()
    assert mod["status"] == "in_review"
    # in queue
    q = admin_session.get(f"{API}/admin/queue", timeout=30).json()
    assert mod["id"] in [m["id"] for m in q["mods"]]

    r = admin_session.post(f"{API}/admin/mods/{mod['id']}/moderate",
                           json={"action": "approve", "reason": "looks good"}, timeout=30)
    assert r.status_code == 200
    assert r.json()["status"] == "approved"
    # gone from queue, live publicly
    q2 = admin_session.get(f"{API}/admin/queue", timeout=30).json()
    assert mod["id"] not in [m["id"] for m in q2["mods"]]
    pub = requests.get(f"{API}/mods/{mod['slug']}", timeout=30)
    assert pub.status_code == 200 and pub.json()["status"] == "approved"
    # audited
    logs = admin_session.get(f"{API}/admin/audit", timeout=30).json()
    assert any(l["action"] == "mod_approve" and l["target_id"] == mod["id"] for l in logs)


def test_moderate_mod_other_actions(admin_session, new_user_session):
    for action, expected in [("reject", "rejected"), ("request_changes", "changes_requested"), ("quarantine", "quarantined")]:
        mod = new_user_session.post(f"{API}/creator/mods", json={
            "title": f"TEST_{action} {uuid.uuid4().hex[:6]}", "game_slug": "minecraft"}, timeout=30).json()
        r = admin_session.post(f"{API}/admin/mods/{mod['id']}/moderate",
                               json={"action": action, "reason": f"TEST reason for {action}"}, timeout=30)
        assert r.status_code == 200, r.text[:200]
        assert r.json()["status"] == expected
        # not publicly listed
        assert mod["slug"] not in [m["slug"] for m in requests.get(f"{API}/mods", timeout=30).json()]


def test_moderate_invalid_action_and_404(admin_session):
    r = admin_session.post(f"{API}/admin/mods/any/moderate", json={"action": "explode"}, timeout=30)
    assert r.status_code == 422
    r = admin_session.post(f"{API}/admin/mods/00000000-0000-0000-0000-000000000000/moderate",
                           json={"action": "approve"}, timeout=30)
    assert r.status_code == 404


def test_moderate_version_approve(admin_session, new_user_session):
    import io
    mod = new_user_session.post(f"{API}/creator/mods", json={
        "title": f"TEST_VerMod {uuid.uuid4().hex[:6]}", "game_slug": "minecraft"}, timeout=30).json()
    files = {"file": ("v.jar", io.BytesIO(b"VERSIONBODY"), "application/java-archive")}
    v = new_user_session.post(f"{API}/creator/mods/{mod['id']}/versions",
                              data={"version_number": "1.0.0"}, files=files, timeout=60).json()
    r = admin_session.post(f"{API}/admin/versions/{v['id']}/moderate",
                           json={"action": "approve", "reason": "ok"}, timeout=30)
    assert r.status_code == 200 and r.json()["status"] == "approved"
    d = requests.get(f"{API}/download/{v['id']}", timeout=60)
    assert d.status_code == 200 and d.content == b"VERSIONBODY"


def test_staff_pick_toggle(admin_session):
    mod = requests.get(f"{API}/mods", params={"q": "Ember Fox"}, timeout=30).json()[0]
    before = mod["staff_pick"]
    r = admin_session.post(f"{API}/admin/mods/{mod['id']}/staff-pick", timeout=30)
    assert r.status_code == 200
    assert r.json()["staff_pick"] is (not before)
    r2 = admin_session.post(f"{API}/admin/mods/{mod['id']}/staff-pick", timeout=30)
    assert r2.json()["staff_pick"] is before


def test_reports_list_and_sla(admin_session):
    r = admin_session.get(f"{API}/admin/reports", timeout=30)
    assert r.status_code == 200
    reports = r.json()
    assert len(reports) >= 2
    cats = [x["category"] for x in reports]
    assert "malware" in cats and "harassment" in cats
    mal = next(x for x in reports if x["category"] == "malware")
    assert mal["priority"] == "critical"
    assert mal["sla_deadline"]
    assert all("_id" not in x for x in reports)
    # status filter
    open_r = admin_session.get(f"{API}/admin/reports", params={"status": "open"}, timeout=30).json()
    assert all(x["status"] == "open" for x in open_r)


def test_report_create_and_resolve(admin_session, creator_session):
    r = creator_session.post(f"{API}/reports", json={
        "target_type": "mod", "target_id": "some-mod", "category": "spam",
        "reason": "TEST spam report"}, timeout=30)
    assert r.status_code == 200
    rep = r.json()
    assert rep["status"] == "open" and rep["priority"] == "normal" and rep["sla_deadline"]

    res = admin_session.post(f"{API}/admin/reports/{rep['id']}/resolve",
                             json={"status": "resolved", "resolution": "TEST handled"}, timeout=30)
    assert res.status_code == 200 and res.json()["status"] == "resolved"
    fetched = next(x for x in admin_session.get(f"{API}/admin/reports", timeout=30).json() if x["id"] == rep["id"])
    assert fetched["status"] == "resolved" and fetched["resolution"] == "TEST handled"
    assert fetched.get("resolved_by")

    # dismiss path
    r2 = creator_session.post(f"{API}/reports", json={
        "target_type": "mod", "target_id": "m2", "category": "other", "reason": "TEST dismiss"}, timeout=30).json()
    d = admin_session.post(f"{API}/admin/reports/{r2['id']}/resolve", json={"status": "dismissed"}, timeout=30)
    assert d.status_code == 200 and d.json()["status"] == "dismissed"
    assert admin_session.post(f"{API}/admin/reports/nope/resolve", json={}, timeout=30).status_code == 404


def test_reports_require_auth():
    assert requests.post(f"{API}/reports", json={
        "target_type": "mod", "target_id": "x", "category": "spam", "reason": "y"}, timeout=30).status_code == 401


def test_users_list_and_trust_updates(admin_session, new_user_session):
    users = admin_session.get(f"{API}/admin/users", timeout=30).json()
    assert len(users) >= 6
    assert all("password_hash" not in u and "_id" not in u for u in users)
    target = next(u for u in users if u["id"] == new_user_session.user["id"])
    assert target["trust_tier"] == "new"

    uid = target["id"]
    r = admin_session.put(f"{API}/admin/users/{uid}/trust", json={"trust_tier": "established"}, timeout=30)
    assert r.status_code == 200 and r.json()["trust_tier"] == "established"
    r = admin_session.put(f"{API}/admin/users/{uid}/trust", json={"verified_creator": True}, timeout=30)
    assert r.json()["verified_creator"] is True
    r = admin_session.put(f"{API}/admin/users/{uid}/trust", json={"shadow_banned": True}, timeout=30)
    assert r.json()["shadow_banned"] is True
    # super_admin can set role
    r = admin_session.put(f"{API}/admin/users/{uid}/trust", json={"role": "support_agent"}, timeout=30)
    assert r.json()["role"] == "support_agent"
    # revert
    admin_session.put(f"{API}/admin/users/{uid}/trust", json={
        "role": "user", "trust_tier": "new", "verified_creator": False, "shadow_banned": False}, timeout=30)
    # search
    s = admin_session.get(f"{API}/admin/users", params={"q": "creator@kivo.dev"}, timeout=30).json()
    assert len(s) == 1 and s[0]["email"] == "creator@kivo.dev"
    # invalid trust tier ignored
    r = admin_session.put(f"{API}/admin/users/{uid}/trust", json={"trust_tier": "godmode"}, timeout=30)
    assert r.status_code == 200 and r.json()["trust_tier"] != "godmode"
    assert admin_session.put(f"{API}/admin/users/nope/trust", json={"trust_tier": "new"}, timeout=30).status_code == 404


def test_ban_blocks_login_then_unban(admin_session):
    email = f"test_ban_{uuid.uuid4().hex[:8]}@kivoqa.io"
    reg = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "TestPass!2026", "name": "TEST_Ban"}, timeout=30).json()
    uid = reg["user"]["id"]
    tok = reg["token"]
    assert admin_session.put(f"{API}/admin/users/{uid}/trust", json={"banned": True}, timeout=30).json()["banned"] is True
    assert requests.post(f"{API}/auth/login", json={"email": email, "password": "TestPass!2026"}, timeout=30).status_code == 403
    assert requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {tok}"}, timeout=30).status_code == 403
    admin_session.put(f"{API}/admin/users/{uid}/trust", json={"banned": False}, timeout=30)
    assert requests.post(f"{API}/auth/login", json={"email": email, "password": "TestPass!2026"}, timeout=30).status_code == 200


def test_revoke_sessions_invalidates_token(admin_session):
    email = f"test_rev_{uuid.uuid4().hex[:8]}@kivoqa.io"
    reg = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "TestPass!2026", "name": "TEST_Rev"}, timeout=30).json()
    tok, uid = reg["token"], reg["user"]["id"]
    r = admin_session.post(f"{API}/admin/users/{uid}/revoke-sessions", timeout=30)
    assert r.status_code == 200 and r.json()["ok"] is True
    after = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {tok}"}, timeout=30)
    assert after.status_code == 401, "token still valid after revoke-sessions (revocation not enforced)"


def test_audit_log_immutable_shape(admin_session):
    logs = admin_session.get(f"{API}/admin/audit", timeout=30).json()
    assert len(logs) > 0
    l = logs[0]
    for k in ("id", "actor_id", "actor_name", "actor_role", "action", "target_type", "target_id", "created_at"):
        assert k in l, f"audit entry missing {k}"
    assert "_id" not in l
    # newest first
    ts = [x["created_at"] for x in logs]
    assert ts == sorted(ts, reverse=True)
    # no mutation routes exposed
    assert admin_session.delete(f"{API}/admin/audit/{l['id']}", timeout=30).status_code in (404, 405)


def test_anomalies(admin_session):
    r = admin_session.get(f"{API}/admin/anomalies", timeout=30)
    assert r.status_code == 200
    a = r.json()
    for k in ("download_spikes", "signup_clusters", "vote_manipulation"):
        assert k in a and isinstance(a[k], list)
    if a["download_spikes"]:
        s = a["download_spikes"][0]
        assert {"mod", "downloads", "reviews", "ratio", "flag"} <= set(s.keys())
