const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function trustedStudioOrigin(value: string | undefined) {
  const configured = value?.trim();
  if (!configured) return undefined;

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error("PATO_STUDIO_ORIGIN must be an absolute origin");
  }

  const isHttps = url.protocol === "https:";
  const isLocalHttp =
    url.protocol === "http:" && loopbackHosts.has(url.hostname);
  if (
    (!isHttps && !isLocalHttp) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "PATO_STUDIO_ORIGIN must be an exact HTTPS origin or loopback HTTP origin",
    );

  return url.origin;
}

export function frameAncestorsDirective(studioOrigin: string | undefined) {
  const trustedOrigin = trustedStudioOrigin(studioOrigin);
  return `frame-ancestors 'self'${trustedOrigin ? ` ${trustedOrigin}` : ""}`;
}
