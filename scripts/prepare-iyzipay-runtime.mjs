import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const packageRoot = dirname(require.resolve("iyzipay/package.json"));
const source = join(packageRoot, "lib");
const vendorRoot = resolve(process.cwd(), "vendor", "iyzipay");
const destination = join(vendorRoot, "lib");

rmSync(vendorRoot, { recursive: true, force: true });
mkdirSync(vendorRoot, { recursive: true });
cpSync(source, destination, { recursive: true, dereference: true });

const resourcesRoot = join(destination, "resources");
const resourceFiles = readdirSync(resourcesRoot)
  .filter((fileName) => fileName.endsWith(".js"))
  .sort();
const resourceManifest = [
  '"use strict";',
  "",
  "module.exports = {",
  ...resourceFiles.map((fileName) => {
    const resourceName = fileName.slice(0, -3);
    return `  ${JSON.stringify(resourceName)}: require(${JSON.stringify(`./lib/resources/${fileName}`)}),`;
  }),
  "};",
  "",
].join("\n");
writeFileSync(join(vendorRoot, "resource-manifest.js"), resourceManifest, "utf8");

function resolvePackageJson(packageName, issuerRequire) {
  try {
    return issuerRequire.resolve(`${packageName}/package.json`);
  } catch {
    let current = dirname(issuerRequire.resolve(packageName));
    while (current !== dirname(current)) {
      const candidate = join(current, "package.json");
      if (existsSync(candidate)) {
        const metadata = JSON.parse(readFileSync(candidate, "utf8"));
        if (metadata.name === packageName) return candidate;
      }
      current = dirname(current);
    }
  }
  throw new Error(`Unable to resolve package metadata for ${packageName}`);
}

function copyPackageTree(packageName, issuerRequire, targetNodeModules, ancestry = new Set(), optional = false) {
  let packageJson;
  try {
    packageJson = resolvePackageJson(packageName, issuerRequire);
  } catch (error) {
    if (optional) return false;
    throw error;
  }

  const sourceRoot = dirname(packageJson);
  const identity = `${packageName}:${sourceRoot}`;
  if (ancestry.has(identity)) return true;

  const targetRoot = join(targetNodeModules, ...packageName.split("/"));
  mkdirSync(targetRoot, { recursive: true });
  for (const entry of readdirSync(sourceRoot)) {
    if (entry === "node_modules") continue;
    cpSync(join(sourceRoot, entry), join(targetRoot, entry), {
      recursive: true,
      dereference: true,
    });
  }

  const metadata = issuerRequire(packageJson);
  const packageRequire = createRequire(packageJson);
  const nextAncestry = new Set(ancestry).add(identity);
  const nestedNodeModules = join(targetRoot, "node_modules");
  for (const dependencyName of Object.keys(metadata.dependencies ?? {})) {
    copyPackageTree(dependencyName, packageRequire, nestedNodeModules, nextAncestry);
  }
  for (const dependencyName of Object.keys(metadata.optionalDependencies ?? {})) {
    copyPackageTree(dependencyName, packageRequire, nestedNodeModules, nextAncestry, true);
  }
  return true;
}

const iyzipayRequire = createRequire(require.resolve("iyzipay/package.json"));
if (!copyPackageTree("postman-request", iyzipayRequire, join(vendorRoot, "node_modules"))) {
  throw new Error("Unable to resolve iyzipay dependency postman-request");
}

console.log("Prepared iyzipay runtime and dependency tree in vendor/iyzipay");
