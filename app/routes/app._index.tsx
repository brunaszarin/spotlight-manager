import { useLoaderData, useSubmit } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import {
  Page,
  Layout,
  Card,
  IndexTable,
  Text,
  Badge,
  Button,
  EmptyState,
  InlineStack,
  Box,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getSpotlights, deleteSpotlight } from "../lib/spotlight.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const spotlights = await getSpotlights(session.shop);
  return { spotlights };
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const id = formData.get("id") as string;
  await deleteSpotlight(id, session.shop);
  return { ok: true };
}

export default function Index() {
  const { spotlights } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir este spotlight?")) {
      submit({ id }, { method: "post" });
    }
  }

  const rowMarkup = spotlights.map((spotlight, index) => (
    <IndexTable.Row id={spotlight.id} key={spotlight.id} position={index}>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {spotlight.productTitle}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack gap="200" align="center">
          <Box
            background="bg-surface"
            borderRadius="100"
            padding="100"
            borderColor="border"
            borderWidth="025"
          >
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: spotlight.badgeColor,
              }}
            />
          </Box>
          <Badge>{spotlight.badgeText}</Badge>
        </InlineStack>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={spotlight.isActive ? "success" : "critical"}>
          {spotlight.isActive ? "Ativo" : "Inativo"}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd" tone="subdued">
          {new Date(spotlight.createdAt).toLocaleDateString("pt-BR")}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Button
          tone="critical"
          variant="plain"
          onClick={() => handleDelete(spotlight.id)}
        >
          Excluir
        </Button>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page
      title="Spotlight Manager"
      primaryAction={
        <Button variant="primary" url="/app/spotlight/new">
          Criar Spotlight
        </Button>
      }
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {spotlights.length === 0 ? (
              <EmptyState
                heading="Nenhum spotlight criado ainda"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>
                  Crie seu primeiro spotlight para destacar produtos na sua
                  loja.
                </p>
              </EmptyState>
            ) : (
              <IndexTable
                resourceName={{ singular: "spotlight", plural: "spotlights" }}
                itemCount={spotlights.length}
                headings={[
                  { title: "Produto" },
                  { title: "Badge" },
                  { title: "Status" },
                  { title: "Criado em" },
                  { title: "Ações" },
                ]}
                selectable={false}
              >
                {rowMarkup}
              </IndexTable>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
