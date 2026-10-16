import { ConversionLink, type AnalyticsAdapter } from "./conversion-link";
import type { LandingItem, ProductConversionLocation } from "./model";

export function ProductOrderLink({
  item,
  siteKey,
  location,
  onTrack,
}: {
  item: LandingItem;
  siteKey: string;
  location: ProductConversionLocation;
  onTrack?: AnalyticsAdapter;
}) {
  if (item.unavailable || !item.orderHref) return null;
  return (
    <ConversionLink
      href={item.orderHref}
      location={location}
      intent="order"
      siteKey={siteKey}
      contentId={item.id}
      onTrack={onTrack}
      appearance="text"
      className="product-order-link"
      ariaLabel={`Pedir ${item.name} por WhatsApp`}
    >
      Pedir por WhatsApp
    </ConversionLink>
  );
}
