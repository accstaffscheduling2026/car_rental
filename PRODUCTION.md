# SwiftRide Rentals — Production Server Reference

**Business:** SwiftRide Rentals Pty Ltd
**Address:** 483 Hume Highway, Yagoona NSW 2199
**Phone:** 0434 620 086
**Deployed:** June 2026
**GitHub:** https://github.com/accstaffscheduling2026/car_rental

---

## Live URLs

| Page | URL |
|---|---|
| Public booking site | http://209.38.29.102 *(HTTP only until domain + SSL set up)* |
| Admin dashboard | http://209.38.29.102/admin |
| API health check | http://209.38.29.102/api/v1/health |

> Once a domain is pointed at this server and SSL is configured, all URLs become `https://yourdomain.com.au`

---

## Admin Login

| Field | Value |
|---|---|
| Username | `admin` |
| Password | *(stored securely — ask the developer if you need a reset)* |

To reset the admin password, SSH into the server and run:
```bash
cd /var/www/rental
node -e "require('bcrypt').hash('YOUR_NEW_PASSWORD', 12).then(h => console.log(h));"
```
Copy the output into `/var/www/rental/.env` as `ADMIN_PASSWORD_HASH=` then run `pm2 reload rental-api`.

---

## Server Details

| Setting | Value |
|---|---|
| Provider | DigitalOcean |
| Region | Sydney (SYD1) |
| Droplet name | rental-server-syd |
| IP address | 209.38.29.102 |
| OS | Ubuntu 22.04.5 LTS (Jammy Jellyfish) |
| Plan | Basic — 1 vCPU / 1 GB RAM / 25 GB SSD |
| Monthly cost | ~AUD $10 + $2 backups = ~$12/month |

## Installed Software Versions

| Software | Version |
|---|---|
| Node.js | 20.20.2 |
| npm | 10.8.2 |
| Nginx | 1.30.2 |
| PM2 | 7.0.1 |
| Certbot | 5.6.0 |
| Git | 2.34.1 |
| SQLite CLI | 3.37.2 |
| Ubuntu | 22.04.5 LTS |

---

## Server File Locations

| Item | Path |
|---|---|
| Application code | `/var/www/rental/` |
| SQLite database | `/var/www/rental/data/rental.sqlite` |
| Environment variables | `/var/www/rental/.env` |
| Frontend build | `/var/www/rental/frontend/dist/` |
| App logs (PM2) | `/var/log/rental/out.log` and `error.log` |
| Nginx access log | `/var/log/nginx/rental_access.log` |
| Nginx error log | `/var/log/nginx/rental_error.log` |
| Nginx site config | `/etc/nginx/conf.d/rental.conf` |

---

## SSH Access

```bash
# From Windows PowerShell
ssh -i "$env:USERPROFILE\.ssh\id_ed25519" root@209.38.29.102
```

SSH key is stored at: `C:\Users\DueDiligence\.ssh\id_ed25519`

---

## Useful Server Commands

```bash
# Check if app is running
pm2 status

# View live app logs
pm2 logs rental-api

# Restart the app
pm2 reload rental-api

# Check health
curl http://localhost:8080/api/v1/health

# View last 50 lines of error log
pm2 logs rental-api --lines 50 --err

# Check Nginx status
systemctl status nginx
```

---

## Deploying Updates (after pushing to GitHub)

```bash
# SSH into the server
ssh -i "$env:USERPROFILE\.ssh\id_ed25519" root@209.38.29.102

# On the server:
cd /var/www/rental
git pull
npm ci --omit=dev
cd frontend && npm ci && npm run build && cd ..
npm run migrate
pm2 reload rental-api
```

---

## Payment (Stripe)

| Setting | Value |
|---|---|
| Mode | Test (no real charges) |
| Secret key location | `/var/www/rental/.env` → `STRIPE_SECRET_KEY` |
| Publishable key location | `/var/www/rental/frontend/.env` → `VITE_STRIPE_PUBLISHABLE_KEY` |
| Webhook secret | Not yet configured |
| Test card (success) | `4242 4242 4242 4242` — expiry `12/28` — CVC `123` |
| Test card (decline) | `4000 0000 0000 0002` |

> **Before accepting real customer payments:** Switch both keys to live (`sk_live_...` / `pk_live_...`), register the webhook endpoint in Stripe Dashboard, rebuild the frontend, and reload the app.

---

## Next Steps

- [ ] Purchase domain name (recommended: VentraIP — `swiftriderentals.com.au`)
- [ ] Point domain DNS A record to `209.38.29.102`
- [ ] Run Certbot to get free HTTPS certificate
- [ ] Update `BASE_URL` and `CORS_ORIGIN` in `/var/www/rental/.env` to use the domain
- [ ] Switch Stripe keys to live keys
- [ ] Set `STRIPE_WEBHOOK_SECRET` after registering webhook in Stripe Dashboard
- [ ] Set up SMTP email (Mailgun recommended) and update `SMTP_*` vars in `.env`
- [ ] Set up UptimeRobot monitoring on `https://yourdomain.com.au/api/v1/health`
- [ ] Configure daily database backup cron job
- [ ] Change admin password from the temporary one

---

*Last updated: June 2026*
