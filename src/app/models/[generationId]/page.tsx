"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { trackEvent } from "@/lib/analytics";
import { getModelFileLabel } from "@/lib/model-metadata";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  Copy,
  Download,
  FileArchive,
  Layers3,
  Loader2,
  Sparkles,
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

interface ModelDetail {
  generationId: string;
  key: string;
  url: string;
  viewerUrl?: string | null;
  size?: number | null;
  format: string;
  title: string;
  prompt?: string | null;
  type?: string | null;
  providerModel?: string | null;
  previewUrl?: string | null;
  creditsUsed?: number;
  createdAt?: string | null;
  savedAt?: string | null;
  completedAt?: string | null;
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value?: string | null) {
  if (!value) return "Recent";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ModelDetailPage() {
  const params = useParams<{ generationId: string }>();
  const router = useRouter();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [model, setModel] = useState<ModelDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    if (!user) {
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    user
      .getIdToken()
      .then((token) =>
        fetch(`/api/models/${params.generationId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      )
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.success) {
          throw new Error(data.error || "Model not found");
        }
        setModel(data.model);
        trackEvent("model_detail_loaded", {
          generationId: data.model.generationId,
          format: data.model.format,
        });
      })
      .catch((error) => {
        console.error("Failed to load model:", error);
        toast.error("We couldn't load that model. Try again in a moment.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, params.generationId, user]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success("Signed in");
    } catch {
      toast.error("Sign in did not complete. Try again.");
    }
  };

  const handleDelete = async () => {
    if (!user || !model) return;

    setIsDeleting(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/models/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ generationId: model.generationId }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Delete failed");

      trackEvent("model_detail_deleted", {
        generationId: model.generationId,
        format: model.format,
      });
      toast.success("Model deleted");
      router.push("/dashboard");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("We couldn't delete that model. Try again in a moment.");
      setIsDeleting(false);
    }
  };

  const starterHref = model?.prompt
    ? `/generate?starter=${encodeURIComponent(model.prompt)}`
    : "/generate";

  return (
    <div className="studio-shell min-h-screen text-white">
      <Navbar />

      <main className="px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <Button
            asChild
            variant="ghost"
            className="mb-6 rounded-none text-white/65 hover:bg-white/[0.06] hover:text-white"
          >
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              Library
            </Link>
          </Button>

          {!user && !authLoading ? (
            <section className="min-h-[32rem] border border-white/10 bg-white/[0.03] p-8 text-center">
              <Sparkles className="mx-auto mb-6 size-10 text-primary" />
              <h1 className="font-display text-5xl font-black">
                Sign in to view this model
              </h1>
              <p className="mx-auto mt-4 max-w-md text-white/55">
                Saved model previews and downloads are attached to your paid
                account.
              </p>
              <Button className="mt-8 rounded-none" onClick={handleSignIn}>
                Sign in
              </Button>
            </section>
          ) : isLoading ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]">
              <Skeleton className="h-[42rem] rounded-none bg-white/10" />
              <Skeleton className="h-[42rem] rounded-none bg-white/10" />
            </div>
          ) : model ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]">
              <section className="min-h-[42rem] overflow-hidden border border-white/10 bg-[#080a08]">
                <ModelViewer
                  modelUrl={model.viewerUrl || model.url}
                  format={model.format}
                />
              </section>

              <aside className="space-y-5">
                <div className="border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge className="rounded-none">
                      {getModelFileLabel(model.format)}
                    </Badge>
                    <Badge className="rounded-none bg-white/[0.06] text-white">
                      {formatFileSize(model.size)}
                    </Badge>
                  </div>
                  <h1 className="font-display text-4xl font-black leading-none text-balance">
                    {model.title}
                  </h1>
                  {model.prompt && (
                    <p className="mt-5 border-l border-primary/60 pl-4 text-sm leading-6 text-white/62">
                      {model.prompt}
                    </p>
                  )}
                </div>

                <div className="grid gap-px border border-white/10 bg-white/10">
                  {[
                    ["Created", formatDate(model.createdAt), Clock],
                    ["Credits used", `${model.creditsUsed || 0}`, Sparkles],
                    ["Generation", "Premium 3D model", Layers3],
                    ["Format", getModelFileLabel(model.format), FileArchive],
                  ].map(([label, value, Icon]) => {
                    const MetricIcon = Icon as typeof Clock;
                    return (
                      <div key={label as string} className="bg-[#0c0f0c] p-4">
                        <MetricIcon className="mb-4 size-4 text-primary" />
                        <p className="text-sm font-medium text-white">
                          {value as string}
                        </p>
                        <p className="mt-1 text-xs text-white/42">
                          {label as string}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 border border-white/10 bg-white/[0.03] p-5">
                  <Button className="h-11 w-full rounded-none" asChild>
                    <a
                      href={model.url}
                      download={`${model.title}.${model.format}`}
                    >
                      <Download className="size-4" />
                      Download {getModelFileLabel(model.format)}
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 w-full rounded-none border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.07] hover:text-white"
                  >
                    <Link href={starterHref}>
                      <Copy className="size-4" />
                      Generate variation
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-none border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.07] hover:text-white"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                    Delete
                  </Button>
                </div>
              </aside>
            </div>
          ) : (
            <section className="min-h-[32rem] border border-white/10 bg-white/[0.03] p-8 text-center">
              <h1 className="font-display text-5xl font-black">
                Model not found
              </h1>
              <Button asChild className="mt-8 rounded-none">
                <Link href="/dashboard">Back to library</Link>
              </Button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
