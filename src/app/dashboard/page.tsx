"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
  const { user, loading: authLoading } = useAuth();
  const [models, setModels] = useState<SavedModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<SavedModel | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const credits = 47; // Demo value - will be from Whop

  useEffect(() => {
    if (!authLoading) {
      fetchModels();
    }
  }, [authLoading, user]);

  const fetchModels = async () => {
    const userId = user?.uid || "anonymous";
    try {
      const response = await fetch(`/api/models/list?userId=${userId}`);
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

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your generations and account
              </p>
            </div>
            <Button asChild>
              <Link href="/generate">
                <Plus className="mr-2 h-4 w-4" />
                New Generation
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Available Credits
                    </p>
                    <p className="text-2xl font-bold">{credits}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Cuboid className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Saved Models
                    </p>
                    <p className="text-2xl font-bold">
                      {isLoading ? "..." : models.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold">
                      {isLoading ? "..." : models.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Saved Models */}
          <Card>
            <CardHeader>
              <CardTitle>Your 3D Models</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 py-4">
                      <Skeleton className="h-16 w-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : models.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No saved models yet
                  </p>
                  <Button asChild>
                    <Link href="/generate">Create your first 3D model</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {models.map((model, index) => (
                    <div key={model.key}>
                      <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                            <Cuboid className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1 max-w-md">
                              {extractNameFromKey(model.key)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {model.format.toUpperCase()}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatFileSize(model.size)}
                              </span>
                              {model.lastModified && (
                                <span className="text-sm text-muted-foreground">
                                  •{" "}
                                  {formatTimeAgo(new Date(model.lastModified))}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(model)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={model.url} download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                      {index < models.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Model Viewer Dialog */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedModel
                ? extractNameFromKey(selectedModel.key)
                : "3D Model"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 h-full">
            {selectedModel && (
              <div className="w-full h-[calc(80vh-100px)] rounded-lg overflow-hidden">
                <ModelViewer modelUrl={selectedModel.url} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
