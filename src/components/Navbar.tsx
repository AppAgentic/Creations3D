"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Cuboid, LogOut, LayoutDashboard, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export function Navbar() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 mt-3">
        <div className="max-w-7xl mx-auto glass-surface rounded-2xl px-4 sm:px-5">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-cyan/10 flex items-center justify-center group-hover:bg-cyan/15 transition-colors">
                <Cuboid className="h-4.5 w-4.5 text-cyan" />
              </div>
              <span className="font-semibold text-[15px] tracking-tight">
                Creations3D
              </span>
            </Link>

            {/* Center nav */}
            <div className="hidden md:flex items-center gap-0.5 bg-muted/40 rounded-xl p-1">
              {[
                { href: "/generate", label: "Generate" },
                { href: "/pricing", label: "Pricing" },
                ...(user ? [{ href: "/dashboard", label: "Library" }] : []),
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-background/60 transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2.5">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full ring-1 ring-border/40 hover:ring-cyan/40 transition-all"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.photoURL || undefined}
                          alt={user.displayName || "User"}
                        />
                        <AvatarFallback className="bg-cyan/10 text-cyan text-xs font-medium">
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-52 glass-card"
                  >
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-0.5 leading-none">
                        {user.displayName && (
                          <p className="font-medium text-sm">
                            {user.displayName}
                          </p>
                        )}
                        {user.email && (
                          <p className="text-[11px] text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-border/30" />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center">
                        <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
                        Library
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/30" />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-3.5 w-3.5" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground text-[13px] h-8"
                    onClick={handleSignIn}
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 px-4 text-[13px] glow-sm hover:glow-md transition-all"
                    asChild
                  >
                    <Link href="/generate">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
