"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Box,
  Download,
  Plus,
  Loader2,
  Eye,
  ArrowUpRight,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";

const ModelViewer = dynamic(
  () => import("@/components/ModelViewer").then((mod) => mod.ModelViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
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
  if (seconds < 60) return "just now";
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

// Deterministic row-span pattern for asymmetric masonry
const SPAN_PATTERN = [
  "md:row-span-2",
  "",
  "",
  "md:row-span-2",
  "",
  "md:col-span-2",
  "",
  "",
];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [models, setModels] = useState<SavedModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<SavedModel | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const credits = 47;

  useEffect(() => {
    if (!authLoading) fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const fetchModels = async () => {
    const userId = user?.uid || "anonymous";
    try {
      const response = await fetch(`/api/models/list?userId=${userId}`);
      const data = await response.json();
      if (data.success) setModels(data.models);
    } catch {
      toast.error("Failed to load library");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (model: SavedModel) => {
    setSelectedModel(model);
    setIsViewerOpen(true);
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="mx-auto max-w-7xl">
          {/* Header row — asymmetric, no card boxes */}
          <div className="grid grid-cols-12 gap-8 items-end mb-10 md:mb-14">
            <div className="col-span-12 md:col-span-7">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-3">
                library
              </div>
              <h1 className="font-display font-bold text-4xl md:text-6xl tracking-tight text-balance">
                Your 3D library.
              </h1>
              {user && (
                <p className="text-sm text-muted-foreground mt-3 font-mono">
                  {user.email}
                </p>
              )}
            </div>

            {/* Metrics strip — divide-y/x, no cards */}
            <div className="col-span-12 md:col-span-5 grid grid-cols-3 divide-x divide-border">
              <div className="px-4 first:pl-0">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  credits
                </div>
                <div className="font-display font-bold text-3xl mt-1 tabular-nums">
                  {credits}
                </div>
              </div>
              <div className="px-4">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  models
                </div>
                <div className="font-display font-bold text-3xl mt-1 tabular-nums">
                  {isLoading ? "—" : models.length}
                </div>
              </div>
              <div className="px-4">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  this month
                </div>
                <div className="font-display font-bold text-3xl mt-1 tabular-nums">
                  {isLoading ? "—" : models.length}
                </div>
              </div>
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center justify-between mb-6 hairline-b pb-4">
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              {isLoading
                ? "loading…"
                : `${models.length} saved model${
                    models.length === 1 ? "" : "s"
                  }`}
            </div>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 h-10 px-4 bg-accent text-accent-foreground rounded-full text-sm font-medium hover:brightness-110 transition-all"
            >
              <Plus className="size-4" strokeWidth={2} />
              New generation
            </Link>
          </div>

          {/* Library grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 auto-rows-[180px]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-2xl shimmer ${
                    SPAN_PATTERN[i] || ""
                  }`}
                />
              ))}
            </div>
          ) : models.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 auto-rows-[180px]">
              {models.map((model, i) => (
                <ModelCard
                  key={model.key}
                  model={model}
                  spanClass={SPAN_PATTERN[i % SPAN_PATTERN.length]}
                  onView={() => handleView(model)}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-5xl h-[82vh] bg-surface border-border p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 hairline-b">
            <DialogTitle className="font-display font-bold text-xl tracking-tight">
              {selectedModel
                ? extractNameFromKey(selectedModel.key)
                : "3D Model"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 h-full">
            {selectedModel && (
              <div className="w-full h-[calc(82vh-80px)]">
                <ModelViewer modelUrl={selectedModel.url} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────

function ModelCard({
  model,
  spanClass,
  onView,
  index,
}: {
  model: SavedModel;
  spanClass: string;
  onView: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.04, 0.4),
        type: "spring",
        stiffness: 100,
        damping: 20,
      }}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-surface hover:bg-surface-raised transition-colors ${spanClass}`}
    >
      <button
        onClick={onView}
        className="absolute inset-0 grid place-items-center w-full h-full"
        aria-label={`View ${extractNameFromKey(model.key)}`}
      >
        <Box
          className="size-10 text-muted-foreground group-hover:text-accent transition-colors"
          strokeWidth={1}
        />
      </button>

      {/* Hover reveal bar */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium line-clamp-1">
              {extractNameFromKey(model.key)}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-[10px] uppercase text-accent">
                {model.format}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {formatFileSize(model.size)}
              </span>
              {model.lastModified && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  {formatTimeAgo(new Date(model.lastModified))}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="size-7 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur transition-colors"
              title="Preview"
            >
              <Eye className="size-3.5" strokeWidth={1.5} />
            </button>
            <a
              href={model.url}
              download
              onClick={(e) => e.stopPropagation()}
              className="size-7 grid place-items-center rounded-full bg-accent text-accent-foreground hover:brightness-110 transition-all"
              title="Download"
            >
              <Download className="size-3.5" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="relative rounded-3xl border border-border bg-surface overflow-hidden min-h-[480px] grid grid-cols-12 gap-0">
      <div className="col-span-12 md:col-span-7 p-10 md:p-14 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-accent mb-4">
          <Inbox className="size-3.5" strokeWidth={1.5} />
          library is empty
        </div>
        <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight text-balance">
          Nothing here yet.
          <br />
          Let’s fix that.
        </h2>
        <p className="text-sm text-muted-foreground mt-5 max-w-sm">
          Every render you save will drop here — complete with the original
          prompt, source image, and re-download buttons.
        </p>
        <div className="mt-8">
          <Link
            href="/generate"
            className="group inline-flex items-center gap-2 h-11 pl-5 pr-4 bg-accent text-accent-foreground rounded-full text-sm font-medium hover:brightness-110 transition-all"
          >
            Render your first model
            <span className="grid place-items-center size-7 rounded-full bg-black/15 group-hover:translate-x-0.5 transition-transform">
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </span>
          </Link>
        </div>
      </div>

      {/* Decorative wireframe right */}
      <div className="hidden md:flex col-span-5 relative items-center justify-center">
        <div className="absolute inset-0 dotted-grid opacity-50" />
        <svg viewBox="-100 -100 200 200" className="size-72 relative float">
          <g
            stroke="oklch(0.92 0.18 120 / 0.9)"
            strokeWidth="0.6"
            fill="none"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <ellipse
                key={i}
                cx="0"
                cy="0"
                rx={70 - i * 4}
                ry={70}
                transform={`rotate(${i * 18})`}
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
