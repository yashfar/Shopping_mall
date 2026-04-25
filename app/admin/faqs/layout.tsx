import Navbar from "@@/components/Navbar";

export default function FaqsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Navbar />
            <main>{children}</main>
        </>
    );
}
