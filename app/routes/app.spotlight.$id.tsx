import { useState, useCallback, useEffect } from "react";
import { useNavigate, useFetcher, useLoaderData } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Banner,
  ColorPicker,
  hsbToHex,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getSpotlight, updateSpotlight } from "../lib/spotlight.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const spotlight = await getSpotlight(params.id as string, session.shop);

  if (!spotlight) {
    throw new Response("Spotlight não encontrado", { status: 404 });
  }

  return { spotlight };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  await updateSpotlight(params.id as string, session.shop, {
    productId: formData.get("productId") as string,
    productTitle: formData.get("productTitle") as string,
    badgeText: formData.get("badgeText") as string,
    badgeColor: formData.get("badgeColor") as string,
  });

return { ok: true };
}

function hexToHsb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  const brightness = max;
  const saturation = max === 0 ? 0 : delta / max;

  return { hue, saturation, brightness };
}

export default function EditSpotlight() {
  const { spotlight } = useLoaderData<typeof loader>();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();

  const [productId, setProductId] = useState(spotlight.productId);
  const [productTitle, setProductTitle] = useState(spotlight.productTitle);
  const [badgeText, setBadgeText] = useState(spotlight.badgeText);
  const [badgeColor, setBadgeColor] = useState(hexToHsb(spotlight.badgeColor));
  const [error, setError] = useState("");

  const hexColor = hsbToHex(badgeColor);

useEffect(() => {
  if (fetcher.data?.ok) {
    navigate("/app");
  }
}, [fetcher.data, navigate]);

  const handleSelectProduct = useCallback(async () => {
    const selected = await shopify.resourcePicker({
      type: "product",
      multiple: false,
    });
    if (selected && selected.length > 0) {
      const product = selected[0];
      setProductId(product.id);
      setProductTitle(product.title);
    }
  }, [shopify]);

  function handleSubmit() {
    if (!productId) {
      setError("Selecione um produto antes de continuar.");
      return;
    }
    if (!badgeText.trim()) {
      setError("O texto do badge é obrigatório.");
      return;
    }
    setError("");
    fetcher.submit(
      { productId, productTitle, badgeText, badgeColor: hexColor },
      { method: "post" }
    );
  }

  return (
    <Page
      title="Editar Spotlight"
      backAction={{ content: "Spotlights", onAction: () => navigate("/app") }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {error && (
              <Banner tone="critical" onDismiss={() => setError("")}>
                {error}
              </Banner>
            )}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Produto
                </Text>
                <InlineStack gap="300" align="start" blockAlign="center">
                  <Button onClick={handleSelectProduct}>
                    {productTitle ? "Trocar produto" : "Selecionar produto"}
                  </Button>
                  {productTitle && (
                    <Text as="span" variant="bodyMd">
                      {productTitle}
                    </Text>
                  )}
                </InlineStack>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Badge
                </Text>
                <FormLayout>
                  <TextField
                    label="Texto do badge"
                    value={badgeText}
                    onChange={setBadgeText}
                    autoComplete="off"
                  />
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                      Cor do badge
                    </Text>
                    <InlineStack gap="400" blockAlign="center">
                      <ColorPicker onChange={setBadgeColor} color={badgeColor} />
                      <BlockStack gap="100">
                        <span
                          style={{
                            display: "inline-block",
                            width: 48,
                            height: 48,
                            borderRadius: 8,
                            backgroundColor: hexColor,
                            border: "1px solid #ccc",
                          }}
                        />
                        <Text as="span" variant="bodySm" tone="subdued">
                          {hexColor}
                        </Text>
                      </BlockStack>
                    </InlineStack>
                  </BlockStack>
                </FormLayout>
              </BlockStack>
            </Card>
            <InlineStack align="end" gap="300">
              <Button onClick={() => navigate("/app")}>Cancelar</Button>
              <Button variant="primary" onClick={handleSubmit}>
                Salvar alterações
              </Button>
            </InlineStack>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}