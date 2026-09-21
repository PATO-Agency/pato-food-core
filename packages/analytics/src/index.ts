/** Contact intent only: this event must never be reported as a sale or order. */
export const CTA_LOCATIONS = [
  "hero",
  "navigation",
  "menu",
  "promotion",
  "floating",
  "footer",
] as const;
export const WHATSAPP_INTENTS = [
  "order",
  "reservation",
  "inquiry",
  "event",
] as const;

export interface WhatsAppClick {
  cta_location: (typeof CTA_LOCATIONS)[number];
  intent: (typeof WHATSAPP_INTENTS)[number];
  site_key: string;
  content_id?: string;
  campaign_id?: string;
  page_path?: string;
}

export interface AnalyticsProvider {
  track: (
    event: "whatsapp_click",
    payload: Readonly<WhatsAppClick>,
  ) => void | Promise<void>;
}

export const disabledAnalytics: AnalyticsProvider = { track: () => undefined };

// Identifiers are developer-controlled opaque keys, never user input or contact data.
function safeIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[a-z][a-z0-9_-]{0,63}$/i.test(value) &&
    !/\d{7}/.test(value)
  );
}

/** Explicit projection prevents accidental forwarding of phone/message/URL fields. */
export function createWhatsAppClickPayload(
  input: WhatsAppClick,
): Readonly<WhatsAppClick> | null {
  if (
    !CTA_LOCATIONS.includes(input.cta_location) ||
    !WHATSAPP_INTENTS.includes(input.intent) ||
    !safeIdentifier(input.site_key)
  )
    return null;
  const payload: WhatsAppClick = {
    cta_location: input.cta_location,
    intent: input.intent,
    site_key: input.site_key,
    // v1 is a single landing route. Never forward query, fragments or arbitrary paths.
    page_path: "/",
  };
  if (safeIdentifier(input.content_id)) payload.content_id = input.content_id;
  if (safeIdentifier(input.campaign_id))
    payload.campaign_id = input.campaign_id;
  return Object.freeze(payload);
}

/** Best effort and deferred: call from an anchor's onClick without preventDefault. */
export function trackWhatsAppClick(
  input: WhatsAppClick,
  provider: AnalyticsProvider = disabledAnalytics,
): void {
  try {
    const payload = createWhatsAppClickPayload(input);
    if (!payload) return;
    setTimeout(() => {
      try {
        void Promise.resolve(provider.track("whatsapp_click", payload)).catch(
          () => undefined,
        );
      } catch {
        // Tracking must never interfere with navigation, even when the SDK throws.
      }
    }, 0);
  } catch {
    // An invalid runtime input or unavailable scheduler cannot break the CTA.
  }
}

export type Gtag = (
  command: "event",
  event: "whatsapp_click",
  payload: Readonly<WhatsAppClick>,
) => void;

/** Does not load scripts or grant consent. Resolve an already-approved SDK lazily. */
export function createGtagProvider(
  getGtag: () => Gtag | undefined,
): AnalyticsProvider {
  return { track: (event, payload) => getGtag()?.("event", event, payload) };
}
