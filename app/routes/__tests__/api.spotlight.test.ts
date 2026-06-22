import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = vi.hoisted(() => ({
  spotlight: {
    findFirst: vi.fn(),
  },
}));

vi.mock("../../db.server", () => ({ default: mockDb }));

import { loader } from "../api.spotlight";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(params: Record<string, string>) {
  const url = new URL("https://example.com/api/spotlight");
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new Request(url);
}

function createLoaderArgs(request: Request) {
  return {
    request,
    params: {},
    context: {},
    url: new URL(request.url),
    pattern: undefined as any,
  };
}

describe("api.spotlight loader", () => {
  it("returns 400 when shop is missing", async () => {
    const request = makeRequest({ productId: "gid://shopify/Product/1" });

    const response = await loader(createLoaderArgs(request));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it("returns 400 when productId is missing", async () => {
    const request = makeRequest({ shop: "test.myshopify.com" });

    const response = await loader(createLoaderArgs(request));
    const body = await response.json();

    expect(response.status).toBe(400);
  });

  it("returns spotlight null when none exists", async () => {
    mockDb.spotlight.findFirst.mockResolvedValue(null);

    const request = makeRequest({
      shop: "test.myshopify.com",
      productId: "gid://shopify/Product/1",
    });

    const response = await loader(createLoaderArgs(request));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.spotlight).toBeNull();
  });

  it("returns spotlight data when found", async () => {
    mockDb.spotlight.findFirst.mockResolvedValue({
      badgeText: "Promoção",
      badgeColor: "#FF0000",
      isActive: true,
    });

    const request = makeRequest({
      shop: "test.myshopify.com",
      productId: "gid://shopify/Product/1",
    });

    const response = await loader(createLoaderArgs(request));
    const body = await response.json();

    expect(mockDb.spotlight.findFirst).toHaveBeenCalledWith({
      where: {
        shop: "test.myshopify.com",
        productId: "gid://shopify/Product/1",
        isActive: true,
      },
    });
    expect(body.spotlight).toEqual({
      badgeText: "Promoção",
      badgeColor: "#FF0000",
    });
  });

  it("includes CORS header on every response", async () => {
    mockDb.spotlight.findFirst.mockResolvedValue(null);

    const request = makeRequest({
      shop: "test.myshopify.com",
      productId: "gid://shopify/Product/1",
    });

    const response = await loader(createLoaderArgs(request));

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});