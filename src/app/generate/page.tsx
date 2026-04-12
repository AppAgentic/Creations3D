"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Type,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Download,
  RotateCcw,
  Loader2,
  Save,
  Check,
  Globe,
  Coins,
  LogIn,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { WorldViewer, WorldAssets } from "@/components/WorldViewer";
import { toast } from "sonner";
import { authFetch, getAuthHeaders } from "@/lib/api-client";

// Dynamically import ModelViewer to avoid SSR issues with Three.js
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
  const [credits, setCredits] = useState<number | null>(null);

  // World generation state
  const [worldId, setWorldId] = useState<string | null>(null);
  const [worldAssets, setWorldAssets] = useState<WorldAssets | null>(null);
  const [worldModel, setWorldModel] = useState<"mini" | "plus">("plus");
  const [worldInputType, setWorldInputType] = useState<"text" | "image">("text");

  // Fetch credits when user is available
  useEffect(() => {
    if (user) {
      authFetch("/api/user/credits")
        .then((r) => r.json())
        .then((data) => setCredits(data.credits))
        .catch(() => setCredits(null));
    }
  }, [user]);

  const getCreditCost = () => {
    if (mode === "world") return worldModel === "mini" ? 3 : 5;
    return 1;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleGenerate = async () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    // Handle world generation separately
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
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 5;
      });
    }, 1000);

    try {
      let response: Response;

      if (mode === "text") {
        const authHeaders = await getAuthHeaders();
        response = await fetch("/api/generate/text-to-3d", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ prompt }),
        });
      } else {
        const formData = new FormData();
        formData.append("image", imageFile!);

        const authHeaders = await getAuthHeaders();
        response = await fetch("/api/generate/image-to-3d", {
          method: "POST",
          headers: { ...authHeaders },
          body: formData,
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate model");
      }

      setProgress(100);
      setModelUrl(data.modelUrl);
      if (credits !== null) setCredits(credits - getCreditCost());
      toast.success("3D model generated successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate model";
      toast.error(message);
      console.error("Generation error:", error);
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
      const estimatedProgress = Math.min(90, (elapsed / maxTime) * 100);
      setProgress(estimatedProgress);
    }, 1000);

    try {
      let response: Response;

      const authHeaders = await getAuthHeaders();
      if (worldInputType === "text") {
        response = await fetch("/api/generate/world", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
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
          headers: { ...authHeaders },
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
      if (credits !== null) setCredits(credits - getCreditCost());
      toast.success(`3D world generated! (${data.creditCost} credits used)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate world";
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
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/models/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          modelUrl,
          format: "glb",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save model");
      }

      setSavedUrl(data.savedUrl);
      setIsSaved(true);
      toast.success("Model saved to your library!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save model";
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

  const handleSignInAndGenerate = async () => {
    try {
      await signInWithGoogle();
      setShowAuthDialog(false);
      toast.success("Signed in! You can now generate.");
    } catch {
      toast.error("Failed to sign in");
    }
  };

  return (
    <div className="min-h-screen relative">
      <Navbar />

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[400px] rounded-full bg-[oklch(0.4_0.15_265_/_0.04)] blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full bg-[oklch(0.4_0.15_300_/_0.03)] blur-[100px]" />
      </div>

      <main className="relative pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header with credit indicator */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">Generate 3D Model</h1>
              <p className="text-muted-foreground">
                Create stunning 3D models from text or images
              </p>
            </div>
            {credits !== null && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass glass-border">
                <Coins className="h-4 w-4 text-[oklch(0.7_0.18_265)]" />
                <span className="text-sm font-medium">{credits} credits</span>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <div className="rounded-2xl glass glass-border p-6">
              <h2 className="font-semibold mb-4">Input</h2>
              <Tabs
                value={mode}
                onValueChange={(v) => setMode(v as "text" | "image" | "world")}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    <span className="hidden sm:inline">Text to 3D</span>
                    <span className="sm:hidden">Text</span>
                  </TabsTrigger>
                  <TabsTrigger value="image" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Image to 3D</span>
                    <span className="sm:hidden">Image</span>
                  </TabsTrigger>
                  <TabsTrigger value="world" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">3D World</span>
                    <span className="sm:hidden">World</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="mt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="prompt">Describe your 3D model</Label>
                      <Textarea
                        id="prompt"
                        placeholder="A cute low-poly cat sitting on a cushion..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="mt-2 min-h-32 bg-background/50"
                        disabled={isGenerating}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Be specific about style, colors, and details for better results.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="image" className="mt-6">
                  <div className="space-y-4">
                    <Label>Upload an image</Label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                        imagePreview
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/50 hover:border-primary/30 hover:bg-primary/5"
                      }`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                    >
                      {imagePreview ? (
                        <div className="space-y-4">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-h-48 mx-auto rounded-lg"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                            disabled={isGenerating}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground text-sm mb-3">
                              Drag and drop an image, or
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              disabled={isGenerating}
                            >
                              <label className="cursor-pointer">
                                Browse files
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  disabled={isGenerating}
                                />
                              </label>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="world" className="mt-6">
                  <div className="space-y-6">
                    {/* Model Quality Selector */}
                    <div className="space-y-3">
                      <Label>Quality</Label>
                      <RadioGroup
                        value={worldModel}
                        onValueChange={(v) => setWorldModel(v as "mini" | "plus")}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div className="relative">
                          <RadioGroupItem
                            value="mini"
                            id="mini"
                            className="peer sr-only"
                            disabled={isGenerating}
                          />
                          <Label
                            htmlFor="mini"
                            className="flex flex-col items-center justify-between rounded-xl border border-border/50 bg-background/30 p-4 hover:bg-accent/30 peer-data-[state=checked]:border-primary/50 peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary/50 cursor-pointer transition-all"
                          >
                            <span className="font-semibold">Draft</span>
                            <span className="text-sm text-muted-foreground">30-45 seconds</span>
                            <span className="text-xs text-primary mt-1">3 credits</span>
                          </Label>
                        </div>
                        <div className="relative">
                          <RadioGroupItem
                            value="plus"
                            id="plus"
                            className="peer sr-only"
                            disabled={isGenerating}
                          />
                          <Label
                            htmlFor="plus"
                            className="flex flex-col items-center justify-between rounded-xl border border-border/50 bg-background/30 p-4 hover:bg-accent/30 peer-data-[state=checked]:border-primary/50 peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary/50 cursor-pointer transition-all"
                          >
                            <span className="font-semibold">High Quality</span>
                            <span className="text-sm text-muted-foreground">~5 minutes</span>
                            <span className="text-xs text-primary mt-1">5 credits</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Input Type Selector */}
                    <div className="space-y-3">
                      <Label>Input Type</Label>
                      <RadioGroup
                        value={worldInputType}
                        onValueChange={(v) => setWorldInputType(v as "text" | "image")}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="text" id="world-text" disabled={isGenerating} />
                          <Label htmlFor="world-text" className="cursor-pointer">
                            Text prompt
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="image" id="world-image" disabled={isGenerating} />
                          <Label htmlFor="world-image" className="cursor-pointer">
                            Image
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Input based on type */}
                    {worldInputType === "text" ? (
                      <div className="space-y-2">
                        <Label htmlFor="world-prompt">Describe your 3D world</Label>
                        <Textarea
                          id="world-prompt"
                          placeholder="A cozy coffee shop with warm lighting, wooden furniture, and plants by the window..."
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="min-h-32 bg-background/50"
                          disabled={isGenerating}
                        />
                        <p className="text-sm text-muted-foreground">
                          Describe the environment, lighting, and atmosphere.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Upload a reference image</Label>
                        <div
                          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                            imagePreview
                              ? "border-primary/50 bg-primary/5"
                              : "border-border/50 hover:border-primary/30"
                          }`}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDrop}
                        >
                          {imagePreview ? (
                            <div className="space-y-3">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="max-h-32 mx-auto rounded-lg"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setImageFile(null);
                                  setImagePreview(null);
                                }}
                                disabled={isGenerating}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                              <Button variant="outline" size="sm" asChild disabled={isGenerating}>
                                <label className="cursor-pointer">
                                  Browse files
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isGenerating}
                                  />
                                </label>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Generate button with credit cost */}
              <div className="flex gap-3 mt-6">
                <Button
                  className="flex-1 glow-sm hover:glow-md transition-shadow"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === "world" ? "Generating World..." : "Generating..."}
                    </>
                  ) : (
                    <>
                      {mode === "world" ? (
                        <Globe className="mr-2 h-4 w-4" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Generate ({getCreditCost()} {getCreditCost() === 1 ? "credit" : "credits"})
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isGenerating}
                  className="border-border/50"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {isGenerating && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Generating...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <div className="rounded-2xl glass glass-border p-6">
              <h2 className="font-semibold mb-4">
                {mode === "world" ? "3D World Preview" : "3D Preview"}
              </h2>
              {mode === "world" ? (
                <div className="space-y-4">
                  {isGenerating ? (
                    <div className="aspect-video rounded-xl bg-background/30 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                        <p className="text-muted-foreground">
                          Creating your 3D world...
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {worldModel === "mini" ? "~30-45 seconds" : "~5 minutes"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <WorldViewer
                      worldId={worldId}
                      assets={worldAssets || undefined}
                      className="aspect-video"
                    />
                  )}
                </div>
              ) : (
                <>
                  <div className="aspect-square rounded-xl overflow-hidden border border-border/30">
                    {isGenerating ? (
                      <div className="w-full h-full bg-background/30 flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                          <p className="text-muted-foreground">
                            Creating your 3D model...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <ModelViewer modelUrl={modelUrl} />
                    )}
                  </div>

                  {modelUrl && (
                    <div className="mt-4 space-y-3">
                      <Button
                        className="w-full glow-sm"
                        onClick={handleSaveToLibrary}
                        disabled={isSaving || isSaved}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : isSaved ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Saved to Library
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save to Library
                          </>
                        )}
                      </Button>
                      <div className="flex gap-2">
                        <Button className="flex-1" variant="outline" asChild>
                          <a href={savedUrl || modelUrl} download="model.glb">
                            <Download className="mr-2 h-4 w-4" />
                            Download GLB
                          </a>
                        </Button>
                        <Button className="flex-1" variant="outline" disabled>
                          <Download className="mr-2 h-4 w-4" />
                          Download OBJ
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Auth Dialog — shown when unauthenticated user tries to generate */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-sm glass glass-border">
          <DialogHeader className="text-center">
            <div className="h-16 w-16 rounded-2xl glass glass-border flex items-center justify-center mx-auto mb-2">
              <Sparkles className="h-8 w-8 text-[oklch(0.7_0.18_265)]" />
            </div>
            <DialogTitle className="text-xl">Sign in to Generate</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a free account to start generating 3D models. Your first generations are on us.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Button
              className="w-full glow-sm"
              size="lg"
              onClick={handleSignInAndGenerate}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              By signing in, you agree to our terms of service.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
