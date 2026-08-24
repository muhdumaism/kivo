"""Restore seeded state after Playwright UI runs (removes QA reviews/comments made as
the demo accounts and resets trust tiers changed by admin-panel tests)."""
import asyncio
from datetime import datetime, timezone, timedelta

# Import the configured database and engine from server
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parents[1]))
from server import db, engine

def now_iso():
    return datetime.now(timezone.utc).isoformat()

async def main():
    print("reviews removed:", (await db.reviews.delete_many({"body": {"$regex": "^TEST"}})).deleted_count)
    print("comments removed:", (await db.comments.delete_many({"body": {"$regex": "^TEST"}})).deleted_count)

    # reset rating aggregates to seeded baseline + remaining reviews
    async for m in db.mods.find({}, {"id": 1, "base_rating_sum": 1, "base_rating_count": 1}):
        revs = await db.reviews.find({"mod_id": m["id"]}, {"rating": 1}).to_list(2000)
        total_sum = m.get("base_rating_sum", 0) + sum(x["rating"] for x in revs)
        total_count = m.get("base_rating_count", 0) + len(revs)
        await db.mods.update_one({"id": m["id"]}, {"$set": {
            "rating_avg": round(total_sum / total_count, 2) if total_count else 0,
            "rating_count": total_count}})

    await db.users.update_one({"email": "blockfan@qiveo.dev"},
                              {"$set": {"trust_tier": "new", "verified_creator": False, "role": "user",
                                        "banned": False, "shadow_banned": False}})
    await db.users.update_one({"email": "creator@qiveo.dev"},
                              {"$set": {"trust_tier": "verified", "verified_creator": True}})
    await db.mods.update_many({"slug": "neon-golem-beta"}, {"$set": {"status": "in_review", "review_reason": ""}})
    await db.versions.update_many({"mod_slug": "neon-golem-beta"}, {"$set": {"status": "in_review"}})
    await db.reports.update_many({"category": {"$in": ["malware", "harassment"]}},
                                 {"$set": {"status": "open", "resolution": ""},
                                  "$unset": {"resolved_by": "", "resolved_at": ""}})
    
    print("users:", await db.users.count_documents({}), "mods:", await db.mods.count_documents({}),
          "open reports:", await db.reports.count_documents({"status": "open"}),
          "reviews:", await db.reviews.count_documents({}), "comments:", await db.comments.count_documents({}))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
