"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export function Navbar() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const pathname = usePathname();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success("Signed in successfully!");
    } catch {
      toast.error("Failed to sign in");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully!");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navLinks = [
    { href: "/generate", label: "Generate" },
    { href: "/pricing", label: "Pricing" },
    ...(user ? [{ href: "/dashboard", label: "Library" }] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center bg-[rgba(5,5,8,0.8)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.04)]">
      <div className="max-w-[1200px] mx-auto w-full px-6 md:px-10 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-[22px] h-[22px] rounded-[5px] bg-gradient-to-br from-aurora to-[#14b8a6] flex items-center justify-center text-[11px] text-background font-extrabold">
            C
          </div>
          <span className="text-[15px] font-bold tracking-[-0.02em] text-white">
            Creations3D
          </span>
        </Link>

        {/* Center nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[13px] font-medium transition-colors ${
                pathname === link.href
                  ? "text-aurora"
                  : "text-[rgba(255,255,255,0.5)] hover:text-[rgba(255,255,255,0.9)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[rgba(255,255,255,0.3)]" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-aurora transition-opacity hover:opacity-80">
                  <Avatar className="h-7 w-7 border border-[rgba(255,255,255,0.08)]">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                    <AvatarFallback className="bg-[rgba(45,212,191,0.1)] text-aurora text-[10px] font-semibold">
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-[#0a0a0f] border-[rgba(255,255,255,0.06)]">
                <div className="flex flex-col space-y-0.5 p-2">
                  <p className="text-sm font-medium truncate">{user.displayName || "User"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.04)]" />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Library</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/generate">Generate</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.04)]" />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:text-red-400">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <button
                onClick={handleSignIn}
                className="hidden md:inline text-[13px] font-medium text-[rgba(255,255,255,0.5)] hover:text-[rgba(255,255,255,0.9)] transition-colors"
              >
                Sign In
              </button>
              <Button
                size="sm"
                className="h-7 px-4 text-[12px] font-semibold bg-aurora text-background hover:bg-aurora-hover transition-all rounded-md"
                asChild
              >
                <Link href="/generate">Start Creating</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
