# Zeabur Deployment (China Route)

This deploy path replaces Netlify for public access.

## 1. Create service on Zeabur

1. New Project
2. Connect this GitHub repo
3. Deploy with `Dockerfile` at repository root

## 2. Required environment variables

- `CHINA_ADMIN_KEY` = your strong key
- `CHINA_SESSION_DAYS` = `30` (optional)

## 3. Port

Zeabur injects `PORT` automatically.  
Docker CMD already binds to `${PORT}`.

## 4. URLs after deploy

- Dashboard: `https://<your-zeabur-domain>/`
- China login: `https://<your-zeabur-domain>/cn`
- Admin DB page: `https://<your-zeabur-domain>/api/admin/dashboard?key=<CHINA_ADMIN_KEY>`

## 5. Health check

`https://<your-zeabur-domain>/api/health`

## 6. Why this works for China better

- Single domain for page + API on Zeabur
- No cross-platform redirect/proxy chain through Netlify
