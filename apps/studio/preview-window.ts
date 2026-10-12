import type { SanityClient } from "@sanity/client";
import { createPreviewSecret } from "@sanity/preview-url-secret/create-secret";

export async function openDraftPreview(
  origin: string,
  client: SanityClient,
): Promise<void> {
  const target = new URL(origin);
  const local =
    target.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
  if (
    (target.protocol !== "https:" && !local) ||
    target.search ||
    target.hash ||
    target.username ||
    target.password
  )
    throw new Error(
      "La URL de vista previa debe ser un origen limpio y seguro.",
    );
  // Open synchronously during the click so browsers do not block the async navigation.
  const popup = window.open("", "_blank");
  if (!popup)
    throw new Error(
      "Permite abrir una nueva pestaña para revisar el borrador.",
    );
  popup.opener = null;
  try {
    const { secret } = await createPreviewSecret(
      client,
      "pato-food-studio",
      window.location.origin,
    );
    const url = new URL("/api/draft/enable", target.origin);
    url.searchParams.set("sanity-preview-secret", secret);
    url.searchParams.set("sanity-preview-pathname", "/");
    popup.location.assign(url.toString());
  } catch {
    popup.close();
    throw new Error(
      "No se pudo abrir el borrador. Comprueba tu sesión de Sanity y vuelve a intentarlo.",
    );
  }
}
