import db from "../db.server";

export type SpotlightInput = {
  shop: string;
  productId: string;
  productTitle: string;
  badgeText: string;
  badgeColor?: string;
};

export async function getSpotlights(shop: string) {
  return db.spotlight.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSpotlight(id: string, shop: string) {
  return db.spotlight.findFirst({
    where: { id, shop },
  });
}

export async function createSpotlight(data: SpotlightInput) {
  return db.spotlight.create({
    data: {
      shop: data.shop,
      productId: data.productId,
      productTitle: data.productTitle,
      badgeText: data.badgeText,
      badgeColor: data.badgeColor ?? "#008060",
    },
  });
}

export async function deleteSpotlight(id: string, shop: string) {
  return db.spotlight.deleteMany({
    where: { id, shop },
  });
}

export async function deleteSpotlightsByProduct(
  productId: string,
  shop: string
) {
  return db.spotlight.deleteMany({
    where: { productId, shop },
  });
}

export async function updateSpotlight(
  id: string,
  shop: string,
  data: Partial<SpotlightInput>
) {
  return db.spotlight.updateMany({
    where: { id, shop },
    data: {
      ...(data.productId && { productId: data.productId }),
      ...(data.productTitle && { productTitle: data.productTitle }),
      ...(data.badgeText && { badgeText: data.badgeText }),
      ...(data.badgeColor && { badgeColor: data.badgeColor }),
    },
  });
}
