import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { deleteSpotlightsByProduct } from "../lib/spotlight.server";

export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop, payload } = await authenticate.webhook(request);

  if (topic !== "PRODUCTS_DELETE") {
    return new Response("Unhandled topic", { status: 404 });
  }

  const productId = (payload as { admin_graphql_api_id: string })
    .admin_graphql_api_id;

  await deleteSpotlightsByProduct(productId, shop);

  return new Response("OK", { status: 200 });
}
