import type { Metadata } from "next";
import ProductsNestClient from "./ProductsNestClient";

export const metadata: Metadata = {
  title: "Products  (NestJS Demo)",
};

export default function ProductsNestPage() {
  return <ProductsNestClient />;
}
