"""Restore seeded state after Playwright UI runs (removes QA reviews/comments made as
the demo accounts and resets trust tiers changed by admin-panel tests)."""
import asyncio
from dotenv import dotenv_values
from motor.motor_asyncio import AsyncIOMotorClient

env = dotenv_values("/app/backend/.env")


async def main():
    cl = AsyncIOMotorClient(env["MONGO_URL"])
    db = cl[env["DB_NAME"]]

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

    await db.users.update_one({"email": "blockfan@kivo.dev"},
                              {"$set": {"trust_tier": "new", "verified_creator": False, "role": "user",
                                        "banned": False, "shadow_banned": False}})
    await db.users.update_one({"email": "creator@kivo.dev"},
                              {"$set": {"trust_tier": "verified", "verified_creator": True}})
    await db.mods.update_many({"slug": "neon-golem-beta"}, {"$set": {"status": "in_review", "review_reason": ""}})
    await db.versions.update_many({"mod_slug": "neon-golem-beta"}, {"$set": {"status": "in_review"}})
    await db.reports.update_many({"category": {"$in": ["malware", "harassment"]}},
                                 {"$set": {"status": "open", "resolution": ""},
                                  "$unset": {"resolved_by": "", "resolved_at": ""}})
    print("users:", await db.users.count_documents({}), "mods:", await db.mods.count_documents({}),
          "open reports:", await db.reports.count_documents({"status": "open"}),
          "reviews:", await db.reviews.count_documents({}), "comments:", await db.comments.count_documents({}))
    cl.close()


asyncio.run(main())
