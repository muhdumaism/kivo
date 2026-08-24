# QIVEO.dev Deployment Guide

This guide describes how to deploy the QIVEO production stack (FastAPI Backend + React Frontend + MariaDB/MySQL Database) to a VPS or cloud instance.

---

## 1. Prerequisites

Ensure the following runtimes are installed on your target machine:
* **Node.js**: v18 or newer
* **Python**: v3.10 or newer (with `pip`)
* **MySQL / MariaDB**: Server v10.4+ or v8.0+

---

## 2. Database Schema Setup

1. Connect to your database engine:
   ```bash
   mysql -u root -p
   ```
2. Create a clean database named `qiveo`:
   ```sql
   CREATE DATABASE qiveo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Create a dedicated database user (optional but recommended):
   ```sql
   CREATE USER 'qiveo_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON qiveo.* TO 'qiveo_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

---

## 3. Backend Deployment

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and install packages:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Configure the production environment variables inside a `.env` file:
   ```env
   DATABASE_URL=mysql+aiomysql://qiveo_user:your_secure_password@127.0.0.1:3306/qiveo
   JWT_SECRET=generate-a-secure-random-key-here
   ADMIN_EMAIL=muhdumaism@gmail.com
   ADMIN_PASSWORD=your_admin_password
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_secret
   GOOGLE_REDIRECT_URI=https://qiveo.dev/api/auth/google/callback
   DISCORD_CLIENT_ID=your_discord_oauth_client_id
   DISCORD_CLIENT_SECRET=your_discord_oauth_secret
   DISCORD_REDIRECT_URI=https://qiveo.dev/api/auth/discord/callback
   PRODUCTION=true
   ```
4. Start the backend service using `uvicorn` (managed by `pm2` or `systemd` in production):
   ```bash
   uvicorn server:app --host 127.0.0.1 --port 8000 --workers 4
   ```

---

## 4. Frontend Deployment

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies bypass resolving conflicts:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Build the production application bundle:
   ```bash
   # If deploying backend on a separate domain, specify it. 
   # Otherwise, leave blank and it will fallback dynamically to the browser's window origin:
   REACT_APP_BACKEND_URL=https://qiveo.dev npm run build
   ```
   This generates a static, highly optimized production distribution in the `frontend/build/` directory.

---

## 5. Nginx Configuration

Configure Nginx to host the static React build and reverse-proxy API requests:

```nginx
server {
    listen 80;
    server_name qiveo.dev www.qiveo.dev;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name qiveo.dev www.qiveo.dev;

    ssl_certificate /etc/letsencrypt/live/qiveo.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/qiveo.dev/privkey.pem;

    root /var/www/qiveo/frontend/build;
    index index.html;

    # React routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # FastAPI backend API proxy
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 6. PM2 Daemon Management (Optional)

To keep the FastAPI server running persistently in the background:
```bash
npm install -g pm2
pm2 start "uvicorn server:app --host 127.0.0.1 --port 8000" --name qiveo-backend
pm2 save
pm2 startup
```
