"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Box,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileArchive,
  Grid2X2,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

const ModelViewer = dynamic(
  () => import("@/components/ModelViewer").then((mod) => mod.ModelViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#080a08]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    ),
  }
);

interface SavedModel {
  generationId: string;
  key: string;
  url: string;
  size?: number;
  lastModified?: string;
  format: string;
  prompt?: string;
  type?: string;
  creditsUsed?: number;
}

const emptyStateStarters = [
  "Small translucent concept car with soft studio reflections",
  "Portable speaker with layered materials and a glowing front panel",
  "Compact product studio with concrete floors and soft overhead lighting",
];

const INTERNAL_ERROR_PATTERN =
  /(firebase|api|provider|configured|unauthorized|stack|server|failed to|not found)/i;

function getFriendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (message && !INTERNAL_ERROR_PATTERN.test(message)) {
    return message;
  }
  return fallback;
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
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractNameFromKey(key: string): string {
  const filename = key.split("/").pop() || key;
  return filename.replace(/\.(glb|obj)$/i, "");
}

export default function DashboardPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [models, setModels] = useState<SavedModel[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<SavedModel | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [creditState, setCreditState] = useState<{
    credits: number;
    plan: string | null;
    subscriptionStatus: string | null;
  } | null>(null);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    if (!user) {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setModels([]);
          setCreditState(null);
          setIsLoading(false);
        }
      });

      return () => {
        cancelled = true;
      };
    }

    user
      .getIdToken()
      .then((token) =>
        Promise.all([
          fetch("/api/models/list", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).then((response) => response.json()),
          fetch("/api/user/credits", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).then((response) => response.json()),
        ])
      )
      .then(([modelsData, creditsData]) => {
        if (cancelled) return;

        if (modelsData.success) {
          setModels(modelsData.models);
          trackEvent("dashboard_models_loaded", {
            count: modelsData.models.length,
          });
        }

        if (typeof creditsData.credits === "number") {
          setCreditState(creditsData);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch models:", error);
        toast.error(
          "We couldn't load your saved models. Try again in a moment."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const handleView = (model: SavedModel) => {
    trackEvent("dashboard_model_review_clicked", {
      generationId: model.generationId,
      format: model.format,
      type: model.type || null,
    });
    setSelectedModel(model);
    setIsViewerOpen(true);
  };

  const handleDelete = async (model: SavedModel) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/models/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          generationId: model.generationId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete model");
      }

      setModels((current) =>
        current.filter((item) => item.generationId !== model.generationId)
      );
      trackEvent("dashboard_model_deleted", {
        generationId: model.generationId,
        format: model.format,
      });
      toast.success("Model deleted");
    } catch (error) {
      const message = getFriendlyError(
        error,
        "We couldn't delete that model. Try again in a moment."
      );
      toast.error(message);
      trackEvent("dashboard_model_delete_failed", {
        generationId: model.generationId,
        message,
      });
    }
  };

  const handleCreateFirstModel = async () => {
    trackEvent("dashboard_empty_cta_clicked", {
      signedIn: Boolean(user),
    });
    if (!user) {
      try {
        await signInWithGoogle();
        toast.success("Signed in. Choose a paid plan to add credits.");
      } catch {
        toast.error("Sign in did not complete. Try again.");
      }
    }
  };

  const displayedCredits = authLoading
    ? "..."
    : user
      ? (creditState?.credits ?? "...")
      : "--";
  const filteredModels = models.filter((model) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;

    return [
      extractNameFromKey(model.key),
      model.prompt || "",
      model.format,
      model.type || "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
  const latestModel = models[0];

  return (
    <div className="studio-shell min-h-screen text-white">
      <Navbar />

      <main className="px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <header className="grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
                My models
              </p>
              <h1 className="mt-4 font-display text-5xl font-black leading-none text-balance sm:text-6xl">
                Your saved 3D models.
              </h1>
            </div>
            <Button asChild className="h-12 w-fit rounded-none px-6">
              <Link href="/generate">
                <Plus className="size-4" />
                New generation
              </Link>
            </Button>
          </header>

          <section className="grid gap-px border-x border-b border-white/10 bg-white/10 md:grid-cols-3">
            {[
              { icon: CreditCard, label: "Credits", value: displayedCredits },
              {
                icon: Box,
                label: "Saved models",
                value: isLoading ? "..." : models.length,
              },
              {
                icon: Clock,
                label: "Ready downloads",
                value: isLoading ? "..." : models.length,
              },
            ].map(({ icon: MetricIcon, label, value }) => {
              return (
                <div key={label} className="bg-[#0c0f0c] p-6">
                  <MetricIcon className="mb-7 size-5 text-primary" />
                  <p className="font-mono text-4xl text-white">{value}</p>
                  <p className="mt-2 text-sm text-white/45">{label}</p>
                </div>
              );
            })}
          </section>

          <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-3 border border-white/10 bg-white/[0.03] px-3 py-2 text-white/50 sm:w-80">
                  <Search className="size-4" />
                  <input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      trackEvent("dashboard_search_changed", {
                        hasQuery: Boolean(event.target.value.trim()),
                      });
                    }}
                    placeholder="Search models"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  />
                </label>
                <div className="flex gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">
                  <span className="border border-white/10 bg-white/[0.03] px-3 py-2">
                    Generated
                  </span>
                  <span className="border border-white/10 bg-white/[0.03] px-3 py-2">
                    Saved
                  </span>
                  {Array.from(
                    new Set(models.map((model) => model.format.toUpperCase()))
                  )
                    .slice(0, 2)
                    .map((format) => (
                      <span
                        key={format}
                        className="border border-white/10 bg-white/[0.03] px-3 py-2"
                      >
                        {format}
                      </span>
                    ))}
                </div>
              </div>

              {isLoading ? (
                <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="bg-[#0c0f0c] p-4">
                      <Skeleton className="h-48 rounded-none bg-white/10" />
                      <Skeleton className="mt-4 h-4 w-2/3 rounded-none bg-white/10" />
                      <Skeleton className="mt-2 h-3 w-1/3 rounded-none bg-white/10" />
                    </div>
                  ))}
                </div>
              ) : models.length === 0 ? (
                <div className="min-h-[30rem] border border-white/10 bg-white/[0.03] p-8">
                  <div className="mx-auto max-w-2xl text-center">
                    <Grid2X2 className="mx-auto mb-6 size-12 text-primary" />
                    <h2 className="font-display text-4xl font-black">
                      Save your first 3D model
                    </h2>
                    <p className="mt-3 text-white/55">
                      Generated models appear here after you save them from the
                      generator. Start with a prompt below or open the generator
                      to create from scratch.
                    </p>
                  </div>
                  <div className="mx-auto mt-8 grid max-w-4xl gap-px border border-white/10 bg-white/10 md:grid-cols-3">
                    {emptyStateStarters.map((starter) => (
                      <Link
                        key={starter}
                        href={`/generate?starter=${encodeURIComponent(starter)}`}
                        onClick={() =>
                          trackEvent("dashboard_starter_prompt_clicked", {
                            starter,
                          })
                        }
                        className="group bg-[#0c0f0c] p-4 text-left transition-colors hover:bg-[#111710]"
                      >
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                          Starter prompt
                        </p>
                        <p className="mt-5 text-sm leading-6 text-white/62">
                          {starter}
                        </p>
                        <p className="mt-5 inline-flex items-center gap-2 text-xs text-white/45 group-hover:text-primary">
                          Open generator
                          <Plus className="size-3" />
                        </p>
                      </Link>
                    ))}
                  </div>
                  {user ? (
                    <Button asChild className="mt-7 rounded-none">
                      <Link href="/generate">Create first model</Link>
                    </Button>
                  ) : (
                    <Button
                      className="mt-7 rounded-none"
                      onClick={handleCreateFirstModel}
                    >
                      Sign in to view models
                    </Button>
                  )}
                </div>
              ) : filteredModels.length === 0 ? (
                <div className="flex min-h-[22rem] flex-col items-center justify-center border border-white/10 bg-white/[0.03] p-8 text-center">
                  <Search className="mb-6 size-10 text-primary" />
                  <h2 className="font-display text-3xl font-black">
                    No matches
                  </h2>
                  <p className="mt-3 max-w-md text-white/55">
                    Clear the search or generate a new variation for this
                    concept.
                  </p>
                  <Button
                    className="mt-6 rounded-none"
                    onClick={() => setQuery("")}
                  >
                    Clear search
                  </Button>
                </div>
              ) : (
                <div className="grid auto-rows-[18rem] gap-px border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-3">
                  {filteredModels.map((model, index) => (
                    <article
                      key={model.key}
                      className={`group relative overflow-hidden bg-[#0c0f0c] p-4 ${
                        index % 5 === 1 ? "md:row-span-2" : ""
                      }`}
                    >
                      <div className="relative h-full overflow-hidden bg-[#080a08]">
                        <div className="absolute inset-0 studio-grid opacity-45" />
                        <div className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rotate-12 border border-primary/60 bg-white/[0.04] shadow-[0_0_54px_rgba(201,255,56,0.1)] transition-transform duration-300 group-hover:scale-110" />
                        <div className="absolute left-1/2 top-1/2 size-14 -translate-x-[20%] -translate-y-[35%] border border-white/25 bg-white/[0.08]" />

                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <Badge className="rounded-none">
                              {model.format.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-white/45">
                              {formatFileSize(model.size)}
                            </span>
                          </div>
                          <h2 className="line-clamp-1 font-medium">
                            {extractNameFromKey(model.key)}
                          </h2>
                          {model.prompt && (
                            <p className="mt-1 line-clamp-1 text-xs text-white/55">
                              {model.prompt}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-white/45">
                            {model.lastModified
                              ? formatTimeAgo(new Date(model.lastModified))
                              : "Recent"}
                          </p>
                          <div className="mt-4 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleView(model)}
                              className="rounded-none border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.1] hover:text-white"
                            >
                              <Eye className="size-4" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              className="rounded-none border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.1] hover:text-white"
                            >
                              <a href={model.url} download>
                                <Download className="size-4" />
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(model)}
                              className="rounded-none border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.1] hover:text-white"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <aside className="space-y-5">
              <div className="border border-white/10 bg-white/[0.03] p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                  Next session
                </p>
                <h2 className="mt-4 font-display text-3xl font-black leading-none">
                  {models.length > 0
                    ? "Generate a variation from your last model."
                    : "Create and save your first model."}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  {latestModel
                    ? `Last saved: ${extractNameFromKey(latestModel.key)}. Use the same prompt direction to make another version.`
                    : "Use a starter prompt, generate a model, then save it here for review and download."}
                </p>
                <Button asChild className="mt-6 w-full rounded-none">
                  <Link
                    href={
                      latestModel?.prompt
                        ? `/generate?starter=${encodeURIComponent(latestModel.prompt)}`
                        : "/generate"
                    }
                    onClick={() =>
                      trackEvent("dashboard_next_session_clicked", {
                        hasLatestPrompt: Boolean(latestModel?.prompt),
                      })
                    }
                  >
                    Generate next model
                  </Link>
                </Button>
              </div>

              <div className="border border-white/10 bg-white/[0.03] p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                  Downloads
                </p>
                <div className="mt-5 divide-y divide-white/10">
                  {Array.from(
                    new Set(models.map((model) => model.format.toUpperCase()))
                  ).map((format) => (
                    <div
                      key={format}
                      className="flex items-center justify-between py-4 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <FileArchive className="size-4 text-white/45" />
                        <span>{format}</span>
                      </div>
                      <span className="text-white/42">ready</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-white/10 bg-primary p-5 text-primary-foreground">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] opacity-70">
                  Credits
                </p>
                <p className="mt-4 font-display text-5xl font-black">
                  {displayedCredits}
                </p>
                <p className="mt-3 text-sm opacity-70">
                  {user
                    ? "Keep credits ready so you can generate from your saved models without returning to checkout."
                    : "Sign in and choose a paid plan to start generating."}
                </p>
                <Button
                  asChild
                  variant="secondary"
                  className="mt-6 w-full rounded-none"
                >
                  <Link href="/pricing">View plans</Link>
                </Button>
              </div>
            </aside>
          </section>
        </div>
      </main>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="h-[82vh] max-w-5xl rounded-none border-white/10 bg-[#080a08] text-white">
          <DialogHeader>
            <DialogTitle>
              {selectedModel
                ? extractNameFromKey(selectedModel.key)
                : "3D Model"}
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1">
            {selectedModel && (
              <div className="h-[calc(82vh-104px)] overflow-hidden border border-white/10">
                <ModelViewer
                  modelUrl={selectedModel.url}
                  format={selectedModel.format}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
