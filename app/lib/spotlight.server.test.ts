import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = vi.hoisted(() => ({
  spotlight: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock("../db.server", () => ({ default: mockDb }));

import {
  getSpotlights,
  createSpotlight,
  deleteSpotlight,
} from "./spotlight.server";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getSpotlights", () => {
  it("returns spotlights for a shop", async () => {
    const mock = [{ id: "1", shop: "test.myshopify.com", badgeText: "Sale" }];
    mockDb.spotlight.findMany.mockResolvedValue(mock);

    const result = await getSpotlights("test.myshopify.com");

    expect(mockDb.spotlight.findMany).toHaveBeenCalledWith({
      where: { shop: "test.myshopify.com" },
      orderBy: { createdAt: "desc" },
    });
    expect(result).toEqual(mock);
  });
});

describe("createSpotlight", () => {
  it("creates a spotlight with default color", async () => {
    const input = {
      shop: "test.myshopify.com",
      productId: "gid://shopify/Product/1",
      productTitle: "Test Product",
      badgeText: "New",
    };
    const mock = { id: "1", ...input, badgeColor: "#008060" };
    mockDb.spotlight.create.mockResolvedValue(mock);

    const result = await createSpotlight(input);

    expect(mockDb.spotlight.create).toHaveBeenCalledWith({
      data: { ...input, badgeColor: "#008060" },
    });
    expect(result).toEqual(mock);
  });
});

describe("deleteSpotlight", () => {
  it("deletes spotlight by id and shop", async () => {
    mockDb.spotlight.deleteMany.mockResolvedValue({ count: 1 });

    await deleteSpotlight("1", "test.myshopify.com");

    expect(mockDb.spotlight.deleteMany).toHaveBeenCalledWith({
      where: { id: "1", shop: "test.myshopify.com" },
    });
  });
});
