import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const packageRoot = dirname(require.resolve("iyzipay/package.json"));
const source = join(packageRoot, "lib");
const destination = resolve(process.cwd(), "vendor", "iyzipay", "lib");

rmSync(destination, { recursive: true, force: true });
mkdirSync(dirname(destination), { recursive: true });
cpSync(source, destination, { recursive: true, dereference: true });

const resourceBase = join(destination, "IyzipayResource.js");
const resourceSource = readFileSync(resourceBase, "utf8");
const dependencyImport = "const request = require('postman-request');";
if (!resourceSource.includes(dependencyImport)) {
  throw new Error("Unexpected iyzipay IyzipayResource.js dependency import");
}
writeFileSync(
  resourceBase,
  resourceSource.replace(
    dependencyImport,
    "const packageRequire = require('module').createRequire(require.resolve('iyzipay/package.json'));\nconst request = packageRequire('postman-request');",
  ),
);

console.log("Prepared iyzipay runtime in vendor/iyzipay/lib");
