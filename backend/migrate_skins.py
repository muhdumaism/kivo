import asyncio
import hashlib
import time
from dotenv import load_dotenv
load_dotenv()

from server import db, SQLSkin

async def migrate():
    mods = await db.mods.find({'category': 'skins'}).to_list(length=None)
    count = 0
    for m in mods:
        if m.get('gallery') and len(m['gallery']) > 0:
            skin_url = m['gallery'][0]
            texture_hash = m['id'] 
            exists = await db.skins.find_one({'id': texture_hash})
            if not exists:
                await db.skins.insert_one(SQLSkin(
                    id=texture_hash, 
                    texture_url=skin_url, 
                    model='classic', 
                    source='qiveo', 
                    name=m['title'], 
                    qiveo_mod_id=m['id'], 
                    created_at=m.get('created_at', str(time.time()))
                ))
                count += 1
    print(f'Migrated {count} skins.')

asyncio.run(migrate())
