import { lstatSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);

const vendorRoot = resolve(process.cwd(), "vendor", "iyzipay");
const runtimeRoot = join(vendorRoot, "lib");
const requiredFiles = [
  join(runtimeRoot, "resources", "ApiTest.js"),
  join(runtimeRoot, "resources", "CheckoutForm.js"),
  join(runtimeRoot, "resources", "CheckoutFormInitialize.js"),
  join(runtimeRoot, "IyzipayResource.js"),
  join(vendorRoot, "resource-manifest.js"),
  join(vendorRoot, "node_modules", "postman-request", "package.json"),
];

function assertRealTree(directory) {
  const entry = lstatSync(directory);
  if (entry.isSymbolicLink()) throw new Error(`Symlink is not allowed: ${directory}`);
  if (!entry.isDirectory()) return;
  for (const child of readdirSync(directory)) assertRealTree(join(directory, child));
}

for (const file of requiredFiles) {
  const entry = lstatSync(file);
  if (!entry.isFile() || entry.isSymbolicLink()) {
    throw new Error(`Required iyzipay runtime file is not a real file: ${file}`);
  }
}
assertRealTree(vendorRoot);

const Iyzipay = require("iyzipay");
Iyzipay.setRuntimeResources(require(join(vendorRoot, "resource-manifest.js")));
const client = new Iyzipay({
  apiKey: "build-verification",
  secretKey: "build-verification",
  uri: "https://sandbox-api.iyzipay.com",
});
if (!client.checkoutForm || !client.checkoutFormInitialize) {
  throw new Error("Vendored iyzipay Checkout Form resources did not initialize");
}

console.log("Verified project-owned iyzipay runtime");
