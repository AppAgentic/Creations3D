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
import {
  Box,
  ChevronRight,
  LayoutDashboard,
  Loader2,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";

const navItems = [
  { href: "/generate", label: "Generate" },
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard", label: "Library", authed: true },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  const handleSignIn = async () => {
    try {
      trackEvent("navbar_sign_in_clicked");
      await signInWithGoogle();
      toast.success("Signed in");
    } catch {
      toast.error("Sign in did not complete. Try again.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out");
    } catch {
      toast.error("Could not sign out. Try again.");
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#080a08]/82 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-3 text-white transition-opacity hover:opacity-90"
        >
          <span className="flex size-9 items-center justify-center border border-white/15 bg-white/[0.04] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <Box className="size-5" />
          </span>
          <span className="font-display text-xl font-black tracking-normal">
            Creations3D
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navItems
            .filter((item) => !item.authed || user)
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    trackEvent("navbar_link_clicked", {
                      label: item.label,
                      href: item.href,
                    })
                  }
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "text-primary" : "text-white/58 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="size-5 animate-spin text-white/45" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 gap-2 rounded-none border border-white/10 bg-white/[0.03] px-2 hover:bg-white/[0.07]"
                >
                  <Avatar className="size-7 rounded-none">
                    <AvatarImage
                      src={user.photoURL || undefined}
                      alt={user.displayName || "User"}
                    />
                    <AvatarFallback className="rounded-none bg-primary text-xs font-bold text-primary-foreground">
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-28 truncate text-sm text-white/80 sm:block">
                    {user.displayName || user.email || "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-none">
                <div className="flex items-start gap-3 p-3">
                  <User className="mt-1 size-4 text-muted-foreground" />
                  <div className="min-w-0 space-y-1">
                    {user.displayName && (
                      <p className="truncate text-sm font-medium">
                        {user.displayName}
                      </p>
                    )}
                    {user.email && (
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 size-4" />
                    My models
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={handleSignIn}
                className="hidden rounded-none text-white/70 hover:bg-white/[0.06] hover:text-white sm:inline-flex"
              >
                Sign in
              </Button>
              <Button asChild className="rounded-none">
                <Link
                  href="/pricing"
                  onClick={() =>
                    trackEvent("navbar_primary_cta_clicked", {
                      cta: "get_credits",
                    })
                  }
                >
                  Get credits
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
