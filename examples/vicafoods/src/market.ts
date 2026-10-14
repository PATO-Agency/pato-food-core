/** Demo additions. Historic source is not a current offer or approval. */
export const marketPriceSource = {
  url: "https://ugc.production.linktr.ee/347a5689-9fbe-42bf-ba6c-8fc3b8781ca9_vicafoods-carniceria-2024.pdf",
  observedAt: "2026-10-14T21:45:00Z",
  title: "Carta Carnicería Vicafoods 2024",
};

export const marketAdditions = [
  {
    id: "market-tomahawk",
    name: "Tomahawk Angus americano",
    amount: 210.9,
    page: 2,
    description: "Corte de res con hueso largo para tu parrilla.",
    photo: "tomahawk",
    categoryId: "market-cuts",
  },
  {
    id: "market-bife-ancho",
    name: "Bife ancho Angus argentino",
    amount: 130.9,
    page: 3,
    description: "Ribeye para preparar a la parrilla o a la plancha.",
    photo: "ribeye",
    categoryId: "market-cuts",
  },
  {
    id: "market-bife-angosto",
    name: "Bife angosto Angus americano",
    amount: 150.9,
    page: 2,
    description: "Striploin para cortar y preparar a tu gusto.",
    photo: "striploin",
    categoryId: "market-cuts",
  },
  {
    id: "market-asado-tira",
    name: "Asado de tira Angus americano",
    amount: 145.9,
    page: 2,
    description: "Costillar de res para cocinar al fuego.",
    photo: "beef-ribs",
    categoryId: "market-cuts",
  },
  {
    id: "market-t-bone",
    name: "T-bone nacional",
    amount: 55.5,
    page: 4,
    description: "Corte de res con su característico hueso en T.",
    photo: "t-bone",
    categoryId: "market-cuts",
  },
  {
    id: "market-costilla-cerdo",
    name: "Costilla de cerdo",
    amount: 33.5,
    page: 6,
    description: "Costillar para preparar en casa, al horno o a la parrilla.",
    photo: "pork-ribs",
    categoryId: "market-cuts",
  },
  {
    id: "market-chuleta",
    name: "Chuleta de lomo de cerdo",
    amount: 26.5,
    page: 6,
    description: "Chuletas de cerdo para la plancha o la parrilla.",
    photo: "pork-chop",
    categoryId: "market-cuts",
  },
  {
    id: "market-chorizo-maple-picante",
    name: "Chorizo de maple picante",
    amount: 26,
    page: undefined,
    description:
      "Propuesta para la demo: maple con un toque picante. Precio y receta referenciales.",
    photo: "sausage-spicy",
    categoryId: "market-charcuteria",
  },
  {
    id: "market-chorizo-maple",
    name: "Chorizo de maple",
    amount: 25,
    page: undefined,
    description:
      "Propuesta para la demo: perfil suave de maple. Precio y receta referenciales.",
    photo: "sausage-maple",
    categoryId: "market-charcuteria",
  },
  {
    id: "market-chorizo-hierbas",
    name: "Chorizo de finas hierbas",
    amount: 20.5,
    page: 7,
    description:
      "Chorizos para completar tu parrilla. Presentación referida en la carta 2024.",
    photo: "sausage-herbs",
    categoryId: "market-charcuteria",
  },
] as const;

export const marketCategories = [
  {
    id: "market-cuts",
    name: "Cortes para tu parrilla",
    description:
      "Res y cerdo · Precios por kilogramo; peso de cada pieza por confirmar.",
  },
  {
    id: "market-charcuteria",
    name: "Chorizos y hamburguesas",
    description:
      "Artesanales para compartir · Revisa las unidades de cada pack.",
  },
] as const;
