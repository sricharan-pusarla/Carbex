import { Leaf } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2">
              <Leaf className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">Carbex</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              Trusted Carbon Credit Marketplace. Discover, evaluate, and retire carbon credits with a data-driven Carbon Trust Score.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold">Platform</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/marketplace" className="hover:text-foreground">Marketplace</Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-foreground">Projects</Link>
              </li>
              <li>
                <Link href="/market-intelligence" className="hover:text-foreground">Analytics</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold">Resources</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-foreground">Trust Score Methodology</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">Verification Standards</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">Documentation</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold">Company</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-foreground">About Us</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">Careers</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">Contact</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Carbex. For Demo Purposes Only.</p>
        </div>
      </div>
    </footer>
  );
}
