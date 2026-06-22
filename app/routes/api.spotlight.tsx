import type { LoaderFunctionArgs } from "react-router";
import db from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("productId");

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (!shop || !productId) {
    return new Response(
      JSON.stringify({ error: "shop and productId are required" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const spotlight = await db.spotlight.findFirst({
    where: { shop, productId, isActive: true },
  });

  if (!spotlight) {
    return new Response(JSON.stringify({ spotlight: null }), {
      status: 200,
      headers: corsHeaders,
    });
  }

  return new Response(
    JSON.stringify({
      spotlight: {
        badgeText: spotlight.badgeText,
        badgeColor: spotlight.badgeColor,
      },
    }),
    { status: 200, headers: corsHeaders }
  );
}