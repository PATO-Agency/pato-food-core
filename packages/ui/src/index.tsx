import type { CSSProperties } from "react";
import Image from "next/image";
import {
  ConversionLink,
  type AnalyticsAdapter,
  type ConversionLocation,
} from "./conversion-link";
import type { LandingContent, LandingImage, LandingItem } from "./model";
export * from "./model";
export * from "./conversion-link";

export function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
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
    ? "(max-width: 680px) calc(100vw - 40px), (max-width: 1000px) 48vw, 42vw"
    : variant.includes("product-image")
      ? "(max-width: 680px) 34vw, (max-width: 1000px) 31vw, 400px"
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
          <span aria-hidden="true">✳</span>
          <p>Una historia por compartir</p>
          <small>Fotografía pendiente de aprobación</small>
        </div>
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
    <div className="food-site" style={style}>
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
          <a href="#experiencia">La experiencia</a>
          <a href="#visitanos">Visítanos</a>
        </nav>
        {c.conversion.placements.includes("navigation") && (
          <div className="header-cta">{cta("navigation")}</div>
        )}
      </header>
      <main id="main">
        <section className="hero section-shell" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="little-line" />
              {c.hero.eyebrow}
            </p>
            <h1 id="hero-title">{c.hero.title}</h1>
            <p className="hero-description">{c.hero.text}</p>
            <div className="hero-actions">
              {cta("hero")}
              <a className="text-link" href="#carta">
                Explora la carta <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div className="hero-note">
              <span aria-hidden="true">✳</span>
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
            <span className="image-index">01 / {c.name}</span>
          </div>
        </section>
        <section
          className="business-lines section-shell"
          aria-label="Líneas del negocio"
        >
          {c.lines.map((line, i) => {
            const category = c.categories.find(
              (candidate) =>
                candidate.name === line || candidate.group === line,
            );
            return (
              <a
                key={line}
                href={category ? `#category-${category.id}` : "#carta"}
              >
                <span className="line-number">0{i + 1}</span>
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
            {c.items
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
                title="A tu gusto, a tu manera."
                text="Explora nuestras categorías. Cada precio indica su presentación o unidad de venta."
              />
              {cta("menu")}
            </div>
            <nav className="category-links" aria-label="Categorías de la carta">
              {c.categories.map((category) => (
                <a href={`#category-${category.id}`} key={category.id}>
                  {category.name}
                </a>
              ))}
            </nav>
            <div className="menu-groups">
              {c.categories.map((category) => (
                <section
                  id={`category-${category.id}`}
                  className="menu-group"
                  key={category.id}
                >
                  <div>
                    <p className="eyebrow">{category.group ?? "CARTA"}</p>
                    <h3>{category.name}</h3>
                    {category.description && (
                      <p className="menu-group__intro">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <ul>
                    {c.items
                      .filter((item) => item.categoryId === category.id)
                      .map((item) => (
                        <li key={item.id}>
                          <div>
                            <h4>{item.name}</h4>
                            {item.description && (
                              <p className="menu-item__description">
                                {item.description}
                              </p>
                            )}
                            {item.unavailable && (
                              <span className="status">Agotado</span>
                            )}
                          </div>
                          <span className="menu-price">{item.price}</span>
                        </li>
                      ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </section>
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
        <section className="section-shell section-space" id="experiencia">
          <SectionHeading
            eyebrow="LA EXPERIENCIA"
            title="Los buenos momentos se comparten."
            text={c.description}
          />
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
            <p className="eyebrow">NOS ENCONTRAMOS EN LA MESA</p>
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
    </div>
  );
}
