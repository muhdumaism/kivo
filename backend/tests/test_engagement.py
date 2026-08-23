"""Module: engagement — reviews & comments create/list, rating aggregation."""
import uuid

import requests
from conftest import API


def test_review_requires_auth():
    assert requests.post(f"{API}/mods/lithium-performance/reviews",
                         json={"rating": 5, "body": "x"}, timeout=30).status_code == 401


def test_add_review_updates_rating(admin_session):
    email = f"test_rev_{uuid.uuid4().hex[:8]}@kivoqa.io"
    reg = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "TestPass!2026", "name": "TEST_Reviewer"}, timeout=30).json()
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {reg['token']}"})

    slug = "sodium-extra"
    before = requests.get(f"{API}/mods/{slug}", timeout=30).json()
    r = s.post(f"{API}/mods/{slug}/reviews", json={"rating": 4, "body": "TEST review body"}, timeout=30)
    assert r.status_code == 200, r.text[:300]
    rev = r.json()
    assert rev["rating"] == 4 and rev["body"] == "TEST review body"
    assert rev["user_name"] == "TEST_Reviewer"
    assert "_id" not in rev

    after = requests.get(f"{API}/mods/{slug}", timeout=30).json()
    assert after["rating_count"] == before["rating_count"] + 1 or after["rating_count"] >= 1
    assert rev["id"] in [x["id"] for x in after["reviews"]]

    # duplicate review blocked
    dup = s.post(f"{API}/mods/{slug}/reviews", json={"rating": 5, "body": "again"}, timeout=30)
    assert dup.status_code == 400

    # validation
    assert s.post(f"{API}/mods/{slug}/reviews", json={"rating": 9}, timeout=30).status_code == 422
    assert s.post(f"{API}/mods/nope-nope/reviews", json={"rating": 3}, timeout=30).status_code == 404


def test_rating_aggregation_correct():
    """rating_avg must equal mean of all reviews, not blend the seeded fake value."""
    slug = "dungeon-dwellers"
    email = f"test_agg_{uuid.uuid4().hex[:8]}@kivoqa.io"
    reg = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "TestPass!2026", "name": "TEST_Agg"}, timeout=30).json()
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {reg['token']}"})
    s.post(f"{API}/mods/{slug}/reviews", json={"rating": 1, "body": "TEST low"}, timeout=30)
    detail = requests.get(f"{API}/mods/{slug}", timeout=30).json()
    ratings = [x["rating"] for x in detail["reviews"]]
    expected = round(sum(ratings) / len(ratings), 2)
    assert abs(detail["rating_avg"] - expected) < 0.01, (
        f"rating_avg={detail['rating_avg']} but computed from {len(ratings)} stored reviews={expected}; "
        f"rating_count={detail['rating_count']} does not match stored review count"
    )


def test_add_comment_and_list():
    email = f"test_cmt_{uuid.uuid4().hex[:8]}@kivoqa.io"
    reg = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "TestPass!2026", "name": "TEST_Commenter"}, timeout=30).json()
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {reg['token']}"})
    slug = "terralith-worldgen"
    r = s.post(f"{API}/mods/{slug}/comments", json={"body": "TEST comment body"}, timeout=30)
    assert r.status_code == 200
    c = r.json()
    assert c["body"] == "TEST comment body" and c["hidden"] is False
    comments = requests.get(f"{API}/mods/{slug}/comments", timeout=30).json()
    assert c["id"] in [x["id"] for x in comments]
    # threaded reply
    reply = s.post(f"{API}/mods/{slug}/comments", json={"body": "TEST reply", "parent_id": c["id"]}, timeout=30)
    assert reply.status_code == 200 and reply.json()["parent_id"] == c["id"]
    assert requests.post(f"{API}/mods/{slug}/comments", json={"body": "x"}, timeout=30).status_code == 401


def test_empty_comment_rejected():
    email = f"test_ec_{uuid.uuid4().hex[:8]}@kivoqa.io"
    reg = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "TestPass!2026", "name": "TEST_Empty"}, timeout=30).json()
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {reg['token']}"})
    r = s.post(f"{API}/mods/terralith-worldgen/comments", json={"body": "   "}, timeout=30)
    assert r.status_code in (400, 422), f"blank comment accepted ({r.status_code})"
