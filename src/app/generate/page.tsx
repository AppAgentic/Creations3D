"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import NextImage from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { trackEvent } from "@/lib/analytics";
import { worldGenerationEnabled } from "@/lib/features";
import {
  IMAGE_TO_3D_CREDIT_COST,
  TEXT_TO_3D_CREDIT_COST,
  WORLD_DRAFT_CREDIT_COST,
  WORLD_HIGH_CREDIT_COST,
} from "@/lib/generation-costs";
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
  Download,
  Gauge,
  Globe,
  Image as ImageIcon,
  Layers3,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  Type,
  Upload,
} from "lucide-react";

const starterPrompts = [
  "Small translucent concept car with soft studio reflections",
  "Portable speaker with layered materials and a glowing front panel",
  "Weathered street lantern with worn metal, glass panels, and warm internal light",
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
  const [modelFormat, setModelFormat] = useState("glb");
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
    if (mode === "text") return TEXT_TO_3D_CREDIT_COST;
    if (mode === "image") return IMAGE_TO_3D_CREDIT_COST;
    if (!worldGenerationEnabled) return TEXT_TO_3D_CREDIT_COST;
    return worldModel === "mini"
      ? WORLD_DRAFT_CREDIT_COST
      : WORLD_HIGH_CREDIT_COST;
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

  const pollGenerationStatus = async (id: string, token: string) => {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 3000));
      setProgress((current) => Math.min(95, Math.max(current, 18 + attempt)));

      const response = await fetch(
        `/api/generate/status?generationId=${encodeURIComponent(id)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation status check failed");
      }

      if (data.status === "generated" && data.modelUrl) {
        return data;
      }

      if (data.status === "failed") {
        throw new Error(
          data.error ||
            "We couldn't generate that model. Reserved credits were refunded automatically."
        );
      }
    }

    throw new Error(
      "That generation is taking longer than expected. Check your library in a moment or try again."
    );
  };

  const handleGenerate = async () => {
    if (!(await ensureCanGenerate())) return;

    if (mode === "world") {
      if (!worldGenerationEnabled) {
        toast.error(
          "3D world generation is not available yet. Use text or image to create a 3D model."
        );
        setMode("text");
        return;
      }
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

      if (data.status === "processing" && data.generationId) {
        setGenerationId(data.generationId);
        trackEvent("generation_processing", {
          mode,
          generationId: data.generationId,
          creditsUsed: data.creditsUsed || getGenerationCost(),
        });
        const completed = await pollGenerationStatus(data.generationId, token);
        setProgress(100);
        setModelUrl(completed.modelUrl);
        setModelFormat(completed.format || "glb");
        setGenerationId(completed.generationId || data.generationId);
        trackEvent("generation_completed", {
          mode,
          generationId: completed.generationId || data.generationId,
          creditsUsed: data.creditsUsed || getGenerationCost(),
        });
        await reloadCredits();
        toast.success("3D model generated");
        return;
      }

      setProgress(100);
      setModelUrl(data.modelUrl);
      setModelFormat(data.format || "glb");
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
        "We couldn't generate that model. If credits were reserved, they were refunded automatically. Try again with a simpler prompt."
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
          format: modelFormat,
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
        format: modelFormat,
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
    setModelFormat("glb");
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
    mode === "world" && worldGenerationEnabled
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
  const generationCreditLabel = `${generationCost} credits`;
  const generationDurationLabel =
    mode === "world" && worldGenerationEnabled
      ? worldModel === "mini"
        ? "usually 30-45s"
        : "usually ~5 min"
      : mode === "text"
        ? "usually 2-4 min"
        : "usually 1-2 min";

  return (
    <div className="studio-shell min-h-screen text-white">
      <Navbar />

      <main className="min-h-screen pt-16">
        <div className="grid min-h-[calc(100svh-4rem)] lg:grid-cols-[minmax(0,1fr)_25rem]">
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
              <div className="max-w-xl text-sm leading-6 text-white/56 sm:text-right">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                  Credits {displayedCredits}
                </p>
                <p>
                  Generate a model, preview it here, then save it to your
                  library for download. Failed generations are refunded
                  automatically.
                </p>
              </div>
            </div>

            <div className="relative z-10 h-full pt-32">
              {mode === "world" && worldGenerationEnabled ? (
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
                    <EmptyViewport
                      type="world"
                      title="Your 3D world preview will appear here"
                      detail="Choose a prompt or reference image, then generate a navigable environment."
                      steps={[
                        "Describe the world",
                        "Generate with credits",
                        "Open or download assets",
                      ]}
                    />
                  )}
                </div>
              ) : (
                <div className="h-[calc(100%-8rem)] p-4 lg:p-6">
                  {isGenerating ? (
                    <EmptyViewport
                      type="model"
                      title="Generating 3D model"
                      detail={`${progressLabel} complete. The preview will load here as soon as the model is ready.`}
                      steps={[
                        "Credit reserved",
                        "Building geometry",
                        "Preparing preview",
                      ]}
                      active
                    />
                  ) : modelUrl ? (
                    <div className="h-full min-h-[34rem] overflow-hidden border border-white/10">
                      <ModelViewer modelUrl={modelUrl} format={modelFormat} />
                    </div>
                  ) : (
                    <EmptyViewport
                      type="model"
                      title="Your 3D model preview will appear here"
                      detail="Add a prompt or reference image, then generate to see the real output. The preview stays empty until your model is ready."
                      steps={[
                        "Write a prompt",
                        "Generate with credits",
                        "Save or download",
                      ]}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="absolute inset-x-4 bottom-4 z-30 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-4 lg:inset-x-6">
              {[
                [
                  "Model quality",
                  mode === "world" && worldGenerationEnabled
                    ? worldQualityLabel
                    : "High",
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
              <TabsList
                className={`grid h-auto w-full rounded-none bg-white/[0.04] p-1 ${
                  worldGenerationEnabled ? "grid-cols-3" : "grid-cols-2"
                }`}
              >
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
                {worldGenerationEnabled && (
                  <TabsTrigger
                    value="world"
                    className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Globe className="size-4" />
                    World
                  </TabsTrigger>
                )}
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
                    Premium text generation uses 8 credits. Include material,
                    scale, silhouette, and target use for a cleaner first model.
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

              {worldGenerationEnabled && (
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
                        [
                          "mini",
                          "Draft",
                          "30-45s",
                          `${WORLD_DRAFT_CREDIT_COST} credits`,
                        ],
                        [
                          "plus",
                          "High",
                          "~5 min",
                          `${WORLD_HIGH_CREDIT_COST} credits`,
                        ],
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
              )}
            </Tabs>

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
                      setMode("text");
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
              <p className="text-center text-xs leading-5 text-white/45">
                Uses {generationCreditLabel}. If generation fails, reserved
                credits return automatically. {generationDurationLabel}.
              </p>
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
                ) : mode === "world" && worldGenerationEnabled ? (
                  <>
                    <Globe className="size-4" />
                    Generate 3D world ({generationCreditLabel})
                  </>
                ) : !user ? (
                  <>
                    <Sparkles className="size-4" />
                    Sign in to generate
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate 3D model ({generationCreditLabel})
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
                        <a
                          href={savedUrl || modelUrl}
                          download={`model.${modelFormat}`}
                        >
                          <Download className="size-4" />
                          {modelFormat.toUpperCase()}
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
                  value:
                    mode === "world" && worldGenerationEnabled
                      ? worldQualityLabel
                      : "High",
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

function EmptyViewport({
  type,
  title,
  detail,
  steps,
  active = false,
}: {
  type: "model" | "world";
  title: string;
  detail: string;
  steps?: string[];
  active?: boolean;
}) {
  const Icon = type === "world" ? Globe : Box;

  return (
    <div className="relative flex h-full min-h-[34rem] items-center justify-center overflow-hidden border border-white/10 bg-[#080a08]">
      <div className="absolute inset-0 studio-grid opacity-45" />
      <div className="absolute inset-x-10 top-24 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
      <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10 bg-primary/[0.025]" />
      <div className="absolute left-1/2 top-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-white/10" />
      <div className="relative z-10 max-w-sm text-center">
        <div
          className={`mx-auto flex size-16 items-center justify-center border ${
            active
              ? "border-primary bg-primary text-primary-foreground"
              : "border-white/15 bg-white/[0.03] text-primary"
          }`}
        >
          {active ? (
            <Loader2 className="size-7 animate-spin" />
          ) : (
            <Icon className="size-7" />
          )}
        </div>
        <p className="mt-6 font-display text-3xl font-black leading-none text-white">
          {title}
        </p>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/55">
          {detail}
        </p>
        {steps && steps.length > 0 && (
          <div className="mt-7 grid gap-px border border-white/10 bg-white/10 text-left">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 bg-[#0c0f0c]/95 px-4 py-3"
              >
                <span className="font-mono text-[10px] text-primary/80">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-xs text-white/62">{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>
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
                Use one clear object on a simple background for stronger
                results.
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
