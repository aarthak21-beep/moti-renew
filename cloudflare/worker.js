const json = (data, status = 200, origin = "*") => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, PATCH, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    "cache-control": "no-store"
  }
});

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value) && !Number.isNaN(Date.parse(value));
}

function isAdmin(request, env) {
  const supplied = request.headers.get("authorization") || "";
  return Boolean(env.ADMIN_TOKEN) && supplied === `Bearer ${env.ADMIN_TOKEN}`;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") || "";
    const allowed = env.ALLOWED_ORIGIN || "*";
    const responseOrigin = allowed === "*" || origin === allowed ? (allowed === "*" ? "*" : origin) : "null";
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: {
        "access-control-allow-origin": responseOrigin,
        "access-control-allow-methods": "GET, POST, PATCH, OPTIONS",
        "access-control-allow-headers": "content-type, authorization",
        "access-control-max-age": "86400"
      }});
    }
    if (responseOrigin === "null") return json({ error: "Origin not allowed" }, 403, responseOrigin);

    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/license/verify" && request.method === "POST") {
        const body = await request.json();
        const licenseKey = String(body.licenseKey || "").trim();
        const deviceId = String(body.deviceId || "").trim();
        if (!licenseKey || !deviceId) return json({ active: false, reason: "missing_details" }, 400, responseOrigin);

        const license = await env.DB.prepare(
          "SELECT id, status, expires_at, device_id FROM licenses WHERE license_key = ?"
        ).bind(licenseKey).first();

        if (!license) return json({ active: false, reason: "not_found" }, 404, responseOrigin);
        if (license.status !== "active") return json({ active: false, reason: "suspended" }, 403, responseOrigin);
        if (Date.parse(license.expires_at) <= Date.now()) return json({ active: false, reason: "expired" }, 403, responseOrigin);
        if (license.device_id && license.device_id !== deviceId) return json({ active: false, reason: "device_mismatch" }, 403, responseOrigin);

        await env.DB.prepare(
          "UPDATE licenses SET device_id = COALESCE(device_id, ?), last_seen_at = ? WHERE id = ?"
        ).bind(deviceId, new Date().toISOString(), license.id).run();

        return json({ active: true, expiresAt: license.expires_at }, 200, responseOrigin);
      }

      if (url.pathname === "/api/admin/licenses") {
        if (!isAdmin(request, env)) return json({ error: "Unauthorized" }, 401, responseOrigin);
        if (request.method === "GET") {
          const result = await env.DB.prepare(
            "SELECT id, license_key, customer_name, status, expires_at, device_id, created_at, last_seen_at FROM licenses ORDER BY id DESC"
          ).all();
          return json({ licenses: result.results || [] }, 200, responseOrigin);
        }
        if (request.method === "POST") {
          const body = await request.json();
          const customerName = String(body.customerName || "").trim().slice(0, 100);
          const licenseKey = String(body.licenseKey || "").trim().slice(0, 100);
          const expiresAt = String(body.expiresAt || "");
          if (!customerName || !licenseKey || !validDate(expiresAt)) {
            return json({ error: "Customer name, license key and valid expiry date are required." }, 400, responseOrigin);
          }
          try {
            await env.DB.prepare(
              "INSERT INTO licenses (license_key, customer_name, expires_at) VALUES (?, ?, ?)"
            ).bind(licenseKey, customerName, expiresAt).run();
          } catch {
            return json({ error: "License key already exists." }, 409, responseOrigin);
          }
          return json({ created: true }, 201, responseOrigin);
        }
      }

      const licenseMatch = url.pathname.match(/^\/api\/admin\/licenses\/(\d+)$/);
      if (licenseMatch && request.method === "PATCH") {
        if (!isAdmin(request, env)) return json({ error: "Unauthorized" }, 401, responseOrigin);
        const id = Number(licenseMatch[1]);
        const body = await request.json();
        if (body.resetDevice === true) {
          await env.DB.prepare("UPDATE licenses SET device_id = NULL WHERE id = ?").bind(id).run();
        }
        if (["active", "suspended", "revoked"].includes(body.status)) {
          await env.DB.prepare("UPDATE licenses SET status = ? WHERE id = ?").bind(body.status, id).run();
        }
        if (validDate(body.expiresAt)) {
          await env.DB.prepare("UPDATE licenses SET expires_at = ? WHERE id = ?").bind(body.expiresAt, id).run();
        }
        return json({ updated: true }, 200, responseOrigin);
      }

      return json({ error: "Not found" }, 404, responseOrigin);
    } catch (error) {
      return json({ error: "Server error" }, 500, responseOrigin);
    }
  }
};
