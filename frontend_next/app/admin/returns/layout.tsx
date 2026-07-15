import Navbar from "@@/components/Navbar";

export default function ReturnsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <Navbar />
            <main>{children}</main>
        </>
    );
}
