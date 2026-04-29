"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import NextImage from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { StudioScene } from "@/components/StudioScene";
import { useAuth } from "@/lib/auth-context";
import { trackEvent } from "@/lib/analytics";
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

const starterPrompts = [
  "Small translucent concept car with soft studio reflections",
  "Portable speaker with layered materials and a glowing front panel",
  "Compact product studio with concrete floors and soft overhead lighting",
];

const INTERNAL_ERROR_PATTERN =
  /(replicate|world labs|firebase|api|provider|configured|unauthorized|prediction|content type|stack|server|failed to generate 3d model:|failed to generate world:)/i;

function getFriendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (message && !INTERNAL_ERROR_PATTERN.test(message)) {
    return message;
  }
  return fallback;
}

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
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
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
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [creditState, setCreditState] = useState<{
    credits: number;
    plan: string | null;
    subscriptionStatus: string | null;
  } | null>(null);

  const [worldId, setWorldId] = useState<string | null>(null);
  const [worldAssets, setWorldAssets] = useState<WorldAssets | null>(null);
  const [worldModel, setWorldModel] = useState<"mini" | "plus">("plus");
  const [worldInputType, setWorldInputType] = useState<"text" | "image">(
    "text"
  );

  useEffect(() => {
    const starter = new URLSearchParams(window.location.search).get("starter");

    if (starter) {
      trackEvent("starter_prompt_loaded", { source: "url" });
      const timer = window.setTimeout(() => {
        setPrompt(starter);
        setMode("text");
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    user
      .getIdToken()
      .then((token) =>
        fetch("/api/user/credits", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      )
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) {
          setCreditState(data);
        }
      })
      .catch((error) => {
        console.error("Failed to load credits:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const reloadCredits = async () => {
    if (!user) return;

    const token = await user.getIdToken();
    const response = await fetch("/api/user/credits", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();

    if (response.ok) {
      setCreditState(data);
    }
  };

  const getGenerationCost = () => {
    if (mode !== "world") return 1;
    return worldModel === "mini" ? 3 : 5;
  };

  const ensureCanGenerate = async () => {
    if (!user) {
      trackEvent("generation_auth_required", { mode });
      try {
        await signInWithGoogle();
        toast.success("Signed in. Choose a paid plan to add credits.");
      } catch {
        toast.error(
          "Sign in did not complete. Try again or check your browser settings."
        );
        trackEvent("generation_sign_in_failed", { mode });
      }
      return false;
    }

    const cost = getGenerationCost();

    if (creditState && creditState.credits < cost) {
      toast.error(`You need ${cost} credits to generate. Choose a plan first.`);
      trackEvent("generation_blocked_insufficient_credits", {
        mode,
        cost,
        credits: creditState.credits,
      });
      return false;
    }

    return true;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    trackEvent("reference_image_uploaded", {
      mode,
      size: file.size,
      type: file.type,
    });
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
    trackEvent("reference_image_dropped", {
      mode,
      size: file.size,
      type: file.type,
    });
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!(await ensureCanGenerate())) return;

    if (mode === "world") {
      await handleGenerateWorld();
      return;
    }

    if (mode === "text" && !prompt.trim()) {
      toast.error("Add a prompt before generating.");
      return;
    }

    if (mode === "image" && !imageFile) {
      toast.error("Upload a reference image before generating.");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setModelUrl(null);
    setGenerationId(null);
    setIsSaved(false);
    setSavedUrl(null);
    trackEvent("generation_started", {
      mode,
      cost: getGenerationCost(),
      hasPrompt: Boolean(prompt.trim()),
      hasImage: Boolean(imageFile),
    });

    const progressInterval = setInterval(() => {
      setProgress((current) => {
        if (current >= 90) return current;
        return current + Math.random() * 5;
      });
    }, 1000);

    try {
      let response: Response;
      const token = await user!.getIdToken();

      if (mode === "text") {
        response = await fetch("/api/generate/text-to-3d", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        });
      } else {
        const formData = new FormData();
        formData.append("image", imageFile!);

        response = await fetch("/api/generate/image-to-3d", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate model");
      }

      setProgress(100);
      setModelUrl(data.modelUrl);
      setGenerationId(data.generationId || null);
      trackEvent("generation_completed", {
        mode,
        generationId: data.generationId || null,
        creditsUsed: data.creditsUsed || getGenerationCost(),
      });
      if (typeof data.remainingCredits === "number") {
        setCreditState((current) => ({
          credits: data.remainingCredits,
          plan: current?.plan || null,
          subscriptionStatus: current?.subscriptionStatus || null,
        }));
      } else {
        await reloadCredits();
      }
      toast.success("3D model generated");
    } catch (error) {
      const message = getFriendlyError(
        error,
        "We couldn't generate that model. If a credit was reserved, it was refunded automatically. Try again with a simpler prompt."
      );
      toast.error(message);
      trackEvent("generation_failed", { mode, message });
      console.error("Generation error:", error);
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const handleGenerateWorld = async () => {
    if (worldInputType === "text" && !prompt.trim()) {
      toast.error("Add a world prompt before generating.");
      return;
    }

    if (worldInputType === "image" && !imageFile) {
      toast.error("Upload a reference image before generating.");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setWorldId(null);
    setWorldAssets(null);
    setGenerationId(null);
    trackEvent("generation_started", {
      mode: "world",
      worldModel,
      worldInputType,
      cost: getGenerationCost(),
    });

    const maxTime = worldModel === "mini" ? 60000 : 300000;
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min(90, (elapsed / maxTime) * 100));
    }, 1000);

    try {
      let response: Response;
      const token = await user!.getIdToken();

      if (worldInputType === "text") {
        response = await fetch("/api/generate/world", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      setGenerationId(data.generationId || null);
      trackEvent("generation_completed", {
        mode: "world",
        worldModel,
        worldInputType,
        generationId: data.generationId || null,
        creditsUsed: data.creditCost || getGenerationCost(),
      });
      if (typeof data.remainingCredits === "number") {
        setCreditState((current) => ({
          credits: data.remainingCredits,
          plan: current?.plan || null,
          subscriptionStatus: current?.subscriptionStatus || null,
        }));
      } else {
        await reloadCredits();
      }
      toast.success(`3D world generated (${data.creditCost} credits used)`);
    } catch (error) {
      const message = getFriendlyError(
        error,
        "We couldn't generate that 3D world. If credits were reserved, they were refunded automatically. Try again with a simpler prompt."
      );
      toast.error(message);
      trackEvent("generation_failed", {
        mode: "world",
        worldModel,
        worldInputType,
        message,
      });
      console.error("World generation error:", error);
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!modelUrl) return;
    if (!user) {
      toast.error("Sign in to save models to your library.");
      return;
    }

    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/models/save", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelUrl,
          format: "glb",
          generationId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save model");
      }

      setSavedUrl(data.savedUrl);
      setGenerationId(data.generationId || generationId);
      setIsSaved(true);
      trackEvent("model_saved", {
        generationId: data.generationId || generationId,
        format: "glb",
      });
      toast.success("Model saved to library");
    } catch (error) {
      const message = getFriendlyError(
        error,
        "We couldn't save that model to your library. Try again in a moment."
      );
      toast.error(message);
      trackEvent("model_save_failed", { generationId, message });
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    trackEvent("generator_reset", { mode });
    setPrompt("");
    setImageFile(null);
    setImagePreview(null);
    setModelUrl(null);
    setProgress(0);
    setIsSaved(false);
    setSavedUrl(null);
    setGenerationId(null);
    setWorldId(null);
    setWorldAssets(null);
  };

  const progressLabel = `${Math.round(progress)}%`;
  const worldQualityLabel = worldModel === "mini" ? "Draft" : "High";
  const activeModeLabel =
    mode === "world"
      ? "3D world"
      : mode === "image"
        ? "Image to 3D model"
        : "Text to 3D model";
  const displayedCredits = authLoading
    ? "..."
    : user
      ? (creditState?.credits ?? "...")
      : "--";
  const generationCost = getGenerationCost();
  const hasKnownCredits = typeof creditState?.credits === "number";
  const hasEnoughCredits =
    Boolean(user) && hasKnownCredits && creditState!.credits >= generationCost;
  const needsReferenceImage =
    mode === "image" || (mode === "world" && worldInputType === "image");
  const hasRequiredInput = needsReferenceImage
    ? Boolean(imageFile)
    : Boolean(prompt.trim());
  const checklist = [
    {
      label: "Signed in",
      done: Boolean(user),
      detail: user ? "Account connected" : "Required before generation",
    },
    {
      label: "Credits ready",
      done: hasEnoughCredits,
      detail: user
        ? hasKnownCredits
          ? `${creditState!.credits} available`
          : "Checking balance"
        : "Choose a paid plan",
    },
    {
      label: needsReferenceImage ? "Reference image added" : "Prompt ready",
      done: hasRequiredInput,
      detail: needsReferenceImage
        ? "Use a clear silhouette"
        : "Describe material, scale, and use",
    },
    {
      label: "Result ready",
      done: Boolean(modelUrl || worldId),
      detail: modelUrl
        ? isSaved
          ? "Saved to your library"
          : "Save useful models to your library"
        : worldId
          ? "Open or download the world assets"
          : "Generate first",
    },
  ];

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
                  Credits {displayedCredits}
                </span>
                <span className="border border-white/10 bg-white/[0.03] px-3 py-2">
                  GLB download
                </span>
                <span className="border border-white/10 bg-white/[0.03] px-3 py-2">
                  Library save
                </span>
                <span className="border border-white/10 bg-white/[0.03] px-3 py-2">
                  Refund on failure
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
                            Generating 3D model
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
                [
                  "Model quality",
                  mode === "world" ? worldQualityLabel : "High",
                ],
                ["Detail target", modelUrl || worldId ? "Ready" : "Balanced"],
                [
                  "Input",
                  imagePreview
                    ? "Reference image"
                    : prompt.trim()
                      ? "Prompt"
                      : "Not set",
                ],
                ["Credits", `${generationCost} needed`],
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
              onValueChange={(value) => {
                const nextMode = value as "text" | "image" | "world";
                setMode(nextMode);
                trackEvent("generator_mode_changed", { mode: nextMode });
              }}
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
                    cleaner first model.
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
                <p className="text-sm leading-6 text-white/45">
                  Create a navigable 3D environment from a prompt or reference
                  image. Draft worlds are faster; high-quality worlds take
                  longer and use more credits.
                </p>
                <div className="space-y-3">
                  <Label>World quality</Label>
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

            <div className="mt-6 border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                    Before you generate
                  </p>
                  <p className="mt-1 text-sm text-white/45">
                    Credits are reserved when generation starts and refunded
                    automatically if it fails.
                  </p>
                </div>
                <span className="font-mono text-xs text-white/45">
                  {generationCost} credit{generationCost === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-4 divide-y divide-white/10">
                {checklist.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between gap-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xs text-white/42">
                        {item.detail}
                      </p>
                    </div>
                    <span
                      className={`mt-0.5 flex size-5 items-center justify-center border ${
                        item.done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-white/15 text-white/28"
                      }`}
                    >
                      {item.done && <Check className="size-3" />}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 border border-white/10 bg-white/[0.03] p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                Prompt starters
              </p>
              <div className="mt-4 space-y-2">
                {starterPrompts.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => {
                      setPrompt(starter);
                      setMode(
                        starter.includes("inspection bay") ? "world" : "text"
                      );
                      trackEvent("prompt_starter_selected", {
                        starter,
                        surface: "generator",
                      });
                    }}
                    className="w-full border border-white/10 bg-black/20 p-3 text-left text-sm leading-6 text-white/58 transition-colors hover:border-primary/55 hover:text-white"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>

            {((user &&
              hasKnownCredits &&
              creditState!.credits < generationCost) ||
              !user) && (
              <div className="mt-6 border border-primary/40 bg-primary/10 p-4">
                <p className="font-medium text-primary">
                  {user
                    ? "Not enough credits for this run"
                    : "Credits unlock generation"}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  {user
                    ? `This mode needs ${generationCost} credits. Add a paid plan or refill before generating.`
                    : "You can inspect the generator first, but a paid plan is required before creating a model."}
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="mt-4 h-10 rounded-none border-primary/40 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Link href="/pricing">View paid plans</Link>
                </Button>
              </div>
            )}

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
                    Generate 3D world ({worldModel === "mini" ? "3" : "5"}{" "}
                    credits)
                  </>
                ) : !user ? (
                  <>
                    <Sparkles className="size-4" />
                    Sign in to generate
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate 3D model (1 credit)
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
                    <div className="grid gap-2">
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
                    </div>
                  </>
                )}
                {worldId && (
                  <p className="text-sm leading-6 text-white/55">
                    Use the buttons below the viewer to open or download the
                    world assets.
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-px border border-white/10 bg-white/10">
              {[
                {
                  icon: Gauge,
                  label: "Quality",
                  value: mode === "world" ? worldQualityLabel : "High",
                },
                { icon: Layers3, label: "Use", value: "Web/game" },
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
                Use clear silhouettes for stronger 3D results.
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
