import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Defense in depth, not a substitute for a managed secret scanner before release.
const paths = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
const signatures = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:ghp|github_pat)_[a-zA-Z0-9_]{30,}/,
  /(?:SANITY_READ_TOKEN|SANITY_REVALIDATION_TOKEN|SANITY_WEBHOOK_SECRET|SANITY_PREVIEW_SECRET)\s*[:=]\s*["']?[a-zA-Z0-9_-]{24,}/,
];
const violations = [];
for (const path of paths) {
  if (/(?:^|\/)\.env(?:\.|$)/.test(path) && !path.endsWith(".env.example")) {
    violations.push(`${path}: environment file must not be tracked`);
    continue;
  }
  if (!/\.(?:[cm]?[jt]sx?|json|md|ya?ml|example)$/.test(path)) continue;
  let source;
  try {
    source = readFileSync(path, "utf8");
  } catch {
    continue;
  }
  if (signatures.some((signature) => signature.test(source)))
    violations.push(`${path}: potential credential detected`);
}
if (violations.length) {
  console.error(violations.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    "Secret pattern check passed (tracked and non-ignored source files).",
  );
}
