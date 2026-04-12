"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  Wand2,
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

const ModelViewer = dynamic(
  () => import("@/components/ModelViewer").then((mod) => mod.ModelViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-cyan/50" />
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

  const [worldId, setWorldId] = useState<string | null>(null);
  const [worldAssets, setWorldAssets] = useState<WorldAssets | null>(null);
  const [worldModel, setWorldModel] = useState<"mini" | "plus">("plus");
  const [worldInputType, setWorldInputType] = useState<"text" | "image">("text");

  const [showAuthDialog, setShowAuthDialog] = useState(false);

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
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    if (mode === "world") { await handleGenerateWorld(); return; }

    if (mode === "text" && !prompt.trim()) { toast.error("Please enter a prompt"); return; }
    if (mode === "image" && !imageFile) { toast.error("Please upload an image"); return; }

    setIsGenerating(true);
    setProgress(0);
    setModelUrl(null);

    const progressInterval = setInterval(() => {
      setProgress((prev) => prev >= 90 ? prev : prev + Math.random() * 5);
    }, 1000);

    try {
      let response: Response;
      const authHeaders = await getAuthHeaders();

      if (mode === "text") {
        response = await fetch("/api/generate/text-to-3d", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ prompt }),
        });
      } else {
        const formData = new FormData();
        formData.append("image", imageFile!);
        response = await fetch("/api/generate/image-to-3d", {
          method: "POST",
          headers: { ...authHeaders },
          body: formData,
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate model");

      setProgress(100);
      setModelUrl(data.modelUrl);
      if (credits !== null) setCredits(credits - getCreditCost());
      toast.success("3D model generated successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate model");
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const handleGenerateWorld = async () => {
    if (worldInputType === "text" && !prompt.trim()) { toast.error("Please enter a prompt"); return; }
    if (worldInputType === "image" && !imageFile) { toast.error("Please upload an image"); return; }

    setIsGenerating(true);
    setProgress(0);
    setWorldId(null);
    setWorldAssets(null);

    const maxTime = worldModel === "mini" ? 60000 : 300000;
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      setProgress(Math.min(90, ((Date.now() - startTime) / maxTime) * 100));
    }, 1000);

    try {
      const authHeaders = await getAuthHeaders();
      let response: Response;

      if (worldInputType === "text") {
        response = await fetch("/api/generate/world", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ type: "text", prompt, model: worldModel }),
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
      if (!response.ok) throw new Error(data.error || "Failed to generate world");

      setProgress(100);
      setWorldId(data.worldId);
      setWorldAssets(data.assets);
      if (credits !== null) setCredits(credits - getCreditCost());
      toast.success(`3D world generated! (${data.creditCost} credits used)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate world");
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
        body: JSON.stringify({ modelUrl, format: "glb" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save model");
      setSavedUrl(data.savedUrl);
      setIsSaved(true);
      toast.success("Model saved to your library!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save model");
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

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-[10%] w-[400px] h-[350px] rounded-full bg-[oklch(0.35_0.12_195_/_0.05)] blur-[120px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[300px] h-[300px] rounded-full bg-[oklch(0.35_0.15_290_/_0.04)] blur-[100px]" />
      </div>

      <main className="relative pt-24 pb-8 px-4">
        <div className="max-w-[1400px] mx-auto">
          {/* ═══ Top bar ═══ */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-cyan/8 flex items-center justify-center">
                <Wand2 className="h-4.5 w-4.5 text-cyan" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Generate</h1>
                <p className="text-[12px] text-muted-foreground">Create 3D models from text or images</p>
              </div>
            </div>
            {credits !== null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-surface text-[12px] font-medium">
                <Coins className="h-3.5 w-3.5 text-cyan" />
                <span className="tabular-nums">{credits}</span>
                <span className="text-muted-foreground">credits</span>
              </div>
            )}
          </div>

          {/* ═══ Main workspace ═══ */}
          <div className="grid lg:grid-cols-[420px_1fr] gap-4">
            {/* ═══ LEFT: Controls ═══ */}
            <div className="glass-card rounded-2xl flex flex-col">
              {/* Tabs header */}
              <div className="p-4 pb-0">
                <Tabs
                  value={mode}
                  onValueChange={(v) => setMode(v as "text" | "image" | "world")}
                >
                  <TabsList className="grid w-full grid-cols-3 bg-background/40 p-1 rounded-xl h-auto">
                    <TabsTrigger
                      value="text"
                      className="flex items-center gap-1.5 text-[12px] py-2 rounded-lg data-[state=active]:bg-cyan/10 data-[state=active]:text-cyan"
                    >
                      <Type className="h-3.5 w-3.5" />
                      Text
                    </TabsTrigger>
                    <TabsTrigger
                      value="image"
                      className="flex items-center gap-1.5 text-[12px] py-2 rounded-lg data-[state=active]:bg-violet/10 data-[state=active]:text-violet"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      Image
                    </TabsTrigger>
                    <TabsTrigger
                      value="world"
                      className="flex items-center gap-1.5 text-[12px] py-2 rounded-lg data-[state=active]:bg-magenta/10 data-[state=active]:text-magenta"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      World
                    </TabsTrigger>
                  </TabsList>

                  {/* ─── Text to 3D ─── */}
                  <TabsContent value="text" className="mt-4">
                    <div className="space-y-3">
                      <Label htmlFor="prompt" className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                        Prompt
                      </Label>
                      <Textarea
                        id="prompt"
                        placeholder="A cute low-poly cat sitting on a cushion..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[140px] bg-background/40 border-border/30 text-[14px] resize-none placeholder:text-muted-foreground/40 focus:border-cyan/40 focus:ring-cyan/20"
                        disabled={isGenerating}
                      />
                      <p className="text-[11px] text-muted-foreground/60">
                        Be specific about style, colors, and details for better results.
                      </p>
                    </div>
                  </TabsContent>

                  {/* ─── Image to 3D ─── */}
                  <TabsContent value="image" className="mt-4">
                    <div className="space-y-3">
                      <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                        Reference Image
                      </Label>
                      <div
                        className={`rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                          imagePreview
                            ? "border-violet/30 bg-violet/5"
                            : "border-border/30 hover:border-violet/20 hover:bg-violet/5"
                        }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                      >
                        {imagePreview ? (
                          <div className="space-y-3">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="max-h-40 mx-auto rounded-lg"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[12px] h-7 border-border/30"
                              onClick={() => { setImageFile(null); setImagePreview(null); }}
                              disabled={isGenerating}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3 py-4">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground/40" />
                            <p className="text-[13px] text-muted-foreground/60 mb-2">
                              Drag & drop or browse
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[12px] h-7 border-border/30"
                              asChild
                              disabled={isGenerating}
                            >
                              <label className="cursor-pointer">
                                Choose File
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
                  </TabsContent>

                  {/* ─── 3D World ─── */}
                  <TabsContent value="world" className="mt-4">
                    <div className="space-y-5">
                      {/* Quality */}
                      <div className="space-y-2">
                        <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                          Quality
                        </Label>
                        <RadioGroup
                          value={worldModel}
                          onValueChange={(v) => setWorldModel(v as "mini" | "plus")}
                          className="grid grid-cols-2 gap-2"
                        >
                          {[
                            { value: "mini", label: "Draft", time: "30-45s", cost: "3" },
                            { value: "plus", label: "HD", time: "~5 min", cost: "5" },
                          ].map((q) => (
                            <div key={q.value} className="relative">
                              <RadioGroupItem value={q.value} id={q.value} className="peer sr-only" disabled={isGenerating} />
                              <Label
                                htmlFor={q.value}
                                className="flex flex-col items-center rounded-xl border border-border/30 bg-background/30 p-3 cursor-pointer transition-all hover:bg-magenta/5 peer-data-[state=checked]:border-magenta/40 peer-data-[state=checked]:bg-magenta/8"
                              >
                                <span className="text-[13px] font-medium">{q.label}</span>
                                <span className="text-[11px] text-muted-foreground">{q.time}</span>
                                <span className="text-[10px] text-magenta mt-0.5">{q.cost} credits</span>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Input type */}
                      <div className="space-y-2">
                        <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                          Input
                        </Label>
                        <RadioGroup
                          value={worldInputType}
                          onValueChange={(v) => setWorldInputType(v as "text" | "image")}
                          className="flex gap-3"
                        >
                          {["text", "image"].map((t) => (
                            <div key={t} className="flex items-center space-x-1.5">
                              <RadioGroupItem value={t} id={`world-${t}`} disabled={isGenerating} />
                              <Label htmlFor={`world-${t}`} className="text-[13px] cursor-pointer capitalize">{t === "text" ? "Text prompt" : "Image"}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* World input */}
                      {worldInputType === "text" ? (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="A cozy coffee shop with warm lighting..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="min-h-[100px] bg-background/40 border-border/30 text-[14px] resize-none placeholder:text-muted-foreground/40 focus:border-magenta/40 focus:ring-magenta/20"
                            disabled={isGenerating}
                          />
                        </div>
                      ) : (
                        <div
                          className={`rounded-xl border-2 border-dashed p-5 text-center transition-all ${
                            imagePreview ? "border-magenta/30 bg-magenta/5" : "border-border/30 hover:border-magenta/20"
                          }`}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDrop}
                        >
                          {imagePreview ? (
                            <div className="space-y-2">
                              <img src={imagePreview} alt="Preview" className="max-h-28 mx-auto rounded-lg" />
                              <Button variant="outline" size="sm" className="text-[11px] h-6 border-border/30" onClick={() => { setImageFile(null); setImagePreview(null); }} disabled={isGenerating}>
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2 py-2">
                              <Upload className="h-6 w-6 mx-auto text-muted-foreground/40" />
                              <Button variant="outline" size="sm" className="text-[11px] h-6 border-border/30" asChild disabled={isGenerating}>
                                <label className="cursor-pointer">
                                  Browse
                                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isGenerating} />
                                </label>
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* ─── Bottom actions ─── */}
              <div className="p-4 border-t border-border/20">
                {isGenerating && (
                  <div className="mb-3 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Generating...</span>
                      <span className="tabular-nums">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    className="flex-1 h-10 text-[13px] font-medium glow-sm hover:glow-md transition-all"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        Generate
                        <span className="ml-1.5 text-[11px] opacity-60">
                          {getCreditCost()} cr
                        </span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 border-border/30 shrink-0"
                    onClick={handleReset}
                    disabled={isGenerating}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* ═══ RIGHT: Preview ═══ */}
            <div className="glass-card rounded-2xl flex flex-col min-h-[500px]">
              {/* Preview header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/15">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan/60" />
                  <span className="text-[12px] font-medium text-muted-foreground">
                    {mode === "world" ? "World Preview" : "3D Preview"}
                  </span>
                </div>
                {modelUrl && (
                  <div className="flex items-center gap-1.5 text-[11px] text-cyan/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
                    Ready
                  </div>
                )}
              </div>

              {/* Preview content */}
              <div className="flex-1 p-3">
                {mode === "world" ? (
                  <div className="h-full">
                    {isGenerating ? (
                      <div className="h-full rounded-xl bg-background/30 flex items-center justify-center">
                        <div className="text-center space-y-3">
                          <Loader2 className="h-8 w-8 animate-spin text-magenta/60 mx-auto" />
                          <p className="text-[13px] text-muted-foreground">Creating your 3D world...</p>
                          <p className="text-[11px] text-muted-foreground/50">{worldModel === "mini" ? "~30-45 seconds" : "~5 minutes"}</p>
                        </div>
                      </div>
                    ) : (
                      <WorldViewer worldId={worldId} assets={worldAssets || undefined} className="h-full" />
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 rounded-xl overflow-hidden border border-border/15">
                      {isGenerating ? (
                        <div className="w-full h-full bg-background/30 flex items-center justify-center">
                          <div className="text-center space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-cyan/60 mx-auto" />
                            <p className="text-[13px] text-muted-foreground">Creating your 3D model...</p>
                          </div>
                        </div>
                      ) : (
                        <ModelViewer modelUrl={modelUrl} />
                      )}
                    </div>

                    {/* Actions */}
                    {modelUrl && (
                      <div className="mt-3 space-y-2">
                        <Button
                          className="w-full h-9 text-[12px] glow-sm"
                          onClick={handleSaveToLibrary}
                          disabled={isSaving || isSaved}
                        >
                          {isSaving ? (
                            <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving...</>
                          ) : isSaved ? (
                            <><Check className="mr-1.5 h-3.5 w-3.5" />Saved to Library</>
                          ) : (
                            <><Save className="mr-1.5 h-3.5 w-3.5" />Save to Library</>
                          )}
                        </Button>
                        <div className="flex gap-2">
                          <Button className="flex-1 h-8 text-[11px]" variant="outline" asChild>
                            <a href={savedUrl || modelUrl} download="model.glb">
                              <Download className="mr-1.5 h-3 w-3" /> GLB
                            </a>
                          </Button>
                          <Button className="flex-1 h-8 text-[11px]" variant="outline" disabled>
                            <Download className="mr-1.5 h-3 w-3" /> OBJ
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ═══ Auth Dialog ═══ */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-sm glass-card gradient-border">
          <DialogHeader className="text-center">
            <div className="h-14 w-14 rounded-2xl bg-cyan/10 flex items-center justify-center mx-auto mb-2">
              <Sparkles className="h-7 w-7 text-cyan" />
            </div>
            <DialogTitle className="text-lg">Sign in to Generate</DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">
              Create a free account to start generating 3D models.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Button className="w-full h-10 glow-sm text-[13px]" onClick={handleSignInAndGenerate}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
            <p className="text-center text-[11px] text-muted-foreground/50">
              By signing in, you agree to our terms of service.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
