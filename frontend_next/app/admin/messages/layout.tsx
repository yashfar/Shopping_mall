import Navbar from "@@/components/Navbar";

export default function MessagesLayout({
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
