import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <div className="page-container py-16 md:py-20">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors no-underline">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground">{title}</span>
          </nav>

          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold text-foreground mb-3">{title}</h1>
            <p className="text-sm text-muted-foreground mb-10">
              Last updated: {lastUpdated}
            </p>

            {/* Prose content */}
            <div className="legal-prose">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
