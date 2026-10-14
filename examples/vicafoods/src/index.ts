import { siteContentSchema } from "@pato-food/content-contract";
import { marketAdditions, marketCategories, marketPriceSource } from "./market";
import { moments } from "./moments";

export const vicafoodsConfig = {
  siteKey: "vicafoods-demo",
  prospect: true,
  internalOnly: true,
  publishBlocked: true,
  status: "prospect",
  locale: "es-PE",
  currency: "PEN",
  timezone: "America/Lima",
  theme: {
    primary: "#e5b83d",
    background: "#11100e",
    foreground: "#f8f4eb",
    rusticPattern: "brick",
  },
  notice:
    "Demostración interna · Contenido pendiente de validación · No publicar",
} as const;
const provenance = {
  contentStatus: "pendingValidation" as const,
  sourceObservedAt: "2026-09-18T12:00:00Z",
};
const productImages = {
  "hamb-angus": {
    src: "/demo/vicafoods/hamburguesa-vicafoods.png",
    alt: "Hamburguesa con pan marcado VICAFOODS",
    rightsConfirmed: false,
  },
  choripan: {
    src: "/demo/vicafoods/choripan-papas.png",
    alt: "Choripán servido con papas y bebida",
    rightsConfirmed: false,
  },
} as const;
const categories = [
  ["burgers", "Burgers", "Barra parrillera"],
  ["steak-house", "Cortes a la parrilla", "Barra parrillera"],
  ["complementos", "Complementos", "Barra parrillera"],
  ["market", "Carnicería & Market", "Market"],
  ["catering", "Catering parrillero", "Catering"],
].map(([id, name, groupLabel], sortOrder) => ({
  ...provenance,
  sourceRef: "Registro de contenido piloto",
  id,
  slug: id,
  name,
  groupLabel,
  sortOrder,
  visible: id !== "market",
  catalogSection: id === "market" ? "market" : "menu",
}));
const catalog: [string, string, string, number, string, string?][] = [
  [
    "hamb-angus",
    "Hamb angus de 200 g con papas",
    "burgers",
    29.5,
    "S12",
    "200 g con papas",
  ],
  ["hamb-res", "Hamburguesa de res nacional 150 g", "burgers", 19.5, "S12"],
  [
    "hamb-cerdo",
    "Hamburguesa de cerdo 150 g",
    "burgers",
    19.5,
    "S12",
    "150 g con papas y pan brioche",
  ],
  ["milanesa", "Milanesa de pechuga de pollo", "burgers", 22.5, "S12"],
  ["choripan", "Choripán artesanal", "burgers", 16.5, "S12"],
  ["choripapa", "Choripapa artesanal", "burgers", 18.5, "S12"],
  [
    "bife-angosto",
    "Bife angosto Angus americano 500 g",
    "steak-house",
    115,
    "S12",
  ],
  ["picanha", "Picanha Angus americana 500 g", "steak-house", 105, "S12"],
  ["papas", "Papas fritas", "complementos", 14, "S12", "Porción"],
  ["nuggets", "Nuggets de pollo", "burgers", 17, "S12", "Con papas fritas"],
  ["asado", "Asado de tira Angus americano 500 g", "steak-house", 110, "S13"],
  ["entrana", "Entraña Angus americano 500 g", "steak-house", 135, "S13"],
  [
    "ensalada",
    "Ensalada fresca de verduras",
    "complementos",
    12,
    "S13",
    "Con aliño",
  ],
  ["chorizo", "Chorizo artesanal al kamado", "complementos", 10, "S13"],
];
const menuItems = catalog.map(
  ([id, name, categoryId, amount, sourceRef, description], sortOrder) => ({
    ...provenance,
    sourceRef,
    id,
    slug: id,
    name,
    categoryId,
    description,
    pricingMode: "fixed",
    priceOptions: [
      {
        label: "Presentación del catálogo",
        amount,
        currency: "PEN",
        billingUnit: "portion",
        unitQuantity: 1,
      },
    ],
    badges: [],
    image: productImages[id as keyof typeof productImages],
    featured: ["hamb-angus", "bife-angosto", "entrana"].includes(id),
    availability: "available",
    sortOrder,
  }),
);
export const vicafoodsContent = siteContentSchema.parse({
  business: {
    ...provenance,
    sourceRef: "Usuario / registro piloto 2026-09-18",
    displayName: "VICAFOODS",
    tagline: "Meat & Market · Since 2019",
    description:
      "Carnicería, barra parrillera y catering parrillero en Magdalena del Mar.",
    businessLines: [
      "Carnicería & Market",
      "Barra parrillera",
      "Catering parrillero",
    ],
    hero: {
      eyebrow: "Meat & Market · Desde 2019",
      title: "El fuego reúne. La carne es el comienzo.",
      text: "Explora el catálogo de nuestra carnicería y barra parrillera. Una referencia de lo que se prepara en VICAFOODS.",
    },
    address: {
      line: "Jr. Grau 369",
      city: "Magdalena del Mar",
      region: "Lima",
      country: "PE",
      postalCode: "15086",
    },
    mapsUrl: "https://maps.app.goo.gl/PVC76cWpRXtgPzJU6",
    socialLinks: [
      {
        network: "Instagram",
        url: "https://www.instagram.com/vicafoods.pe",
        visible: true,
      },
    ],
    timezone: "America/Lima",
    openingHours: Array.from({ length: 7 }, (_, day) => ({
      day,
      closed: false,
      intervals: [
        {
          opens: day === 0 ? "12:00" : "13:00",
          closes: day === 0 ? "17:00" : "22:00",
        },
      ],
    })),
    specialHours: [],
    proofPoints: [
      {
        title: "Desde 2019",
        detail: "Inicio de operaciones confirmado por el usuario.",
      },
    ],
  },
  whatsappConversion: {
    ...provenance,
    sourceRef: "Usuario: canal y número confirmados; activación no autorizada",
    enabled: false,
    intent: "order",
    destinationE164: "+51987384803",
    ctaLabel: "Haz tu pedido",
    prefilledMessage:
      "¡Hola, familia VICAFOODS! Quisiera hacer un pedido. ¿Podrían ayudarme con la disponibilidad?",
    placements: [
      "hero",
      "navigation",
      "menu",
      "promotion",
      "floating",
      "footer",
    ],
    fallbackLabel: "Canal configurado · activación pendiente",
  },
  menuCategories: [
    ...categories,
    ...marketCategories.map((category, index) => ({
      ...provenance,
      ...category,
      slug: category.id,
      groupLabel: "Carnicería & Market",
      catalogSection: "market",
      visible: true,
      sortOrder: index,
      sourceRef: "Ampliación referencial autorizada 14/10/2026",
    })),
  ],
  menuItems: [
    ...menuItems,
    ...marketAdditions.map((item, index) => ({
      ...provenance,
      id: item.id,
      slug: item.id,
      name: item.name,
      categoryId: item.categoryId,
      description: item.description,
      sourceRef: item.page
        ? `Carta Carnicería Vicafoods 2024, p. ${item.page}; vigencia pendiente`
        : "Precio ficticio de demostración autorizado; no es precio confirmado de Vicafoods",
      sourceObservedAt: marketPriceSource.observedAt,
      pricingMode: "fixed",
      priceOptions: [
        {
          label:
            item.categoryId === "market-charcuteria"
              ? "Pack de 5 unidades de referencia"
              : "Por kilogramo",
          amount: item.amount,
          currency: "PEN",
          billingUnit:
            item.categoryId === "market-charcuteria" ? "package" : "kg",
          unitQuantity: 1,
        },
      ],
      image: {
        src: `/demo/vicafoods-market/${item.photo}.jpg`,
        alt: `Imagen referencial: ${item.name}`,
        rightsConfirmed: true,
      },
      badges: [],
      featured: false,
      availability: "available",
      sortOrder: 30 + index,
    })),
    {
      ...provenance,
      sourceRef: "S2",
      id: "market-picanha",
      slug: "market-picanha",
      name: "Picanha nacional",
      categoryId: "market-cuts",
      pricingMode: "fixed",
      priceOptions: [
        {
          label: "Por kilogramo",
          amount: 65.5,
          currency: "PEN",
          billingUnit: "kg",
          unitQuantity: 1,
        },
      ],
      featured: false,
      availability: "available",
      sortOrder: 20,
    },
    {
      ...provenance,
      sourceRef: "S1",
      id: "market-pack-cerdo",
      slug: "market-pack-cerdo",
      name: "Hamburguesa de cerdo",
      categoryId: "market-charcuteria",
      pricingMode: "fixed",
      priceOptions: [
        {
          label: "Pack de 4 × 150 g",
          amount: 25,
          currency: "PEN",
          billingUnit: "package",
          unitQuantity: 1,
          netContent: { quantity: 150, unit: "g", count: 4 },
        },
      ],
      featured: false,
      availability: "available",
      sortOrder: 21,
    },
    {
      ...provenance,
      sourceRef: "Usuario / catering por confirmar",
      id: "catering",
      slug: "catering",
      name: "Catering parrillero",
      categoryId: "catering",
      pricingMode: "onRequest",
      priceOptions: [],
      featured: false,
      availability: "seasonal",
      sortOrder: 22,
    },
  ],
  galleryImages: moments.map((moment, sortOrder) => ({
    ...provenance,
    sourceRef: moment.sourceUrl,
    id: `gallery-${moment.key}`,
    image: {
      src: `/demo/vicafoods-moments/${moment.key}.jpg`,
      alt: moment.alt,
      rightsConfirmed: true,
    },
    category: "event",
    caption:
      "Fotografía referencial · No corresponde a un evento de Vicafoods.",
    credit: `${moment.photographer} / Pexels`,
    sortOrder,
    visible: true,
  })),
  promotions: [],
  faqs: [],
  testimonials: [],
});
vicafoodsContent.business.hero.image = {
  src: "/demo/vicafoods/hamburguesa-vicafoods.png",
  alt: "Hamburguesa con pan marcado VICAFOODS",
  rightsConfirmed: false,
};
