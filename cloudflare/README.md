# MOTI Renew license service (Cloudflare)

This folder contains the optional license-control service. Customer subscription/payment records stay in the customer's browser storage; D1 stores only license metadata (customer label, key, status, expiry, device binding and last check).

## What is included

- `schema.sql`: Cloudflare D1 table.
- `worker.js`: public license verification endpoint and token-protected admin API.
- `wrangler.toml`: Worker deployment template.
- `../public/admin.html`: simple admin page served by the existing static site at `/admin.html`.

## One-time Cloudflare setup

1. Create a Cloudflare account and install Wrangler (or use Cloudflare's dashboard).
2. Create a D1 database named `moti-renew-licenses`.
3. Run `cloudflare/schema.sql` against that D1 database.
4. Copy the D1 database ID into `cloudflare/wrangler.toml`.
5. From the `cloudflare` folder, deploy the Worker with Wrangler.
6. Set a strong secret named `ADMIN_TOKEN` on the Worker (Worker Settings → Variables and Secrets). Do not put it in the website or GitHub.
7. Set `ALLOWED_ORIGIN` to the exact deployed MOTI Renew origin.
8. Open `https://moti-renew.onrender.com/admin.html`, enter the Worker URL and admin token, then create and manage licenses.

## API

- `POST /api/license/verify` with `{ "licenseKey": "...", "deviceId": "..." }`
- `GET /api/admin/licenses` (Bearer admin token)
- `POST /api/admin/licenses` (Bearer admin token) with customerName, licenseKey and ISO expiry
- `PATCH /api/admin/licenses/:id` (Bearer admin token) with status and/or `resetDevice: true`

The first successful activation binds a license to that browser/device ID. Admin can reset the binding if a customer changes device.

## Important limitations

- This is a starter license service, not payment processing. Mark licenses active only after verifying payment.
- A browser-only app cannot provide tamper-proof DRM. A determined technical user can modify client-side code; the Worker provides practical subscription gating, not absolute copy protection.
- The free Cloudflare plan has quotas and product limits which can change. It is not a guarantee of unlimited free service.
- Keep customer business data local. D1 should contain only the minimum license metadata.
