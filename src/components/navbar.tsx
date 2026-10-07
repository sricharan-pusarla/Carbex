"use client";

import Link from "next/link";
import { Leaf, LogOut, User, ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { data: session, status } = useSession();
  const user = session?.user as any;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 mx-auto max-w-7xl justify-between">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="inline-block font-bold text-lg">Carbex</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/marketplace" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Marketplace
            </Link>
            {user?.role === "SELLER" && (
              <Link href="/seller" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Seller Dashboard
              </Link>
            )}
            {user?.role === "BUYER" && (
              <Link href="/dashboard" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
            )}
            {user?.role === "ADMIN" && (
              <Link href="/admin" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Admin Panel
              </Link>
            )}
            <Link
              href="/market-intelligence"
              className={`text-sm font-medium transition-colors hover:text-emerald-600 ${
                pathname === "/market-intelligence" ? "text-emerald-600" : "text-gray-600"
              }`}
            >
              Intelligence
            </Link>
            <Link
              href="/recommender"
              className={`text-sm font-medium transition-colors hover:text-emerald-600 ${
                pathname === "/recommender" ? "text-emerald-600" : "text-gray-600"
              }`}
            >
              AI Assistant
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          {status === "loading" ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded-full" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline" }), "gap-2 rounded-full px-4")}>
                <User className="h-4 w-4" />
                <span className="hidden sm:inline max-w-[120px] truncate">{user?.name}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-xs font-normal text-muted-foreground truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded px-1.5 py-0.5">
                      {user?.role}
                    </span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {user?.role === "BUYER" && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">My Portfolio</Link>
                  </DropdownMenuItem>
                )}
                {user?.role === "SELLER" && (
                  <DropdownMenuItem asChild>
                    <Link href="/seller">Seller Dashboard</Link>
                  </DropdownMenuItem>
                )}
                {user?.role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "rounded-full")}>
                Log in
              </Link>
              <Link href="/register" className={cn(buttonVariants({}), "rounded-full")}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
