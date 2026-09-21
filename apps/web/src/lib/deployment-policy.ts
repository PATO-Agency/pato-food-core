const loopbackHostnames = new Set(["localhost", "127.0.0.1", "::1"]);

function normalizeHostname(authority: string): string {
  let hostname = authority.trim().toLowerCase();
  if (hostname.startsWith("[")) {
    const closingBracket = hostname.indexOf("]");
    if (closingBracket > 0) hostname = hostname.slice(1, closingBracket);
  } else if ((hostname.match(/:/g) ?? []).length === 1) {
    hostname = hostname.split(":", 1)[0] ?? hostname;
  }
  return hostname.replace(/\.$/, "");
}

export function mayServeRequest({
  hostnames,
  visibility,
  hostedPreview,
  runtimeEnvironment,
  localInternal,
}: {
  hostnames: string[];
  visibility: string | undefined;
  hostedPreview: string | undefined;
  runtimeEnvironment: string | undefined;
  localInternal: string | undefined;
}): boolean {
  const resolvedVisibility = visibility?.trim() || "internal";
  if (resolvedVisibility === "public") return true;
  if (
    resolvedVisibility === "internal" &&
    hostedPreview?.trim() === "authenticated"
  )
    return true;
  if (resolvedVisibility !== "internal") return false;
  if (
    runtimeEnvironment !== "development" &&
    localInternal?.trim() !== "confirmed"
  )
    return false;
  const assertedHostnames = hostnames.filter((hostname) => hostname.trim());
  return (
    assertedHostnames.length > 0 &&
    assertedHostnames.every((hostname) =>
      loopbackHostnames.has(normalizeHostname(hostname)),
    )
  );
}
