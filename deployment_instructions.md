# Qiveo Update & Deployment Instructions

Follow these instructions to push the recent changes to your live VPS and restart the necessary services.

## 1. Uploading the Code
If you are developing locally, upload the modified files to your VPS. Ensure the following files are copied over to your VPS directory (e.g. via FTP or `git pull`):
- `backend/server.py`
- `frontend/src/pages/Client.jsx`
- `frontend/src/pages/admin/AdminLayout.jsx`
- `frontend/src/pages/admin/AdminClientConfig.jsx`
- `frontend/src/App.js`
- `frontend/src/components/qiveo/Navbar.jsx`
- `frontend/public/qiveo-client-hero.jpg`

## 2. Rebuild the Frontend
Once the code is on your VPS, you need to compile the React frontend for production.
Navigate to your `frontend` directory and run:

```bash
cd /path/to/kivo-main/frontend
npm install   # (Just in case)
npm run build
```

This will generate the optimized static files in `frontend/build/`.

## 3. Restart the Python Backend
Because we added new database models (`SQLClientVersion`, `SQLClientGallery`) and new API endpoints to `server.py`, you **must** restart the Python backend. The backend will automatically create the new SQLite database tables when it starts up.

Depending on how you are running your backend (e.g., `pm2`, `systemd`, or `tmux`), restart it. For example, if using PM2:

```bash
pm2 restart qiveo-backend
```

*If you run it directly via Uvicorn/Python in a tmux session, kill it (Ctrl+C) and start it again:*
```bash
cd /path/to/kivo-main/backend
source venv/bin/activate  # (If you are using a virtual environment)
python server.py
```

## 4. Verify on Production
1. Go to `https://your-website.com/admin` and log in with your admin account.
2. Click on the new **Client Mod** tab in the sidebar.
3. Try uploading a test `.jar` file and assigning it a version.
4. Try uploading a screenshot image to the gallery.
5. Navigate to `https://your-website.com/client` and verify the download button works and the gallery image appears!

## 5. Note on File Storage
The uploaded `.jar` files and gallery screenshots will be stored securely inside:
`/path/to/kivo-main/backend/uploads/client/`
Make sure this directory is writable by your Python process, and do **not** delete it by accident during future updates.
