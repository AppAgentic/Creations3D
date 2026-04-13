"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cuboid } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getInitials = (name: string | null) => {
  if (!name) return "U";
  return name.slice(0, 2).toUpperCase();
};

export function Navbar() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const pathname = usePathname();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border/40 bg-background/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Cuboid className="h-5 w-5" />
          <span className="text-sm font-semibold tracking-tight">Creations3D</span>
        </Link>
      </div>

      <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex items-center gap-6">
        <Link
          href="/generate"
          className={`text-[13px] font-medium transition-colors hover:text-foreground ${
            pathname === "/generate" ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          Generate
        </Link>
        <Link
          href="/pricing"
          className={`text-[13px] font-medium transition-colors hover:text-foreground ${
            pathname === "/pricing" ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          Pricing
        </Link>
        {user && (
          <Link
            href="/dashboard"
            className={`text-[13px] font-medium transition-colors hover:text-foreground ${
              pathname === "/dashboard" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Dashboard
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-3">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-opacity hover:opacity-80">
                <Avatar className="h-8 w-8 border border-border/50">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User avatar"} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px]">
                    {getInitials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none truncate">{user.displayName || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/generate">Generate Models</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-500 focus:text-red-500">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignIn}
              className="hidden md:inline-flex text-sm h-8 px-3"
            >
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={handleSignIn}
              className="text-sm h-8 px-4 rounded-full"
            >
              Get Started
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
