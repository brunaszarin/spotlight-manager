import { useState, useCallback } from "react";
import { useNavigate, useSubmit } from "react-router";
import type { ActionFunctionArgs } from "react-router";
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
import { createSpotlight } from "../lib/spotlight.server";

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  await createSpotlight({
    shop: session.shop,
    productId: formData.get("productId") as string,
    productTitle: formData.get("productTitle") as string,
    badgeText: formData.get("badgeText") as string,
    badgeColor: formData.get("badgeColor") as string,
  });

  return Response.redirect(new URL("/app", request.url));
}

export default function NewSpotlight() {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const submit = useSubmit();

  const [productId, setProductId] = useState("");
  const [productTitle, setProductTitle] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [badgeColor, setBadgeColor] = useState({
    hue: 147,
    saturation: 1,
    brightness: 0.5,
  });
  const [error, setError] = useState("");

  const hexColor = hsbToHex(badgeColor);

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
    submit(
      { productId, productTitle, badgeText, badgeColor: hexColor },
      { method: "post" }
    );
  }

  return (
    <Page
      title="Criar Spotlight"
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
                    placeholder="Ex: Novidade, Promoção, Destaque"
                    autoComplete="off"
                  />
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                      Cor do badge
                    </Text>
                    <InlineStack gap="400" blockAlign="center">
                      <ColorPicker
                        onChange={setBadgeColor}
                        color={badgeColor}
                      />
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
                Salvar Spotlight
              </Button>
            </InlineStack>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
