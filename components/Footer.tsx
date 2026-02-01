export default function Footer() {
    return (
        <footer className="bg-white text-[#A9A9A9] mt-auto border-t border-gray-200">
            <div className="max-w-[1400px] mx-auto px-6 md:px-8 py-12 md:py-16 pb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
                    {/* Company Info */}
                    <div className="flex flex-col gap-5">
                        <h3 className="text-2xl font-extrabold text-[#1A1A1A] m-0 tracking-tight">My Store</h3>
                        <p className="text-[#A9A9A9] text-[0.95rem] leading-relaxed m-0">
                            Your trusted online shopping destination for quality products.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-col gap-5">
                        <h4 className="text-[1.1rem] font-bold text-[#1A1A1A] m-0 mb-2">Quick Links</h4>
                        <ul className="list-none p-0 m-0 flex flex-col gap-3">
                            <li>
                                <a href="/products" className="text-[#A9A9A9] no-underline text-[0.9rem] font-medium transition-all duration-200 hover:text-[#C8102E] hover:translate-x-1 inline-block">
                                    Products
                                </a>
                            </li>
                            <li>
                                <a href="/orders" className="text-[#A9A9A9] no-underline text-[0.9rem] font-medium transition-all duration-200 hover:text-[#C8102E] hover:translate-x-1 inline-block">
                                    Orders
                                </a>
                            </li>
                            <li>
                                <a href="/cart" className="text-[#A9A9A9] no-underline text-[0.9rem] font-medium transition-all duration-200 hover:text-[#C8102E] hover:translate-x-1 inline-block">
                                    Cart
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="flex flex-col gap-5">
                        <h4 className="text-[1.1rem] font-bold text-[#1A1A1A] m-0 mb-2">Support</h4>
                        <ul className="list-none p-0 m-0 flex flex-col gap-3">
                            <li>
                                <a href="/contact" className="text-[#A9A9A9] no-underline text-[0.9rem] font-medium transition-all duration-200 hover:text-[#C8102E] hover:translate-x-1 inline-block">
                                    Contact Us
                                </a>
                            </li>
                            <li>
                                <a href="/faq" className="text-[#A9A9A9] no-underline text-[0.9rem] font-medium transition-all duration-200 hover:text-[#C8102E] hover:translate-x-1 inline-block">
                                    FAQ
                                </a>
                            </li>
                            <li>
                                <a href="/shipping" className="text-[#A9A9A9] no-underline text-[0.9rem] font-medium transition-all duration-200 hover:text-[#C8102E] hover:translate-x-1 inline-block">
                                    Shipping Info
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="flex flex-col gap-5">
                        <h4 className="text-[1.1rem] font-bold text-[#1A1A1A] m-0 mb-2">Legal</h4>
                        <ul className="list-none p-0 m-0 flex flex-col gap-3">
                            <li>
                                <a href="/privacy" className="text-[#A9A9A9] no-underline text-[0.9rem] font-medium transition-all duration-200 hover:text-[#C8102E] hover:translate-x-1 inline-block">
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a href="/terms" className="text-[#A9A9A9] no-underline text-[0.9rem] font-medium transition-all duration-200 hover:text-[#C8102E] hover:translate-x-1 inline-block">
                                    Terms of Service
                                </a>
                            </li>
                            <li>
                                <a href="/returns" className="text-[#A9A9A9] no-underline text-[0.9rem] font-medium transition-all duration-200 hover:text-[#C8102E] hover:translate-x-1 inline-block">
                                    Returns
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="pt-8 border-t border-[#A9A9A9]/20 text-center">
                    <p className="text-[#A9A9A9] text-sm m-0 font-medium">
                        © {new Date().getFullYear()} My Store. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
