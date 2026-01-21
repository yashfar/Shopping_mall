import ProductList from "./ProductList";

export default function ProductsPage() {
    return (
        <div style={{ maxWidth: "1200px", margin: "50px auto", padding: "20px" }}>
            <div style={{ marginBottom: "40px" }}>
                <h1 style={{ marginBottom: "10px" }}>Our Products</h1>
                <p style={{ color: "#666", fontSize: "16px" }}>
                    Browse our collection of products
                </p>
            </div>

            <ProductList />
        </div>
    );
}
