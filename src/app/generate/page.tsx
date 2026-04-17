"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Type,
  ImageIcon,
  Upload,
  Sparkles,
  Download,
  RotateCcw,
  Loader2,
  Save,
  Check,
  Globe,
  Cpu,
  ChevronRight,
} from "lucide-react";
import { WorldViewer, WorldAssets } from "@/components/WorldViewer";
import { toast } from "sonner";

const ModelViewer = dynamic(
  () => import("@/components/ModelViewer").then((mod) => mod.ModelViewer),
  {
    ssr: false,
    loading: () => <ViewerSkeleton />,
  }
);

function ViewerSkeleton() {
  return (
    <div className="w-full h-full grid place-items-center">
      <div className="size-20 rounded-xl shimmer" />
    </div>
  );
}

type Mode = "text" | "image" | "world";

const MODES: Array<{
  id: Mode;
  label: string;
  sub: string;
  icon: typeof Type;
  credits: string;
}> = [
  { id: "text", label: "Text to 3D", sub: "Prompt", icon: Type, credits: "1 credit" },
  { id: "image", label: "Image to 3D", sub: "Upload", icon: ImageIcon, credits: "1 credit" },
  { id: "world", label: "3D World", sub: "Environment", icon: Globe, credits: "3–5 credits" },
];

export default function GeneratePage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("text");
  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);

  const [worldId, setWorldId] = useState<string | null>(null);
  const [worldAssets, setWorldAssets] = useState<WorldAssets | null>(null);
  const [worldModel, setWorldModel] = useState<"mini" | "plus">("plus");
  const [worldInputType, setWorldInputType] = useState<"text" | "image">(
    "text"
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (mode === "world") {
      await handleGenerateWorld();
      return;
    }

    if (mode === "text" && !prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    if (mode === "image" && !imageFile) {
      toast.error("Please upload an image");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setModelUrl(null);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + Math.random() * 5));
    }, 1000);

    try {
      let response: Response;
      if (mode === "text") {
        response = await fetch("/api/generate/text-to-3d", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
      } else {
        const formData = new FormData();
        formData.append("image", imageFile!);
        response = await fetch("/api/generate/image-to-3d", {
          method: "POST",
          body: formData,
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate model");

      setProgress(100);
      setModelUrl(data.modelUrl);
      toast.success("3D model ready");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed";
      toast.error(message);
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const handleGenerateWorld = async () => {
    if (worldInputType === "text" && !prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    if (worldInputType === "image" && !imageFile) {
      toast.error("Please upload an image");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setWorldId(null);
    setWorldAssets(null);

    const maxTime = worldModel === "mini" ? 60000 : 300000;
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min(90, (elapsed / maxTime) * 100));
    }, 1000);

    try {
      let response: Response;
      if (worldInputType === "text") {
        response = await fetch("/api/generate/world", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "text", prompt, model: worldModel }),
        });
      } else {
        const formData = new FormData();
        formData.append("type", "image");
        formData.append("image", imageFile!);
        formData.append("model", worldModel);
        response = await fetch("/api/generate/world", {
          method: "POST",
          body: formData,
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate world");

      setProgress(100);
      setWorldId(data.worldId);
      setWorldAssets(data.assets);
      toast.success(`World ready · ${data.creditCost} credits used`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed";
      toast.error(message);
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!modelUrl) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/models/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelUrl,
          format: "glb",
          userId: user?.uid || "anonymous",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save");
      setSavedUrl(data.savedUrl);
      setIsSaved(true);
      toast.success("Saved to library");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPrompt("");
    setImageFile(null);
    setImagePreview(null);
    setModelUrl(null);
    setProgress(0);
    setIsSaved(false);
    setSavedUrl(null);
    setWorldId(null);
    setWorldAssets(null);
  };

  const currentMode = MODES.find((m) => m.id === mode)!;

  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden">
      <Navbar />

      {/* Ambient dot grid */}
      <div className="fixed inset-0 dotted-grid opacity-40 pointer-events-none" />

      <main className="pt-24 pb-12 px-4 relative">
        <div className="mx-auto max-w-7xl">
          {/* Meta strip */}
          <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-2">
                studio
              </div>
              <h1 className="font-display font-bold text-3xl md:text-5xl tracking-tight">
                Generate
              </h1>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-2 h-8 px-3 rounded-full border border-border">
                <Cpu
                  className="size-3.5 text-accent"
                  strokeWidth={1.5}
                />
                <span className="text-muted-foreground">pipeline</span>
                <span className="text-foreground">
                  {mode === "text"
                    ? "shap-e"
                    : mode === "image"
                    ? "trellis"
                    : "marble"}
                </span>
              </div>
              <div className="flex items-center gap-2 h-8 px-3 rounded-full bg-accent text-accent-foreground font-semibold">
                <span className="size-1.5 rounded-full bg-accent-foreground/60" />
                {currentMode.credits}
              </div>
            </div>
          </div>

          {/* Canvas-first: large preview, floating glass control panel */}
          <div className="grid grid-cols-12 gap-4 md:gap-5">
            {/* ── Preview canvas — 7 cols ─────────────────── */}
            <div className="col-span-12 lg:col-span-7 order-2 lg:order-1">
              <div className="relative glass-panel rounded-3xl overflow-hidden aspect-[4/5] md:aspect-square">
                {/* Corner marks */}
                <div className="absolute top-4 left-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground z-10">
                  {mode === "world" ? "world preview" : "mesh preview"}
                </div>
                <div className="absolute top-4 right-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground z-10">
                  {isGenerating
                    ? `${Math.round(progress)}%`
                    : modelUrl || worldAssets
                    ? "ready"
                    : "idle"}
                </div>

                <div className="absolute inset-0">
                  {mode === "world" ? (
                    isGenerating ? (
                      <CanvasLoading
                        label={
                          worldModel === "mini"
                            ? "Mini model · ~30–45s"
                            : "Plus model · ~5 min"
                        }
                      />
                    ) : (
                      <WorldViewer
                        worldId={worldId}
                        assets={worldAssets || undefined}
                        className="w-full h-full"
                      />
                    )
                  ) : isGenerating ? (
                    <CanvasLoading label="Reconstructing mesh…" />
                  ) : (
                    <ModelViewer modelUrl={modelUrl} />
                  )}
                </div>

                {/* Progress bar overlay */}
                {isGenerating && (
                  <div className="absolute bottom-0 inset-x-0 p-4">
                    <Progress
                      value={progress}
                      className="h-1 bg-white/5 [&>div]:bg-accent"
                    />
                  </div>
                )}
              </div>

              {/* Output actions */}
              {modelUrl && !isGenerating && mode !== "world" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 20,
                  }}
                  className="mt-4 flex flex-wrap gap-2"
                >
                  <button
                    onClick={handleSaveToLibrary}
                    disabled={isSaving || isSaved}
                    className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 h-11 px-5 bg-accent text-accent-foreground rounded-full text-sm font-medium hover:brightness-110 transition-all disabled:opacity-70"
                  >
                    {isSaving ? (
                      <>
                        <Loader2
                          className="size-4 animate-spin"
                          strokeWidth={1.5}
                        />
                        Saving
                      </>
                    ) : isSaved ? (
                      <>
                        <Check className="size-4" strokeWidth={2} />
                        Saved to library
                      </>
                    ) : (
                      <>
                        <Save className="size-4" strokeWidth={1.5} />
                        Save to library
                      </>
                    )}
                  </button>
                  <a
                    href={savedUrl || modelUrl}
                    download="model.glb"
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-border text-sm hover:bg-surface-raised transition-colors"
                  >
                    <Download className="size-4" strokeWidth={1.5} />
                    GLB
                  </a>
                  <button
                    disabled
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-border text-sm text-muted-foreground opacity-60"
                  >
                    <Download className="size-4" strokeWidth={1.5} />
                    OBJ
                  </button>
                </motion.div>
              )}
            </div>

            {/* ── Control panel — 5 cols (glass) ──────────── */}
            <aside className="col-span-12 lg:col-span-5 order-1 lg:order-2">
              <div className="glass-panel rounded-3xl p-5 md:p-6 sticky top-24">
                {/* Tab switcher with layoutId */}
                <div className="relative grid grid-cols-3 p-1 bg-black/20 rounded-full border border-border mb-6">
                  {MODES.map((m) => {
                    const active = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className="relative h-9 text-xs font-medium rounded-full transition-colors"
                      >
                        {active && (
                          <motion.span
                            layoutId="mode-pill"
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              damping: 28,
                            }}
                            className="absolute inset-0 bg-accent rounded-full"
                          />
                        )}
                        <span
                          className={`relative flex items-center justify-center gap-1.5 ${
                            active
                              ? "text-accent-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <m.icon className="size-3.5" strokeWidth={1.5} />
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    {mode === "text" && (
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="prompt"
                            className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2"
                          >
                            Describe the mesh
                          </label>
                          <Textarea
                            id="prompt"
                            placeholder="A low-poly arctic fox, side lit, game-ready topology…"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="min-h-32 bg-black/20 border-border resize-none"
                            disabled={isGenerating}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Specify style, lighting, and topology for the
                          cleanest mesh.
                        </p>
                      </div>
                    )}

                    {mode === "image" && (
                      <div className="space-y-4">
                        <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                          Reference image
                        </label>
                        <DropZone
                          imagePreview={imagePreview}
                          isGenerating={isGenerating}
                          onDrop={handleDrop}
                          onUpload={handleImageUpload}
                          onClear={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                        />
                      </div>
                    )}

                    {mode === "world" && (
                      <div className="space-y-5">
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                            Quality
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              {
                                id: "mini",
                                name: "Draft",
                                time: "30–45s",
                                credits: "3",
                              },
                              {
                                id: "plus",
                                name: "High",
                                time: "~5 min",
                                credits: "5",
                              },
                            ].map((q) => {
                              const active = worldModel === q.id;
                              return (
                                <button
                                  key={q.id}
                                  disabled={isGenerating}
                                  onClick={() =>
                                    setWorldModel(q.id as "mini" | "plus")
                                  }
                                  className={`text-left p-3 rounded-xl border transition-all ${
                                    active
                                      ? "border-accent bg-accent/10"
                                      : "border-border bg-black/20 hover:border-border hover:bg-black/30"
                                  }`}
                                >
                                  <div className="text-sm font-semibold">
                                    {q.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {q.time}
                                  </div>
                                  <div className="font-mono text-[10px] text-accent mt-1.5">
                                    {q.credits} credits
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                            Input
                          </label>
                          <div className="inline-flex p-0.5 rounded-full bg-black/20 border border-border relative">
                            {(["text", "image"] as const).map((t) => {
                              const active = worldInputType === t;
                              return (
                                <button
                                  key={t}
                                  onClick={() => setWorldInputType(t)}
                                  disabled={isGenerating}
                                  className="relative h-7 px-3 text-xs rounded-full"
                                >
                                  {active && (
                                    <motion.span
                                      layoutId="world-input-pill"
                                      transition={{
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 28,
                                      }}
                                      className="absolute inset-0 bg-white/8 rounded-full"
                                    />
                                  )}
                                  <span
                                    className={`relative capitalize ${
                                      active
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {t}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {worldInputType === "text" ? (
                          <Textarea
                            placeholder="A cozy coffee shop, warm lighting, rain outside the window…"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="min-h-28 bg-black/20 border-border resize-none"
                            disabled={isGenerating}
                          />
                        ) : (
                          <DropZone
                            compact
                            imagePreview={imagePreview}
                            isGenerating={isGenerating}
                            onDrop={handleDrop}
                            onUpload={handleImageUpload}
                            onClear={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                          />
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Actions */}
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="group flex-1 inline-flex items-center justify-center gap-2 h-12 bg-accent text-accent-foreground rounded-full text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2
                          className="size-4 animate-spin"
                          strokeWidth={1.5}
                        />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" strokeWidth={1.5} />
                        {mode === "world"
                          ? `Generate world · ${worldModel === "mini" ? "3" : "5"}c`
                          : "Generate"}
                        <ChevronRight
                          className="size-4 group-hover:translate-x-0.5 transition-transform"
                          strokeWidth={2}
                        />
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={isGenerating}
                    title="Reset"
                    className="size-12 grid place-items-center rounded-full border border-border hover:bg-surface-raised transition-colors disabled:opacity-40"
                  >
                    <RotateCcw
                      className="size-4 text-muted-foreground"
                      strokeWidth={1.5}
                    />
                  </button>
                </div>

                {isGenerating && (
                  <div className="mt-4 flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span>rendering</span>
                    <span className="tabular-nums">
                      {Math.round(progress)}%
                    </span>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────

function CanvasLoading({ label }: { label: string }) {
  return (
    <div className="w-full h-full grid place-items-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="size-24 rounded-2xl shimmer" />
          <div className="absolute -inset-2 rounded-3xl border border-accent/30 animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function DropZone({
  imagePreview,
  isGenerating,
  onDrop,
  onUpload,
  onClear,
  compact = false,
}: {
  imagePreview: string | null;
  isGenerating: boolean;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border border-dashed border-border bg-black/20 ${
        compact ? "p-4" : "p-6"
      } text-center transition-colors hover:border-accent/50`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {imagePreview ? (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Reference preview"
            className={`mx-auto rounded-lg ${
              compact ? "max-h-24" : "max-h-40"
            }`}
          />
          <button
            type="button"
            onClick={onClear}
            disabled={isGenerating}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className={`space-y-3 ${compact ? "py-2" : "py-4"}`}>
          <Upload
            className={`mx-auto text-muted-foreground ${
              compact ? "size-6" : "size-9"
            }`}
            strokeWidth={1.5}
          />
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Drag a PNG or JPG
            </p>
            <label className="inline-flex items-center h-8 px-3 rounded-full border border-border text-xs cursor-pointer hover:bg-surface-raised transition-colors">
              Browse files
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={onUpload}
                disabled={isGenerating}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
