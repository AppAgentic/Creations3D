"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import NextImage from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { StudioScene } from "@/components/StudioScene";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { WorldViewer, WorldAssets } from "@/components/WorldViewer";
import { toast } from "sonner";
import {
  Box,
  Check,
  CreditCard,
  Download,
  FileArchive,
  Gauge,
  Globe,
  Image as ImageIcon,
  Layers3,
  Loader2,
  PanelLeft,
  RotateCcw,
  Save,
  Settings2,
  Sparkles,
  Type,
  Upload,
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

export default function GeneratePage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<"text" | "image" | "world">("text");
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (mode === "world") {
      await handleGenerateWorld();
      return;
    }

    if (mode === "text" && !prompt.trim()) {
      toast.error("Enter a prompt");
      return;
    }

    if (mode === "image" && !imageFile) {
      toast.error("Upload an image");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setModelUrl(null);

    const progressInterval = setInterval(() => {
      setProgress((current) => {
        if (current >= 90) return current;
        return current + Math.random() * 5;
      });
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
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate model");
      }

      setProgress(100);
      setModelUrl(data.modelUrl);
      toast.success("3D model generated");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate model";
      toast.error(message);
      console.error("Generation error:", error);
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const handleGenerateWorld = async () => {
    if (worldInputType === "text" && !prompt.trim()) {
      toast.error("Enter a prompt");
      return;
    }

    if (worldInputType === "image" && !imageFile) {
      toast.error("Upload an image");
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
          body: JSON.stringify({
            type: "text",
            prompt,
            model: worldModel,
          }),
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
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate world");
      }

      setProgress(100);
      setWorldId(data.worldId);
      setWorldAssets(data.assets);
      toast.success(`3D world generated (${data.creditCost} credits used)`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate world";
      toast.error(message);
      console.error("World generation error:", error);
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
      if (!response.ok) {
        throw new Error(data.error || "Failed to save model");
      }

      setSavedUrl(data.savedUrl);
      setIsSaved(true);
      toast.success("Model saved to library");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save model";
      toast.error(message);
      console.error("Save error:", error);
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

  const progressLabel = `${Math.round(progress)}%`;
  const activeModeLabel =
    mode === "world" ? "3D world" : mode === "image" ? "image mesh" : "text mesh";

  return (
    <div className="studio-shell min-h-screen text-white">
      <Navbar />

      <main className="min-h-screen pt-16">
        <div className="grid min-h-[calc(100svh-4rem)] lg:grid-cols-[4.5rem_minmax(0,1fr)_25rem]">
          <aside className="hidden border-r border-white/10 bg-black/20 lg:flex lg:flex-col lg:items-center lg:justify-between lg:py-5">
            <div className="flex flex-col gap-3">
              {[PanelLeft, Box, Layers3, Settings2].map((Icon, index) => (
                <button
                  key={index}
                  className={`flex size-10 items-center justify-center border text-white/55 transition-colors hover:text-white ${
                    index === 1
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                  aria-label={`Workspace control ${index + 1}`}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
            <Link
              href="/pricing"
              className="flex size-10 items-center justify-center border border-white/10 bg-white/[0.03] text-white/55 transition-colors hover:text-white"
              aria-label="Credits and pricing"
            >
              <CreditCard className="size-4" />
            </Link>
          </aside>

          <section className="relative min-h-[56rem] overflow-hidden border-b border-white/10 bg-[#080a08] lg:min-h-0 lg:border-b-0 lg:border-r">
            <div className="absolute inset-0 studio-grid opacity-50" />
            <div className="absolute inset-x-0 top-0 z-20 flex flex-col gap-4 border-b border-white/10 bg-[#080a08]/78 px-4 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between lg:px-6">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                  New generation
                </p>
                <h1 className="mt-1 font-display text-3xl font-black">
                  {activeModeLabel}
                </h1>
              </div>
              <div className="flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white/56">
                <span className="border border-white/10 bg-white/[0.03] px-3 py-2">
                  Credits 47
                </span>
                <span className="border border-white/10 bg-white/[0.03] px-3 py-2">
                  GLB
                </span>
                <span className="border border-white/10 bg-white/[0.03] px-3 py-2">
                  USDZ
                </span>
                <span className="border border-white/10 bg-white/[0.03] px-3 py-2">
                  OBJ
                </span>
              </div>
            </div>

            <div className="relative z-10 h-full pt-32">
              {mode === "world" ? (
                <div className="h-[calc(100%-8rem)] p-4 lg:p-6">
                  {isGenerating ? (
                    <div className="flex h-full min-h-[34rem] items-center justify-center bg-[#080a08]">
                      <div className="text-center">
                        <Skeleton className="mx-auto h-40 w-40 rounded-none bg-white/10" />
                        <p className="mt-6 font-mono text-xs uppercase tracking-[0.22em] text-white/45">
                          Building 3D world
                        </p>
                      </div>
                    </div>
                  ) : worldId ? (
                    <WorldViewer
                      worldId={worldId}
                      assets={worldAssets || undefined}
                      className="h-full"
                    />
                  ) : (
                    <StudioScene
                      className="h-full min-h-[34rem]"
                      interactive
                      label="Empty 3D world preview"
                    />
                  )}
                </div>
              ) : (
                <div className="h-[calc(100%-8rem)] p-4 lg:p-6">
                  {isGenerating ? (
                    <div className="relative h-full min-h-[34rem] overflow-hidden bg-[#080a08]">
                      <StudioScene className="absolute inset-0" compact />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="border border-white/10 bg-black/55 px-5 py-4 backdrop-blur">
                          <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">
                            Generating mesh
                          </p>
                          <p className="mt-2 text-sm text-white/55">
                            {progressLabel} complete
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : modelUrl ? (
                    <div className="h-full min-h-[34rem] overflow-hidden border border-white/10">
                      <ModelViewer modelUrl={modelUrl} />
                    </div>
                  ) : (
                    <StudioScene
                      className="h-full min-h-[34rem]"
                      interactive
                      label="Empty 3D model preview"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="absolute inset-x-4 bottom-4 z-30 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-4 lg:inset-x-6">
              {[
                ["Mesh quality", mode === "world" ? worldModel : "high"],
                ["Polycount", modelUrl ? "ready" : "target 12k"],
                ["Materials", imagePreview ? "reference" : "procedural"],
                ["Texture bake", modelUrl || worldId ? "available" : "queued"],
              ].map(([label, value]) => (
                <div key={label} className="bg-[#0c0f0c]/92 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="border-l border-white/10 bg-[#0b0e0b] p-4 lg:p-5">
            <Tabs
              value={mode}
              onValueChange={(value) =>
                setMode(value as "text" | "image" | "world")
              }
              className="gap-5"
            >
              <TabsList className="grid h-auto w-full grid-cols-3 rounded-none bg-white/[0.04] p-1">
                <TabsTrigger
                  value="text"
                  className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Type className="size-4" />
                  Text
                </TabsTrigger>
                <TabsTrigger
                  value="image"
                  className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <ImageIcon className="size-4" />
                  Image
                </TabsTrigger>
                <TabsTrigger
                  value="world"
                  className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Globe className="size-4" />
                  World
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="A compact sci-fi helmet with graphite shell, white ceramic faceplate, lime status lights..."
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    className="min-h-40 rounded-none border-white/10 bg-black/20 text-white placeholder:text-white/28"
                    disabled={isGenerating}
                  />
                  <p className="text-sm leading-6 text-white/45">
                    Include material, scale, silhouette, and target use for a
                    cleaner first pass.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="image" className="space-y-5">
                <ImageDropzone
                  imagePreview={imagePreview}
                  isGenerating={isGenerating}
                  onDrop={handleDrop}
                  onUpload={handleImageUpload}
                  onRemove={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                />
              </TabsContent>

              <TabsContent value="world" className="space-y-6">
                <div className="space-y-3">
                  <Label>Quality</Label>
                  <RadioGroup
                    value={worldModel}
                    onValueChange={(value) =>
                      setWorldModel(value as "mini" | "plus")
                    }
                    className="grid grid-cols-2 gap-px border border-white/10 bg-white/10"
                  >
                    {[
                      ["mini", "Draft", "30-45s", "3 credits"],
                      ["plus", "High", "~5 min", "5 credits"],
                    ].map(([value, name, time, cost]) => (
                      <div key={value} className="relative bg-[#0c0f0c]">
                        <RadioGroupItem
                          value={value}
                          id={value}
                          className="peer sr-only"
                          disabled={isGenerating}
                        />
                        <Label
                          htmlFor={value}
                          className="block cursor-pointer p-4 transition-colors peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                        >
                          <span className="block font-medium">{name}</span>
                          <span className="mt-1 block text-xs opacity-70">
                            {time} / {cost}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Input type</Label>
                  <RadioGroup
                    value={worldInputType}
                    onValueChange={(value) =>
                      setWorldInputType(value as "text" | "image")
                    }
                    className="grid grid-cols-2 gap-px border border-white/10 bg-white/10"
                  >
                    {[
                      ["text", "Text prompt"],
                      ["image", "Reference image"],
                    ].map(([value, label]) => (
                      <div key={value} className="relative bg-[#0c0f0c]">
                        <RadioGroupItem
                          value={value}
                          id={`world-${value}`}
                          className="peer sr-only"
                          disabled={isGenerating}
                        />
                        <Label
                          htmlFor={`world-${value}`}
                          className="block cursor-pointer p-4 text-sm transition-colors peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {worldInputType === "text" ? (
                  <div className="space-y-2">
                    <Label htmlFor="world-prompt">World prompt</Label>
                    <Textarea
                      id="world-prompt"
                      placeholder="A compact product studio with concrete floors, inspection tables, and soft overhead lighting..."
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      className="min-h-36 rounded-none border-white/10 bg-black/20 text-white placeholder:text-white/28"
                      disabled={isGenerating}
                    />
                  </div>
                ) : (
                  <ImageDropzone
                    imagePreview={imagePreview}
                    isGenerating={isGenerating}
                    onDrop={handleDrop}
                    onUpload={handleImageUpload}
                    onRemove={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    compact
                  />
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-6 space-y-3">
              <Button
                className="h-12 w-full rounded-none"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generating
                  </>
                ) : mode === "world" ? (
                  <>
                    <Globe className="size-4" />
                    Generate 3D world ({worldModel === "mini" ? "3" : "5"} credits)
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate 3D model
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full rounded-none border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.07] hover:text-white"
                onClick={handleReset}
                disabled={isGenerating}
              >
                <RotateCcw className="size-4" />
                Reset
              </Button>
            </div>

            {isGenerating && (
              <div className="mt-6 space-y-3 border border-white/10 bg-white/[0.03] p-4">
                <div className="flex justify-between font-mono text-xs uppercase tracking-[0.18em] text-white/55">
                  <span>Generating</span>
                  <span>{progressLabel}</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {(modelUrl || worldId) && (
              <div className="mt-6 space-y-3 border border-white/10 bg-white/[0.03] p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                  Export
                </p>
                {modelUrl && (
                  <>
                    <Button
                      className="h-11 w-full rounded-none"
                      onClick={handleSaveToLibrary}
                      disabled={isSaving || isSaved}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Saving
                        </>
                      ) : isSaved ? (
                        <>
                          <Check className="size-4" />
                          Saved to library
                        </>
                      ) : (
                        <>
                          <Save className="size-4" />
                          Save to library
                        </>
                      )}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="rounded-none border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.07] hover:text-white"
                        asChild
                      >
                        <a href={savedUrl || modelUrl} download="model.glb">
                          <Download className="size-4" />
                          GLB
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-none border-white/10 bg-white/[0.03] text-white"
                        disabled
                      >
                        <FileArchive className="size-4" />
                        OBJ
                      </Button>
                    </div>
                  </>
                )}
                {worldId && (
                  <p className="text-sm leading-6 text-white/55">
                    World assets are available in the viewport action row.
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-px border border-white/10 bg-white/10">
              {[
                {
                  icon: Gauge,
                  label: "Quality",
                  value: mode === "world" ? worldModel : "High",
                },
                { icon: Layers3, label: "Target", value: "Game/web" },
              ].map(({ icon: MetricIcon, label, value }) => {
                return (
                  <div key={label} className="bg-[#0c0f0c] p-4">
                    <MetricIcon className="mb-5 size-4 text-primary" />
                    <p className="text-sm font-medium text-white">{value}</p>
                    <p className="mt-1 text-xs text-white/42">{label}</p>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function ImageDropzone({
  imagePreview,
  isGenerating,
  onDrop,
  onUpload,
  onRemove,
  compact = false,
}: {
  imagePreview: string | null;
  isGenerating: boolean;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      <Label>Reference image</Label>
      <div
        className={`border border-dashed border-white/16 bg-black/20 p-4 text-center transition-colors hover:border-primary/70 ${
          compact ? "min-h-44" : "min-h-64"
        }`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        {imagePreview ? (
          <div className="space-y-4">
            <NextImage
              src={imagePreview}
              alt="Uploaded reference preview"
              width={640}
              height={360}
              unoptimized
              className={`mx-auto w-full object-cover ${
                compact ? "max-h-32" : "max-h-52"
              }`}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={onRemove}
              disabled={isGenerating}
              className="rounded-none border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.07] hover:text-white"
            >
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex min-h-52 flex-col items-center justify-center gap-4">
            <Upload className="size-9 text-white/35" />
            <div>
              <p className="text-sm text-white/56">Drop an image here</p>
              <p className="mt-1 text-xs text-white/35">
                Use clear silhouettes for stronger mesh results.
              </p>
            </div>
            <Button
              variant="outline"
              asChild
              disabled={isGenerating}
              className="rounded-none border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.07] hover:text-white"
            >
              <label className="cursor-pointer">
                Browse files
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={onUpload}
                  disabled={isGenerating}
                />
              </label>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
