"use client";

import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Globe } from "lucide-react";

export interface WorldAssets {
  splat100k?: string;
  splat500k?: string;
  splatFull?: string;
  glbMesh?: string;
  panorama?: string;
}

interface WorldViewerProps {
  worldId: string | null;
  assets?: WorldAssets;
  className?: string;
}

export function WorldViewer({
  worldId,
  assets,
  className = "",
}: WorldViewerProps) {
  if (!worldId) {
    return (
      <div
        className={`bg-muted rounded-lg flex items-center justify-center ${className}`}
      >
        <div className="text-center space-y-4 p-8">
          <Globe className="h-16 w-16 mx-auto text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">
              Your 3D world will appear here
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Generate a navigable 3D environment from text or an image
            </p>
          </div>
        </div>
      </div>
    );
  }

  const viewerUrl = `https://marble.worldlabs.ai/world/${worldId}`;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Embedded 3D World Viewer */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        <iframe
          src={viewerUrl}
          className="w-full h-full"
          allow="accelerometer; gyroscope; fullscreen"
          title="3D World Viewer"
        />
      </div>

      {/* Actions Row */}
      <div className="flex flex-wrap gap-2">
        {/* Open in new tab */}
        <Button variant="outline" size="sm" asChild>
          <a href={viewerUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open world viewer
          </a>
        </Button>

        {/* Download buttons for assets */}
        {assets?.glbMesh && (
          <Button variant="outline" size="sm" asChild>
            <a href={assets.glbMesh} download={`world-${worldId}.glb`}>
              <Download className="mr-2 h-4 w-4" />
              Download GLB
            </a>
          </Button>
        )}

        {assets?.splatFull && (
          <Button variant="outline" size="sm" asChild>
            <a href={assets.splatFull} download={`world-${worldId}.spz`}>
              <Download className="mr-2 h-4 w-4" />
              Download SPZ scene
            </a>
          </Button>
        )}

        {assets?.panorama && (
          <Button variant="outline" size="sm" asChild>
            <a
              href={assets.panorama}
              download={`world-${worldId}-panorama.jpg`}
            >
              <Download className="mr-2 h-4 w-4" />
              Download panorama
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
