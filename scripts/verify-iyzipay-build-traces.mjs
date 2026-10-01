import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const projectRoot = process.cwd();
const resourcesRoot = resolve(projectRoot, "vendor", "iyzipay", "lib", "resources");
const routes = ["initialize", "continue", "callback", "webhook"];

function collectJavaScriptFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectJavaScriptFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".js")) files.push(path);
  }
  return files;
}

const resourceFiles = collectJavaScriptFiles(resourcesRoot).map((file) =>
  relative(projectRoot, file).split(sep).join("/"),
);
for (const requiredName of ["ApiTest.js", "CheckoutForm.js", "CheckoutFormInitialize.js"]) {
  if (!resourceFiles.some((file) => file.endsWith(`/resources/${requiredName}`))) {
    throw new Error(`Vendored iyzipay resource is missing: ${requiredName}`);
  }
}

for (const route of routes) {
  const tracePath = resolve(
    projectRoot,
    ".next",
    "server",
    "app",
    "api",
    "payments",
    "iyzico",
    route,
    "route.js.nft.json",
  );
  if (!existsSync(tracePath)) throw new Error(`iyzico route trace is missing: ${route}`);

  const trace = JSON.parse(readFileSync(tracePath, "utf8"));
  const traceDirectory = resolve(tracePath, "..");
  const tracedFiles = new Set(
    trace.files.map((file) => relative(projectRoot, resolve(traceDirectory, file)).split(sep).join("/")),
  );
  const missing = resourceFiles.filter((file) => !tracedFiles.has(file));
  if (missing.length > 0) {
    throw new Error(`iyzico route trace ${route} is missing: ${missing.join(", ")}`);
  }
}

console.log(`Verified ${resourceFiles.length} iyzipay resource files in all iyzico route traces`);
