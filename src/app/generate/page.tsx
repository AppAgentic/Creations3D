"use client";

import { useState } from "react";
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
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { WorldViewer, WorldAssets } from "@/components/WorldViewer";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/api-client";

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
  useAuth(); // Ensure auth context is available
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

  // World generation state
  const [worldId, setWorldId] = useState<string | null>(null);
  const [worldAssets, setWorldAssets] = useState<WorldAssets | null>(null);
  const [worldModel, setWorldModel] = useState<"mini" | "plus">("plus");
  const [worldInputType, setWorldInputType] = useState<"text" | "image">("text");

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

  const handleGenerate = async () => {
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

    // Progress simulation (actual generation takes 30-60 seconds)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 5;
      });
    }, 1000);

    try {
      let response: Response;

      if (mode === "text") {
        // Text to 3D API call
        const authHeaders = await getAuthHeaders();
        response = await fetch("/api/generate/text-to-3d", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ prompt }),
        });
      } else {
        // Image to 3D API call
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

    // Progress simulation - world generation takes longer
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
    // Reset world state
    setWorldId(null);
    setWorldAssets(null);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Generate 3D Model</h1>
            <p className="text-muted-foreground">
              Create stunning 3D models from text or images
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Input</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={mode}
                  onValueChange={(v) => setMode(v as "text" | "image" | "world")}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      Text to 3D
                    </TabsTrigger>
                    <TabsTrigger value="image" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Image to 3D
                    </TabsTrigger>
                    <TabsTrigger value="world" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      3D World
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
                          className="mt-2 min-h-32"
                          disabled={isGenerating}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Be specific about style, colors, and details for better
                        results.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="image" className="mt-6">
                    <div className="space-y-4">
                      <Label>Upload an image</Label>
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          imagePreview
                            ? "border-primary"
                            : "border-muted-foreground/25 hover:border-primary/50"
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
                            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground mb-2">
                                Drag and drop an image, or
                              </p>
                              <Button
                                variant="outline"
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
                          className="grid grid-cols-2 gap-4"
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
                              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <span className="font-semibold">Draft</span>
                              <span className="text-sm text-muted-foreground">
                                30-45 seconds
                              </span>
                              <span className="text-xs text-muted-foreground mt-1">
                                3 credits
                              </span>
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
                              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <span className="font-semibold">High Quality</span>
                              <span className="text-sm text-muted-foreground">
                                ~5 minutes
                              </span>
                              <span className="text-xs text-muted-foreground mt-1">
                                5 credits
                              </span>
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
                            className="min-h-32"
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
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                              imagePreview
                                ? "border-primary"
                                : "border-muted-foreground/25 hover:border-primary/50"
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

                <div className="flex gap-4 mt-6">
                  <Button
                    className="flex-1"
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
                        {mode === "world"
                          ? `Generate 3D World (${worldModel === "mini" ? "3" : "5"} credits)`
                          : "Generate 3D Model"}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isGenerating}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                {isGenerating && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Generating...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview Panel */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {mode === "world" ? "3D World Preview" : "3D Preview"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mode === "world" ? (
                  // World Viewer for 3D World mode
                  <div className="space-y-4">
                    {isGenerating ? (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <Skeleton className="h-32 w-32 mx-auto rounded-lg" />
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
                  // Model Viewer for Text/Image to 3D modes
                  <>
                    <div className="aspect-square rounded-lg overflow-hidden">
                      {isGenerating ? (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <div className="text-center space-y-4">
                            <Skeleton className="h-32 w-32 mx-auto rounded-lg" />
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
                          className="w-full"
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
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
