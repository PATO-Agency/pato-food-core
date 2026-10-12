import { useState } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Stack,
  Text,
} from "@sanity/ui";
import { useClient } from "sanity";
import { createClient } from "@sanity/client";
import { openDraftPreview } from "./preview-window";

export function createPreviewTool(previewOrigin: string) {
  function PreviewTool() {
    const client = useClient({ apiVersion: "2026-09-18" });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();
    async function openDraft() {
      setBusy(true);
      setError(undefined);
      try {
        // Studio carries its own client major; use this package's client with
        // the existing authenticated session configuration for preview secrets.
        const session = client.config();
        await openDraftPreview(
          previewOrigin,
          createClient({
            projectId: session.projectId,
            dataset: session.dataset,
            apiVersion: "2026-09-18",
            token: session.token,
            withCredentials: true,
            useCdn: false,
          }),
        );
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudo abrir la vista previa.",
        );
      } finally {
        setBusy(false);
      }
    }
    return (
      <Container width={1} padding={4}>
        <Card padding={4} radius={2} border>
          <Stack gap={5}>
            <Heading as="h1" size={2}>
              Revisa tus cambios
            </Heading>
            <Text size={2}>
              Guarda los cambios en el editor y abre el borrador en una nueva
              pestaña. Si Vercel pide acceso, inicia sesión con la cuenta
              autorizada.
            </Text>
            <Flex gap={3} wrap="wrap">
              <Button
                text={busy ? "Abriendo borrador…" : "Abrir borrador"}
                tone="primary"
                disabled={busy}
                onClick={openDraft}
              />
              <Button
                as="a"
                href={new URL("/api/draft/disable", previewOrigin).toString()}
                target="_blank"
                rel="noopener noreferrer"
                text="Ver publicado"
                mode="ghost"
              />
            </Flex>
            {error ? (
              <Card tone="critical" padding={3}>
                <Box role="alert">
                  <Text>{error}</Text>
                </Box>
              </Card>
            ) : null}
            <Text size={1} muted>
              El borrador no se publica al revisarlo. Para volver al contenido
              publicado, pulsa «Salir de vista previa» en la web. Después de
              guardar, recarga la pestaña del borrador.
            </Text>
          </Stack>
        </Card>
      </Container>
    );
  }
  return { name: "preview", title: "Vista previa", component: PreviewTool };
}
