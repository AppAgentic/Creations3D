"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Cuboid,
  Download,
  Clock,
  CreditCard,
  Plus,
  Image as ImageIcon,
  Loader2,
  Eye,
  LogIn,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { authFetch } from "@/lib/api-client";

// Dynamically import ModelViewer to avoid SSR issues
const ModelViewer = dynamic(
  () => import("@/components/ModelViewer").then((mod) => mod.ModelViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

interface SavedModel {
  key: string;
  url: string;
  size?: number;
  lastModified?: string;
  format: string;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractNameFromKey(key: string): string {
  const filename = key.split("/").pop() || key;
  return filename.replace(/\.(glb|obj)$/, "");
}

export default function DashboardPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [models, setModels] = useState<SavedModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<SavedModel | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    if (!authLoading && user) {
      fetchModels();
      fetchCredits();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [authLoading, user]);

  const fetchCredits = async () => {
    try {
      const response = await authFetch("/api/user/credits");
      const data = await response.json();
      if (response.ok) {
        setCredits(data.credits);
      }
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await authFetch("/api/models/list");
      const data = await response.json();

      if (data.success) {
        setModels(data.models);
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
      toast.error("Failed to load your models");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (model: SavedModel) => {
    setSelectedModel(model);
    setIsViewerOpen(true);
  };

  // Auth gate
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen relative">
        <Navbar />
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[oklch(0.5_0.18_265_/_0.06)] blur-[120px]" />
        </div>
        <main className="relative pt-32 pb-12 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="h-20 w-20 rounded-2xl glass glass-border flex items-center justify-center mx-auto mb-6">
              <LogIn className="h-10 w-10 text-[oklch(0.7_0.18_265)]" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Sign in to View Dashboard</h1>
            <p className="text-muted-foreground mb-8">
              Access your saved models and manage your account.
            </p>
            <Button size="lg" className="glow-sm" onClick={() => signInWithGoogle()}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <Navbar />

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-[400px] h-[300px] rounded-full bg-[oklch(0.4_0.15_265_/_0.04)] blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full bg-[oklch(0.4_0.12_300_/_0.03)] blur-[100px]" />
      </div>

      <main className="relative pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your generations and account
              </p>
            </div>
            <Button className="glow-sm hover:glow-md transition-shadow" asChild>
              <Link href="/generate">
                <Plus className="mr-2 h-4 w-4" />
                New Generation
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {[
              {
                icon: CreditCard,
                label: "Available Credits",
                value: credits,
                color: "265",
              },
              {
                icon: Cuboid,
                label: "Saved Models",
                value: isLoading ? "..." : models.length,
                color: "300",
              },
              {
                icon: Clock,
                label: "This Month",
                value: isLoading ? "..." : models.length,
                color: "200",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl glass glass-border p-5 flex items-center gap-4"
              >
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `oklch(0.7 0.18 ${stat.color} / 0.12)` }}
                >
                  <stat.icon
                    className="h-6 w-6"
                    style={{ color: `oklch(0.7 0.18 ${stat.color})` }}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Saved Models */}
          <div className="rounded-2xl glass glass-border p-6">
            <h2 className="font-semibold mb-5">Your 3D Models</h2>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 py-4 animate-pulse">
                    <div className="h-14 w-14 rounded-xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 bg-muted rounded" />
                      <div className="h-3 w-32 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : models.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 rounded-2xl glass glass-border flex items-center justify-center mx-auto mb-5">
                  <Sparkles className="h-8 w-8 text-[oklch(0.7_0.18_265)]" />
                </div>
                <p className="text-muted-foreground mb-2">
                  No saved models yet
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Generate your first 3D model to see it here
                </p>
                <Button className="glow-sm" asChild>
                  <Link href="/generate">Create your first 3D model</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {models.map((model, index) => (
                  <div key={model.key}>
                    <div className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-accent/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
                          <Cuboid className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm line-clamp-1 max-w-md">
                            {extractNameFromKey(model.key)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {model.format.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(model.size)}
                            </span>
                            {model.lastModified && (
                              <span className="text-xs text-muted-foreground">
                                • {formatTimeAgo(new Date(model.lastModified))}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border/50"
                          onClick={() => handleView(model)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="border-border/50" asChild>
                          <a href={model.url} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                    {index < models.length - 1 && <Separator className="opacity-30" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Model Viewer Dialog */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl h-[80vh] glass glass-border">
          <DialogHeader>
            <DialogTitle>
              {selectedModel
                ? extractNameFromKey(selectedModel.key)
                : "3D Model"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 h-full">
            {selectedModel && (
              <div className="w-full h-[calc(80vh-100px)] rounded-xl overflow-hidden border border-border/30">
                <ModelViewer modelUrl={selectedModel.url} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
