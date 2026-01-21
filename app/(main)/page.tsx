import Link from "next/link";
import "./home.css";

export default function Home() {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to My Store</h1>
          <p className="hero-description">
            Discover amazing products at great prices. Shop now and enjoy fast
            delivery!
          </p>
          <div className="hero-actions">
            <Link href="/products" className="btn-primary-large">
              Browse Products
            </Link>
            <Link href="/register" className="btn-secondary-large">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3 className="feature-title">Fast Delivery</h3>
            <p className="feature-description">
              Get your orders delivered quickly and safely to your doorstep.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💳</div>
            <h3 className="feature-title">Secure Payment</h3>
            <p className="feature-description">
              Shop with confidence using our secure payment system powered by
              Stripe.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⭐</div>
            <h3 className="feature-title">Quality Products</h3>
            <p className="feature-description">
              We offer only the best products from trusted brands and sellers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
