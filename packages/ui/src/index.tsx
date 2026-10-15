import type { CSSProperties } from "react";
import Image from "next/image";
import {
  ConversionLink,
  type AnalyticsAdapter,
  type ConversionLocation,
} from "./conversion-link";
import type { LandingContent, LandingImage, LandingItem } from "./model";
import { MenuCatalog } from "./menu-catalog";
import { LandingMotion } from "./landing-motion";
export * from "./model";
export * from "./conversion-link";

function EditorialMark() {
  return (
    <svg
      className="editorial-mark"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M40 8v64M8 40h64M17 17l46 46M17 63l46-46"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="40" cy="40" r="29" stroke="currentColor" strokeWidth="0.6" />
    </svg>
  );
}

export function SectionHeading({
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {text && <p className="section-heading__description">{text}</p>}
    </div>
  );
}

export function EditorialImage({
  image,
  variant = "",
  priority = false,
}: {
  image?: LandingImage;
  variant?: string;
  priority?: boolean;
}) {
  const sizes = variant.includes("hero-image")
    ? "(max-width: 400px) calc(100vw - 40px), (max-width: 760px) 90vw, (max-width: 1000px) 48vw, 42vw"
    : variant.includes("product-image")
      ? "(max-width: 680px) 34vw, (max-width: 1000px) 31vw, 400px"
      : variant.includes("market-image")
        ? "(max-width: 560px) calc(100vw - 40px), (max-width: 900px) 44vw, 400px"
        : variant.includes("promotion-image")
          ? "(max-width: 680px) calc(100vw - 40px), (max-width: 1000px) 40vw, 300px"
          : "(max-width: 680px) calc(100vw - 40px), (max-width: 1000px) 48vw, 420px";
  return (
    <div className={`editorial-image ${variant}`}>
      {image ? (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          preload={priority}
          loading={priority ? undefined : "lazy"}
        />
      ) : (
        <div className="image-placeholder">
          <span aria-hidden="true">
            <EditorialMark />
          </span>
          <p>Una historia por compartir</p>
          <small>Fotografía pendiente de aprobación</small>
        </div>
      )}
      {image?.alt.startsWith("Imagen referencial:") && (
        <span className="reference-image-label">Imagen referencial</span>
      )}
    </div>
  );
}

function MenuCard({ item }: { item: LandingItem }) {
  return (
    <article className={`menu-card ${item.unavailable ? "unavailable" : ""}`}>
      <EditorialImage image={item.image} variant="product-image" />
      <div className="menu-card-copy">
        <h3>{item.name}</h3>
        {item.description && (
          <p className="menu-item__description">{item.description}</p>
        )}
        <div className="price-row">
          <span>{item.price}</span>
          {item.unavailable && <span className="status">Agotado</span>}
        </div>
      </div>
    </article>
  );
}

export function FoodLanding({
  content: c,
  onTrack,
  preview = false,
  previewExitAvailable = preview,
}: {
  content: LandingContent;
  onTrack?: AnalyticsAdapter;
  preview?: boolean;
  previewExitAvailable?: boolean;
}) {
  const menuCategories = c.categories.filter(
    (category) => !category.section || category.section === "menu",
  );
  const marketCategories = c.categories.filter(
    (category) => category.section === "market",
  );
  const menuIds = new Set(menuCategories.map((category) => category.id));
  const marketIds = new Set(marketCategories.map((category) => category.id));
  const menuItems = c.items.filter((item) => menuIds.has(item.categoryId));
  const marketItems = c.items.filter((item) => marketIds.has(item.categoryId));
  const cateringCategories = c.categories.filter(
    (category) => category.section === "catering",
  );
  const cateringItems = c.items.filter((item) =>
    cateringCategories.some((category) => category.id === item.categoryId),
  );
  const hasCatering = cateringCategories.length > 0;
  const cta = (
    location: ConversionLocation,
    label?: string,
    attribution?: { contentId?: string; campaignId?: string },
  ) =>
    c.conversion.placements.includes(location) ? (
      <ConversionLink
        href={c.conversion.href}
        location={location}
        intent={c.conversion.intent}
        siteKey={c.siteKey}
        onTrack={onTrack}
        disabledLabel={c.conversion.fallbackLabel}
        contentId={attribution?.contentId}
        campaignId={attribution?.campaignId}
      >
        {label ?? c.conversion.label}
      </ConversionLink>
    ) : null;
  const style = {
    "--accent": c.theme?.accent,
    "--paper": c.theme?.background,
    "--ink": c.theme?.foreground,
  } as CSSProperties;
  return (
    <LandingMotion
      style={style}
      data-background-pattern={c.theme?.rusticPattern}
    >
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      {(c.demo || preview) && (
        <aside className="demo-banner">
          <span>ESTUDIO PATO / DEMO INTERNA</span>
          <p>
            {preview ? "Vista previa editorial." : "Contenido de demostración."}{" "}
            Precios y activos pendientes de validación. No es un canal de
            pedidos.
          </p>
          {previewExitAvailable && (
            <a href="/api/draft/disable">Salir de vista previa</a>
          )}
        </aside>
      )}
      <header className="site-header">
        <a href="#main" className="wordmark" aria-label={`${c.name}, inicio`}>
          {c.name}
          <span>{c.tagline}</span>
        </a>
        <nav aria-label="Principal">
          <a href="#carta">La carta</a>
          {marketCategories.length > 0 && (
            <a href="#market">Carnicería &amp; Market</a>
          )}
          <a href={hasCatering ? "#catering" : "#experiencia"}>
            {hasCatering ? "Catering" : "La experiencia"}
          </a>
          <a href="#visitanos">Visítanos</a>
        </nav>
        {c.conversion.placements.includes("navigation") && (
          <div className="header-cta">{cta("navigation")}</div>
        )}
      </header>
      <main id="main">
        <section className="hero section-shell" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">{c.hero.title}</h1>
            <p className="hero-signature">{c.hero.eyebrow}</p>
            <p className="hero-description">{c.hero.text}</p>
            <div className="hero-actions">
              <a className="button menu-explore" href="#carta">
                Explora la carta <span aria-hidden="true">↓</span>
              </a>
              {cta("hero")}
            </div>
            <div className="hero-note">
              <p>
                {c.tagline}
                <br />
                <span>{c.address}</span>
              </p>
            </div>
          </div>
          <div className="hero-art">
            <EditorialImage
              image={c.hero.image}
              variant="hero-image"
              priority
            />
          </div>
        </section>
        <section
          className="business-lines section-shell"
          aria-label="Líneas del negocio"
        >
          {c.lines.map((line) => {
            const category = c.categories.find(
              (candidate) =>
                candidate.name === line || candidate.group === line,
            );
            return (
              <a
                key={line}
                href={
                  category?.section === "market"
                    ? "#market"
                    : category?.section === "catering"
                      ? "#catering"
                      : category
                        ? `#category-${category.id}`
                        : "#carta"
                }
              >
                <span>{line}</span>
                <span aria-hidden="true">↗</span>
              </a>
            );
          })}
        </section>
        <section className="section-shell section-space" id="destacados">
          <SectionHeading
            eyebrow="PARA EMPEZAR"
            title="Encuentra tu próximo favorito."
            text="Una selección de nuestra carta para inspirar tu próxima visita."
          />
          <div className="featured-grid">
            {menuItems
              .filter((item) => item.featured)
              .slice(0, 3)
              .map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
          </div>
          {c.demo && (
            <p className="editorial-note">
              Precios de referencia transcritos de las fuentes recibidas.
              Vigencia y disponibilidad por confirmar.
            </p>
          )}
        </section>
        <section className="menu-section section-space" id="carta">
          <div className="section-shell">
            <div className="section-top">
              <SectionHeading
                eyebrow="LA CARTA"
                title={
                  marketCategories.length
                    ? "De la parrilla a tu mesa."
                    : "A tu gusto, a tu manera."
                }
                text={
                  marketCategories.length
                    ? "Platos preparados para disfrutar. Hamburguesas, cortes a la parrilla y complementos, con su porción indicada."
                    : "Explora nuestras categorías. Cada precio indica su presentación o unidad de venta."
                }
              />
              {cta("menu")}
            </div>
            <MenuCatalog categories={menuCategories} items={menuItems} />
          </div>
        </section>
        {marketCategories.length > 0 && (
          <section
            className="market-section section-space"
            id="market"
            aria-labelledby="market-title"
          >
            <div className="section-shell">
              <div className="market-intro">
                <div className="section-heading">
                  <h2 id="market-title">Carnicería &amp; Market</h2>
                  <p className="section-heading__description">
                    Tu próxima parrilla empieza aquí. Cortes y productos para
                    preparar en casa, separados de nuestra carta de platos
                    listos.
                  </p>
                </div>
                <div className="market-buying-note">
                  <p>Para preparar en casa</p>
                  <span>
                    Revisa el precio por kilo o pack de cada producto.
                  </span>
                  <a className="text-link" href="#carta">
                    Ver platos preparados <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
              {c.demo && (
                <p className="market-reference-note">
                  Catálogo de demostración · Precios y fotografías
                  referenciales. Disponibilidad, peso y vigencia por confirmar.
                </p>
              )}
              {marketCategories.map((category) => (
                <section
                  className="market-category"
                  id={`category-${category.id}`}
                  key={category.id}
                  aria-labelledby={`category-heading-${category.id}`}
                >
                  <div className="market-category-heading">
                    <h3 id={`category-heading-${category.id}`}>
                      {category.name}
                    </h3>
                    {category.description && <p>{category.description}</p>}
                  </div>
                  <div className="market-grid">
                    {marketItems
                      .filter((item) => item.categoryId === category.id)
                      .map((item) => (
                        <article
                          className={`market-product${item.unavailable ? " unavailable" : ""}`}
                          key={item.id}
                        >
                          <EditorialImage
                            image={item.image}
                            variant="market-image"
                          />
                          <div className="market-product-heading">
                            <h4>{item.name}</h4>
                            <p className="market-price">{item.price}</p>
                          </div>
                          {item.description && (
                            <p className="market-product-description">
                              {item.description}
                            </p>
                          )}
                          {item.unavailable && (
                            <span className="status">Agotado</span>
                          )}
                        </article>
                      ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        )}
        {c.promotions.length > 0 && (
          <section
            className="promotions-section section-shell section-space"
            id="promociones"
          >
            <SectionHeading
              eyebrow="PROMOCIONES"
              title="Algo especial para compartir."
              text="Beneficios vigentes según las fechas publicadas por el negocio."
            />
            <div className="promotion-grid">
              {c.promotions.map((promotion) => (
                <article className="promotion-card" key={promotion.id}>
                  {promotion.image && (
                    <EditorialImage
                      image={promotion.image}
                      variant="promotion-image"
                    />
                  )}
                  <div>
                    <h3>{promotion.title}</h3>
                    <p>{promotion.text}</p>
                    {promotion.useWhatsappCta &&
                      cta("promotion", undefined, {
                        contentId: promotion.id,
                        campaignId: promotion.campaignId,
                      })}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        <section
          className={`section-shell section-space${hasCatering ? " catering-section" : ""}`}
          id={hasCatering ? "catering" : "experiencia"}
          aria-label={hasCatering ? "Catering parrillero" : "La experiencia"}
        >
          {hasCatering && <span id="experiencia" aria-hidden="true" />}
          <div className={hasCatering ? "catering-intro" : undefined}>
            <SectionHeading
              eyebrow="LA EXPERIENCIA"
              title="Los buenos momentos se comparten."
              text={hasCatering ? undefined : c.description}
            />
            {hasCatering && (
              <div className="catering-copy">
                <h3>{cateringItems[0]?.name ?? "Catering parrillero"}</h3>
                <p>
                  {cateringItems[0]?.description ||
                    "Reúne a los tuyos alrededor de la parrilla. Consulta las opciones de catering para tu próximo encuentro."}
                </p>
                <p className="catering-details">
                  Cuéntanos la fecha, el lugar y cuántas personas los
                  acompañarán.
                </p>
                <ConversionLink
                  href={c.conversion.cateringHref ?? null}
                  location="catering"
                  intent="event"
                  siteKey={c.siteKey}
                  onTrack={onTrack}
                  contentId={cateringItems[0]?.id}
                  disabledLabel="Consulta de catering pendiente de habilitar"
                >
                  Consultar catering por WhatsApp
                </ConversionLink>
              </div>
            )}
          </div>
          <div
            className={`gallery-grid gallery-count-${Math.min(
              c.gallery.length || 3,
              3,
            )}`}
          >
            {(c.gallery.length ? c.gallery : [undefined, undefined, undefined])
              .slice(0, 3)
              .map((image, i) => (
                <figure key={image?.src ?? i}>
                  <EditorialImage
                    image={image}
                    variant={`gallery-image gallery-${i}`}
                  />
                  {image?.caption && <figcaption>{image.caption}</figcaption>}
                </figure>
              ))}
          </div>
        </section>
        <section
          className="section-shell section-space visit-section"
          id="visitanos"
        >
          <div>
            <SectionHeading
              eyebrow="VEN A VERNOS"
              title="Aquí nos encontramos."
            />
            <p className="address">{c.address}</p>
            {c.mapsUrl && (
              <a
                className="text-link"
                href={c.mapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Ver ubicación en Google Maps ↗
              </a>
            )}
            <div className="social-links">
              {c.socials.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label} ↗
                </a>
              ))}
            </div>
          </div>
          <div className="hours-panel">
            <h3>Horario de atención</h3>
            <dl>
              {c.hours.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="editorial-note">Zona horaria: {c.timezone}</p>
            {c.specialHours.map((note) => (
              <p className="editorial-note" key={note}>
                {note}
              </p>
            ))}
          </div>
        </section>
        {c.faqs.length > 0 && (
          <section className="faq-section section-shell section-space">
            <SectionHeading
              eyebrow="ANTES DE VISITARNOS"
              title="Todo un poco más claro."
            />
            <div>
              {c.faqs.map((faq) => (
                <details key={faq.id}>
                  <summary>
                    {faq.question}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}
        <section className="final-cta">
          <div className="section-shell">
            <h2>¿Qué se te antoja hoy?</h2>
            {cta("footer")}
            {c.conversion.phone && (
              <p className="phone-fallback">
                También puedes llamar al{" "}
                <a href={`tel:${c.conversion.phone}`}>{c.conversion.phone}</a>
              </p>
            )}
          </div>
        </section>
      </main>
      {c.conversion.href && c.conversion.placements.includes("floating") && (
        <div className="floating-cta">{cta("floating")}</div>
      )}
      <footer className="site-footer section-shell">
        <a className="wordmark" href="#main">
          {c.name}
          <span>{c.tagline}</span>
        </a>
        <p>
          {c.demo
            ? "Prototipo interno · No publicado"
            : "Gracias por compartir nuestra mesa."}
        </p>
        <span>Diseñado por PATO</span>
      </footer>
    </LandingMotion>
  );
}
