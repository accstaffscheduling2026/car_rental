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
| Public booking site | https://swiftriderentals.com.au |
| Public booking site (www) | https://www.swiftriderentals.com.au |
| Admin dashboard | https://swiftriderentals.com.au/admin |
| API health check | https://swiftriderentals.com.au/api/v1/health |

All traffic is HTTPS. HTTP requests automatically redirect to HTTPS via Nginx.

---

## Domain Names

| Domain | Registrar | Status | Purpose |
|---|---|---|---|
| `swiftriderentals.com.au` | VentraIP | Active — primary | Main production domain |
| `swiftriderentals.online` | VentraIP | Active — reserve | Backup / alternative |

**DNS A records (both point to the server):**

| Record | Value |
|---|---|
| `swiftriderentals.com.au` | `209.38.29.102` |
| `www.swiftriderentals.com.au` | `209.38.29.102` |

**DNS managed at:** https://vip.ventraip.com.au → Domains → swiftriderentals.com.au → DNS

---

## SSL Certificate (HTTPS)

| Setting | Value |
|---|---|
| Provider | Let's Encrypt (free, auto-renewing) |
| Issued | June 2026 |
| Expires | 3 September 2026 |
| Auto-renewal | Certbot systemd timer — renews automatically every 90 days |
| Certificate path | `/etc/letsencrypt/live/swiftriderentals.com.au/fullchain.pem` |

To manually test renewal: `certbot renew --dry-run`

---

## Admin Login

| Field | Value |
|---|---|
| URL | https://swiftriderentals.com.au/admin |
| Username | `admin` |
| Password | *(stored securely — ask the developer if you need a reset)* |

To reset the admin password, SSH into the server and run:
```bash
cd /var/www/rental
node -e "require('./node_modules/bcrypt').hash('YOUR_NEW_PASSWORD', 12).then(h => console.log(h));"
# Copy the output into /var/www/rental/.env as ADMIN_PASSWORD_HASH=
# Then: pm2 reload rental-api
```

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
| Monthly cost | ~AUD $10 droplet + $2 backups + $2 domain = ~$14/month |

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
| Frontend Stripe key | `/var/www/rental/frontend/.env` |
| Frontend build | `/var/www/rental/frontend/dist/` |
| App logs (PM2) | `/var/log/rental/out.log` and `error.log` |
| Nginx access log | `/var/log/nginx/rental_access.log` |
| Nginx error log | `/var/log/nginx/rental_error.log` |
| Nginx site config | `/etc/nginx/conf.d/rental.conf` |
| SSL certificate | `/etc/letsencrypt/live/swiftriderentals.com.au/` |

---

## SSH Access

```bash
# From Windows PowerShell
ssh -i "$env:USERPROFILE\.ssh\id_ed25519" root@209.38.29.102
```

SSH private key location: `C:\Users\DueDiligence\.ssh\id_ed25519`
SSH public key location: `C:\Users\DueDiligence\.ssh\id_ed25519.pub`

---

## Useful Server Commands

```bash
# Check if app is running
pm2 status

# View live app logs
pm2 logs rental-api

# Reload app after code change
pm2 reload rental-api

# Check health endpoint
curl https://swiftriderentals.com.au/api/v1/health

# View last 50 lines of error log
pm2 logs rental-api --lines 50 --err

# Check Nginx status
systemctl status nginx

# Reload Nginx after config change
systemctl reload nginx

# Check SSL certificate status
certbot certificates

# Test SSL renewal (dry run — does not actually renew)
certbot renew --dry-run
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

> `pm2 reload` performs a graceful reload with zero downtime — in-flight requests complete before the process is replaced.

---

## Payment (Stripe)

| Setting | Value |
|---|---|
| Mode | **Test** (no real charges until switched to live keys) |
| Secret key location | `/var/www/rental/.env` → `STRIPE_SECRET_KEY` |
| Publishable key location | `/var/www/rental/frontend/.env` → `VITE_STRIPE_PUBLISHABLE_KEY` |
| Webhook endpoint | `https://swiftriderentals.com.au/api/v1/payments/webhook` |
| Webhook secret | Not yet configured — see next steps |
| Test card (success) | `4242 4242 4242 4242` — expiry `12/28` — CVC `123` |
| Test card (decline) | `4000 0000 0000 0002` |

**To switch to live payments:**
1. Stripe Dashboard → Developers → API keys → copy live keys
2. Update `STRIPE_SECRET_KEY` in `/var/www/rental/.env`
3. Update `VITE_STRIPE_PUBLISHABLE_KEY` in `/var/www/rental/frontend/.env`
4. Stripe Dashboard → Developers → Webhooks → Add endpoint: `https://swiftriderentals.com.au/api/v1/payments/webhook` → events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy webhook signing secret → update `STRIPE_WEBHOOK_SECRET` in `/var/www/rental/.env`
6. Rebuild frontend and reload: `cd frontend && npm ci && npm run build && cd .. && pm2 reload rental-api`

---

## Next Steps

- [x] Purchase domain — `swiftriderentals.com.au` and `swiftriderentals.online` (VentraIP)
- [x] Point DNS A records to `209.38.29.102`
- [x] SSL certificate obtained via Let's Encrypt (Certbot)
- [x] HTTPS live on `https://swiftriderentals.com.au`
- [ ] Switch Stripe keys to live keys before accepting real payments
- [ ] Set `STRIPE_WEBHOOK_SECRET` after registering webhook in Stripe Dashboard
- [ ] Set up SMTP email — Mailgun recommended (update `SMTP_*` vars in `/var/www/rental/.env`)
- [ ] Set up UptimeRobot free monitoring on `https://swiftriderentals.com.au/api/v1/health`
- [ ] Configure daily database backup cron job (see COMPLETE_DEVELOPER_GUIDE.md §18)
- [ ] Change admin password from temporary one
- [ ] Enable auto-renew on `swiftriderentals.online` in VentraIP dashboard
- [ ] Legal review of Privacy Policy and Terms & Conditions before public launch

---

*Last updated: June 2026 — HTTPS live on swiftriderentals.com.au*
