import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const runtimeRoot = resolve(process.cwd(), "vendor", "iyzipay", "lib");
const requiredFiles = [
  join(runtimeRoot, "resources", "CheckoutForm.js"),
  join(runtimeRoot, "resources", "CheckoutFormInitialize.js"),
  join(runtimeRoot, "IyzipayResource.js"),
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
assertRealTree(runtimeRoot);
if (!readFileSync(join(runtimeRoot, "IyzipayResource.js"), "utf8").includes("packageRequire('postman-request')")) {
  throw new Error("Vendored iyzipay dependency bridge is missing");
}

console.log("Verified project-owned iyzipay runtime");
