// Meta Conversions API: the form's Lead sent from the server too, with the
// same event_id as the browser Pixel's, so Meta counts it once even when an
// ad blocker stops the Pixel (spec 3.1).
import { createHash } from "node:crypto";
import { markIntegration } from "./integrations";
import { getSecret } from "./settings";

const hash = (value: string) => createHash("sha256").update(value.trim().toLowerCase()).digest("hex");

export type CapiLead = {
  eventId: string;
  sourceUrl: string;
  ip: string;
  userAgent: string;
  phone?: string | null;
  name?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  visitorId?: string | null;
};

export async function sendCapiLead(lead: CapiLead) {
  const [pixelId, token] = await Promise.all([getSecret("meta_pixel_id"), getSecret("meta_capi_token")]);
  if (!pixelId || !token) return false;
  const userData: Record<string, unknown> = {
    client_ip_address: lead.ip || undefined,
    client_user_agent: lead.userAgent || undefined,
    fbp: lead.fbp || undefined,
    fbc: lead.fbc || undefined,
    external_id: lead.visitorId ? [hash(lead.visitorId)] : undefined,
    ph: lead.phone ? [hash(lead.phone.replace(/\D/g, ""))] : undefined,
    fn: lead.name ? [hash(lead.name.split(/\s+/)[0] ?? "")] : undefined,
  };
  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(pixelId)}/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        data: [{
          event_name: "Lead",
          event_time: Math.floor(Date.now() / 1000),
          event_id: lead.eventId,
          action_source: "website",
          event_source_url: lead.sourceUrl,
          user_data: userData,
        }],
        access_token: token,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`);
    await markIntegration("meta_capi", { ok: true });
    return true;
  } catch (error) {
    await markIntegration("meta_capi", { ok: false, error: (error as Error).message });
    return false;
  }
}
