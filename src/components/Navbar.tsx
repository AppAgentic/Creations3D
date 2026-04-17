"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Box, LogOut, LayoutDashboard, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export function Navbar() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const pathname = usePathname();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success("Signed in");
    } catch {
      toast.error("Sign in failed");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out");
    } catch {
      toast.error("Sign out failed");
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

  const routes: Array<{ href: string; label: string; show: boolean }> = [
    { href: "/generate", label: "Generate", show: true },
    { href: "/dashboard", label: "Library", show: !!user },
    { href: "/pricing", label: "Pricing", show: true },
  ];

  return (
    <nav className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-4 pt-4">
        <div className="glass-panel rounded-2xl flex items-center justify-between h-14 pl-4 pr-2">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="relative grid place-items-center size-7 rounded-md bg-accent">
              <Box
                className="size-4 text-accent-foreground"
                strokeWidth={2}
              />
            </div>
            <span className="font-display font-bold text-[15px] tracking-tight">
              Creations3D
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {routes
              .filter((r) => r.show)
              .map((route) => {
                const active = pathname === route.href;
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`relative px-3 py-1.5 text-sm rounded-full transition-colors ${
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-0 rounded-full bg-white/5" />
                    )}
                    <span className="relative">{route.label}</span>
                  </Link>
                );
              })}
          </div>

          <div className="flex items-center gap-2">
            {loading ? (
              <Loader2
                className="size-4 animate-spin text-muted-foreground mr-3"
                strokeWidth={1.5}
              />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full">
                  <Avatar className="size-9 border border-border">
                    <AvatarImage
                      src={user.photoURL || undefined}
                      alt={user.displayName || "User"}
                    />
                    <AvatarFallback className="bg-surface-raised text-xs">
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-60 glass-panel border-border"
                >
                  <div className="px-2 py-2">
                    {user.displayName && (
                      <p className="font-medium text-sm">{user.displayName}</p>
                    )}
                    {user.email && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <LayoutDashboard
                        className="mr-2 size-4"
                        strokeWidth={1.5}
                      />
                      Library
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 size-4" strokeWidth={1.5} />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <button
                  onClick={handleSignIn}
                  className="hidden sm:inline-flex items-center h-9 px-3 text-sm text-muted-foreground hover:text-foreground rounded-full transition-colors"
                >
                  Sign in
                </button>
                <Link
                  href="/generate"
                  className="inline-flex items-center h-9 px-4 bg-accent text-accent-foreground text-sm font-medium rounded-full hover:brightness-110 transition-all"
                >
                  Start free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
