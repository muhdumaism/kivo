"""One-off cleanup of QA-created data; restores the seeded review-queue state."""
import asyncio
import os
from dotenv import dotenv_values
from motor.motor_asyncio import AsyncIOMotorClient

env = dotenv_values("/app/backend/.env")


async def main():
    cl = AsyncIOMotorClient(env["MONGO_URL"])
    db = cl[env["DB_NAME"]]

    qa_users = await db.users.find({"$or": [
        {"email": {"$regex": "@kivoqa\\.io$"}},
        {"name": {"$regex": "^TEST_"}},
        {"name": {"$regex": "^QA "}},
    ]}, {"id": 1}).to_list(500)
    uids = [u["id"] for u in qa_users]

    qa_mods = await db.mods.find({"$or": [
        {"title": {"$regex": "^TEST_"}},
        {"title": {"$regex": "^QA "}},
        {"author_id": {"$in": uids}},
    ]}, {"id": 1}).to_list(500)
    mids = [m["id"] for m in qa_mods]

    r = await db.versions.delete_many({"$or": [{"mod_id": {"$in": mids}}, {"version_number": {"$regex": "^(7|9)\\."}}]})
    print("versions removed:", r.deleted_count)
    print("mods removed:", (await db.mods.delete_many({"id": {"$in": mids}})).deleted_count)
    print("reviews removed:", (await db.reviews.delete_many({"user_id": {"$in": uids}})).deleted_count)
    print("comments removed:", (await db.comments.delete_many({"user_id": {"$in": uids}})).deleted_count)
    print("download_events removed:", (await db.download_events.delete_many({"mod_id": {"$in": mids}})).deleted_count)
    print("users removed:", (await db.users.delete_many({"id": {"$in": uids}})).deleted_count)
    print("qa reports removed:", (await db.reports.delete_many({"reason": {"$regex": "^TEST "}})).deleted_count)

    # recompute rating aggregates (base seeded values + remaining real reviews)
    async for m in db.mods.find({}, {"id": 1, "base_rating_sum": 1, "base_rating_count": 1}):
        revs = await db.reviews.find({"mod_id": m["id"]}, {"rating": 1}).to_list(2000)
        total_sum = m.get("base_rating_sum", 0) + sum(x["rating"] for x in revs)
        total_count = m.get("base_rating_count", 0) + len(revs)
        await db.mods.update_one({"id": m["id"]}, {"$set": {
            "rating_avg": round(total_sum / total_count, 2) if total_count else 0,
            "rating_count": total_count}})

    # restore seeded review-queue / report state
    await db.mods.update_many({"slug": "neon-golem-beta"}, {"$set": {"status": "in_review", "review_reason": ""}})
    await db.versions.update_many({"mod_slug": "neon-golem-beta"}, {"$set": {"status": "in_review"}})
    await db.reports.update_many({"category": {"$in": ["malware", "harassment"]}},
                                 {"$set": {"status": "open", "resolution": ""},
                                  "$unset": {"resolved_by": "", "resolved_at": ""}})
    print("restored seeded queue + reports")
    print("remaining mods:", await db.mods.count_documents({}), "users:", await db.users.count_documents({}))
    cl.close()


asyncio.run(main())
