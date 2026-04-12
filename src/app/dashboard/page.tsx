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
  Coins,
  Plus,
  Loader2,
  Eye,
  LogIn,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { authFetch } from "@/lib/api-client";

const ModelViewer = dynamic(
  () => import("@/components/ModelViewer").then((mod) => mod.ModelViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-cyan/50" />
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
  if (!bytes) return "—";
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
      if (response.ok) setCredits(data.credits);
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await authFetch("/api/models/list");
      const data = await response.json();
      if (data.success) setModels(data.models);
    } catch (error) {
      console.error("Failed to fetch models:", error);
      toast.error("Failed to load your models");
    } finally {
      setIsLoading(false);
    }
  };

  // Auth gate
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen relative">
        <Navbar />
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full bg-[oklch(0.35_0.12_195_/_0.06)] blur-[120px]" />
        </div>
        <main className="relative pt-36 pb-12 px-4">
          <div className="max-w-sm mx-auto text-center">
            <div className="h-16 w-16 rounded-2xl bg-cyan/10 flex items-center justify-center mx-auto mb-5">
              <LogIn className="h-8 w-8 text-cyan" />
            </div>
            <h1 className="text-xl font-bold mb-2">Sign in to View Library</h1>
            <p className="text-[14px] text-muted-foreground mb-7">
              Access your saved models and manage your account.
            </p>
            <Button className="glow-sm h-10 text-[13px]" onClick={() => signInWithGoogle()}>
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

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-[10%] w-[350px] h-[250px] rounded-full bg-[oklch(0.35_0.12_195_/_0.04)] blur-[100px]" />
      </div>

      <main className="relative pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-cyan/8 flex items-center justify-center">
                <LayoutGrid className="h-4.5 w-4.5 text-cyan" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Library</h1>
                <p className="text-[12px] text-muted-foreground">Your saved 3D models</p>
              </div>
            </div>
            <Button className="h-9 text-[13px] glow-sm hover:glow-md transition-all" asChild>
              <Link href="/generate">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: Coins, label: "Credits", value: credits, accent: "195" },
              { icon: Cuboid, label: "Models", value: isLoading ? "..." : models.length, accent: "290" },
              { icon: Clock, label: "This Month", value: isLoading ? "..." : models.length, accent: "330" },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-xl p-4 flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `oklch(0.65 0.18 ${s.accent} / 0.1)` }}
                >
                  <s.icon className="h-4 w-4" style={{ color: `oklch(0.75 0.18 ${s.accent})` }} />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold tabular-nums">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Models */}
          <div className="glass-card rounded-2xl">
            <div className="px-5 py-3.5 border-b border-border/15">
              <span className="text-[13px] font-medium">All Models</span>
            </div>

            <div className="p-2">
              {isLoading ? (
                <div className="space-y-1 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-3 px-3 animate-pulse">
                      <div className="h-10 w-10 rounded-lg bg-muted/50" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-40 bg-muted/50 rounded" />
                        <div className="h-2.5 w-28 bg-muted/30 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : models.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="h-14 w-14 rounded-2xl bg-cyan/8 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-7 w-7 text-cyan/60" />
                  </div>
                  <p className="text-[14px] font-medium mb-1">No models yet</p>
                  <p className="text-[12px] text-muted-foreground mb-5">
                    Generate your first 3D model to see it here
                  </p>
                  <Button className="h-9 text-[13px] glow-sm" asChild>
                    <Link href="/generate">Create your first model</Link>
                  </Button>
                </div>
              ) : (
                <div>
                  {models.map((model, index) => (
                    <div key={model.key}>
                      <div className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-accent/30 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted/30 flex items-center justify-center group-hover:bg-muted/50 transition-colors">
                            <Cuboid className="h-5 w-5 text-muted-foreground/60" />
                          </div>
                          <div>
                            <p className="text-[13px] font-medium line-clamp-1 max-w-md">
                              {extractNameFromKey(model.key)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium">
                                {model.format.toUpperCase()}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground tabular-nums">
                                {formatFileSize(model.size)}
                              </span>
                              {model.lastModified && (
                                <span className="text-[11px] text-muted-foreground">
                                  • {formatTimeAgo(new Date(model.lastModified))}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 border-border/30"
                            onClick={() => { setSelectedModel(model); setIsViewerOpen(true); }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-border/30" asChild>
                            <a href={model.url} download>
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      </div>
                      {index < models.length - 1 && <Separator className="opacity-10 mx-3" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl h-[80vh] glass-card">
          <DialogHeader>
            <DialogTitle className="text-[15px]">
              {selectedModel ? extractNameFromKey(selectedModel.key) : "3D Model"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 h-full">
            {selectedModel && (
              <div className="w-full h-[calc(80vh-80px)] rounded-xl overflow-hidden border border-border/15">
                <ModelViewer modelUrl={selectedModel.url} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
