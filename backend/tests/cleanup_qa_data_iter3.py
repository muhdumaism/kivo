"""Iteration-3 QA cleanup: removes QA projects/collections/orgs/notifications/versions,
resets follow/favorite/bookmark state and download counters touched by the UI run,
and restores the seeded review-queue/report state.
"""
import asyncio
import sys
from pathlib import Path

# Import database and engine from server
sys.path.append(str(Path(__file__).parents[1]))
from server import db, engine

SEED_SLUGS = ["aether-knight", "shadow-ninja", "nether-gate-reforged", "amethyst-wyrm",
              "ember-fox", "piglet-001", "neon-golem-beta"]

async def main():
    qa_users = await db.users.find({"$or": [
        {"email": {"$regex": "@qiveoqa\\.io$"}},
        {"name": {"$regex": "^TEST_"}},
        {"name": {"$regex": "^QA "}},
    ]}, {"id": 1}).to_list(500)
    uids = [u["id"] for u in qa_users]

    qa_mods = await db.mods.find({"$or": [
        {"title": {"$regex": "^TEST_", "$options": "i"}},
        {"title": {"$regex": "^QA "}},
        {"tags": "TEST_QA3"},
        {"author_id": {"$in": uids}},
    ]}, {"id": 1}).to_list(500)
    mids = [m["id"] for m in qa_mods]

    print("versions removed:", (await db.versions.delete_many({"mod_id": {"$in": mids}})).deleted_count)
    print("mods removed:", (await db.mods.delete_many({"id": {"$in": mids}})).deleted_count)
    print("reviews removed:", (await db.reviews.delete_many({"$or": [{"user_id": {"$in": uids}}, {"body": {"$regex": "^TEST"}}]})).deleted_count)
    print("comments removed:", (await db.comments.delete_many({"$or": [{"user_id": {"$in": uids}}, {"body": {"$regex": "^TEST"}}]})).deleted_count)
    print("collections removed:", (await db.collections.delete_many({"name": {"$regex": "^TEST_"}})).deleted_count)
    print("organizations removed:", (await db.organizations.delete_many({"name": {"$regex": "^TEST_"}})).deleted_count)
    print("qa reports removed:", (await db.reports.delete_many({"reason": {"$regex": "^TEST", "$options": "i"}})).deleted_count)
    print("users removed:", (await db.users.delete_many({"id": {"$in": uids}})).deleted_count)

    # clear engagement arrays created by QA toggles
    await db.users.update_many({}, {"$set": {"following": [], "favorites": [], "bookmarks": []}})
    await db.mods.update_many({}, {"$set": {"favorites_count": 0}})
    await db.mods.update_many({"slug": {"$in": SEED_SLUGS}}, {"$set": {"follows": 0}})

    # recompute rating aggregates from seeded baseline
    async for m in db.mods.find({}, {"id": 1, "base_rating_sum": 1, "base_rating_count": 1}):
        revs = await db.reviews.find({"mod_id": m["id"]}, {"rating": 1}).to_list(2000)
        total_sum = m.get("base_rating_sum", 0) + sum(x["rating"] for x in revs)
        total_count = m.get("base_rating_count", 0) + len(revs)
        await db.mods.update_one({"id": m["id"]}, {"$set": {
            "rating_avg": round(total_sum / total_count, 2) if total_count else 0,
            "rating_count": total_count}})

    # restore seeded queue / report state + demo account tiers
    await db.mods.update_many({"slug": "neon-golem-beta"}, {"$set": {"status": "in_review", "review_reason": ""}})
    await db.versions.update_many({"mod_slug": "neon-golem-beta"}, {"$set": {"status": "in_review"}})
    await db.reports.update_many({"category": {"$in": ["malware", "harassment"]}},
                                 {"$set": {"status": "open", "resolution": ""},
                                  "$unset": {"resolved_by": "", "resolved_at": ""}})
    await db.users.update_one({"email": "blockfan@qiveo.dev"},
                              {"$set": {"trust_tier": "new", "verified_creator": False, "role": "user",
                                        "banned": False, "shadow_banned": False}})
    await db.users.update_one({"email": "creator@qiveo.dev"},
                              {"$set": {"trust_tier": "verified", "verified_creator": True}})

    print("FINAL -> mods:", await db.mods.count_documents({}),
          "approved:", await db.mods.count_documents({"status": "approved"}),
          "in_review:", await db.mods.count_documents({"status": "in_review"}),
          "users:", await db.users.count_documents({}),
          "open reports:", await db.reports.count_documents({"status": "open"}),
          "collections:", await db.collections.count_documents({}),
          "reviews:", await db.reviews.count_documents({}),
          "comments:", await db.comments.count_documents({}))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
