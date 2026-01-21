import "./footer.css";

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-content">
                    {/* Company Info */}
                    <div className="footer-section">
                        <h3 className="footer-title">My Store</h3>
                        <p className="footer-text">
                            Your trusted online shopping destination for quality products.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-section">
                        <h4 className="footer-heading">Quick Links</h4>
                        <ul className="footer-links">
                            <li>
                                <a href="/products" className="footer-link">
                                    Products
                                </a>
                            </li>
                            <li>
                                <a href="/orders" className="footer-link">
                                    Orders
                                </a>
                            </li>
                            <li>
                                <a href="/cart" className="footer-link">
                                    Cart
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="footer-section">
                        <h4 className="footer-heading">Support</h4>
                        <ul className="footer-links">
                            <li>
                                <a href="/contact" className="footer-link">
                                    Contact Us
                                </a>
                            </li>
                            <li>
                                <a href="/faq" className="footer-link">
                                    FAQ
                                </a>
                            </li>
                            <li>
                                <a href="/shipping" className="footer-link">
                                    Shipping Info
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="footer-section">
                        <h4 className="footer-heading">Legal</h4>
                        <ul className="footer-links">
                            <li>
                                <a href="/privacy" className="footer-link">
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a href="/terms" className="footer-link">
                                    Terms of Service
                                </a>
                            </li>
                            <li>
                                <a href="/returns" className="footer-link">
                                    Returns
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="footer-bottom">
                    <p className="footer-copyright">
                        © {new Date().getFullYear()} My Store. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
