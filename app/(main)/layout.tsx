import Navbar from "@@/components/Navbar";
import Footer from "@@/components/Footer";
import MainPageFrame from "@@/components/MainPageFrame";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <MainPageFrame navbar={<Navbar />}>
                {children}
            </MainPageFrame>
            <Footer />
        </>
    );
}
