import sys
import re

# Import pymongo. If it fails, we fall back to not running it. 
try:
    from pymongo import MongoClient
except ImportError:
    print("pymongo not found")
    sys.exit(1)

GAME_CATEGORIES = {
    "minecraft": ["plugins", "server-setups", "builds", "configs", "graphics", "textures", "models", "server-jars", "skripts", "other"],
    "roblox": ["game-setups", "maps", "scripts", "vehicles", "weapons", "models", "clothing", "graphics-ui", "animations-vfx", "audio"],
    "hytale": ["plugins", "data-assets", "server-setups", "builds", "graphics", "textures", "models", "audio", "other"],
    "discord": ["bots", "graphics", "other"]
}

def slugify(text):
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def main():
    client = MongoClient("mongodb://localhost:27017")
    db = client.kivo

    total = db.mods.count_documents({})
    print(f"Total mods to check: {total}")
    
    migrated = 0
    manual_review = 0
    
    with open("manual_review_required.log", "w") as log_file:
        for mod in db.mods.find({}):
            game = mod.get("game_slug", "minecraft")
            item_type = mod.get("item_type")
            category = mod.get("category")
            
            valid_cats = GAME_CATEGORIES.get(game, [])
            new_cat = None
            
            # 1. If category exists and is valid, keep it
            if category and category in valid_cats:
                new_cat = category
            elif category and slugify(category) in valid_cats:
                new_cat = slugify(category)
            # 2. Try inferring from item_type
            elif item_type:
                slug_type = slugify(item_type)
                if slug_type in valid_cats:
                    new_cat = slug_type
                elif slug_type == "mod":
                    pass # can't map reliably
            
            if new_cat:
                db.mods.update_one(
                    {"_id": mod["_id"]},
                    {
                        "$set": {"category": new_cat},
                        "$unset": {"item_type": ""}
                    }
                )
                migrated += 1
            else:
                manual_review += 1
                log_file.write(f"ID: {mod.get('id')} | Title: {mod.get('title')} | Game: {game} | Old Type: {item_type} | Old Cat: {category}\\n")
                if "other" in valid_cats:
                    db.mods.update_one(
                        {"_id": mod["_id"]},
                        {
                            "$set": {"category": "other"},
                            "$unset": {"item_type": ""}
                        }
                    )
                else:
                    db.mods.update_one({"_id": mod["_id"]}, {"$unset": {"item_type": ""}})
                    
    print(f"Migrated: {migrated}")
    print(f"Requires Manual Review: {manual_review} (logged to manual_review_required.log)")

if __name__ == "__main__":
    main()
