import asyncio
import os
import shutil
from pathlib import Path
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# We can import db and models from server
from server import db, UPLOAD_DIR

async def clean_db():
    print("Connecting to database and cleaning test data...")
    
    # 1. Clear files
    if UPLOAD_DIR.exists():
        print(f"Cleaning upload directory: {UPLOAD_DIR}")
        for path in UPLOAD_DIR.iterdir():
            try:
                if path.is_file():
                    path.unlink()
                elif path.is_dir():
                    shutil.rmtree(path)
            except Exception as e:
                print(f"Failed to delete {path}: {e}")
                
    # 2. Clear collections
    print("Deleting test mods, versions, and comments...")
    await db.mods.delete_many({})
    await db.versions.delete_many({})
    await db.comments.delete_many({})
    await db.reports.delete_many({})
    await db.organizations.delete_many({})
    await db.collections.delete_many({})
    await db.audit_logs.delete_many({})
    await db.anomalies.delete_many({})
    await db.notifications.delete_many({})
    await db.download_events.delete_many({})
    await db.login_attempts.delete_many({})
    
    # 3. Clean users except admin
    admin_email = os.environ.get("ADMIN_EMAIL", "").lower().strip()
    if admin_email:
        print(f"Keeping admin user: {admin_email}")
        users = await db.users.find({}).to_list(1000)
        for u in users:
            if u.get("email", "").lower().strip() != admin_email:
                print(f"Deleting test user: {u.get('email')}")
                await db.users.delete_one({"id": u["id"]})
    else:
        print("Warning: ADMIN_EMAIL not set, skipping user deletion.")
        
    print("Database cleared of all test users, test mods, and files!")

if __name__ == "__main__":
    asyncio.run(clean_db())
