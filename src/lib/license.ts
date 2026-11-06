const API_URL = (import.meta.env.VITE_LICENSE_API_URL as string | undefined)?.replace(/\/$/, "");

const LICENSE_KEY_STORAGE = "moti_renew_license_key";
const DEVICE_ID_STORAGE = "moti_renew_device_id";

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_STORAGE);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_STORAGE, id);
  }
  return id;
}

export function isLicenseCheckEnabled(): boolean {
  return Boolean(API_URL);
}

export function getSavedLicenseKey(): string {
  return localStorage.getItem(LICENSE_KEY_STORAGE) || "";
}

export async function activateOrVerifyLicense(licenseKey: string) {
  if (!API_URL) return { active: true, expiresAt: null as string | null };
  const response = await fetch(`${API_URL}/api/license/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ licenseKey: licenseKey.trim(), deviceId: getDeviceId() }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.active) {
    const reason = result.reason || result.error || "verification_failed";
    throw new Error(reason);
  }
  localStorage.setItem(LICENSE_KEY_STORAGE, licenseKey.trim());
  return result as { active: true; expiresAt: string };
}
