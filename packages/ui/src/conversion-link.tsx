"use client";

import type { ReactNode } from "react";
import {
  createWhatsAppClickPayload,
  disabledAnalytics,
  trackWhatsAppClick,
} from "@pato-food/analytics";
import type { ConversionLocation } from "./model";

export type { ConversionLocation } from "./model";
export type ConversionEvent = {
  cta_location: ConversionLocation;
  intent: "order" | "reservation" | "inquiry" | "event";
  site_key: string;
  page_path?: string;
  content_id?: string;
  campaign_id?: string;
};
export type AnalyticsAdapter = (event: Readonly<ConversionEvent>) => void;

export function ConversionLink({
  href,
  children,
  location,
  intent,
  siteKey,
  onTrack,
  className = "",
  disabledLabel = "Canal de contacto pendiente de confirmar",
  contentId,
  campaignId,
}: {
  href: string | null;
  children: ReactNode;
  location: ConversionLocation;
  intent: ConversionEvent["intent"];
  siteKey: string;
  onTrack?: AnalyticsAdapter;
  className?: string;
  disabledLabel?: string;
  contentId?: string;
  campaignId?: string;
}) {
  if (!href)
    return (
      <span className={`conversion-pending ${className}`}>
        <button className="button disabled" type="button" disabled>
          {children}
        </button>
        <small>{disabledLabel}</small>
      </span>
    );
  return (
    <a
      className={`button ${className}`}
      href={href}
      onClick={() => {
        try {
          const event = {
            cta_location: location,
            intent,
            site_key: siteKey,
            page_path: window.location.pathname,
            ...(contentId ? { content_id: contentId } : {}),
            ...(campaignId ? { campaign_id: campaignId } : {}),
          };
          if (onTrack) {
            const payload = createWhatsAppClickPayload(event);
            if (payload) onTrack(payload);
          } else trackWhatsAppClick(event, disabledAnalytics);
        } catch {
          /* Contact always works even if measurement fails. */
        }
      }}
    >
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}
