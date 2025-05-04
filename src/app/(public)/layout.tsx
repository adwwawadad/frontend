import Footer from "@/components/Footer";
import Header from "@/components/Header";
import UserTracker from '@/components/UserC'



export default function PublicLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
        <main>
                    <UserTracker />

        <Header />
        {children}
        <Footer />
        </main>

    );
  }