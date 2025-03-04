import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { optimizeMultipleImages, formatBytes, type OptimizedImage } from "@/lib/image-optimizer";
import { Loader2, ImagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageOptimizerDialogProps {
  images: File[];
  onOptimized: (optimizedImages: OptimizedImage[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageOptimizerDialog({
  images,
  onOptimized,
  open,
  onOpenChange,
}: ImageOptimizerDialogProps) {
  const [optimizing, setOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<OptimizedImage[]>([]);
  const { toast } = useToast();

  const handleOptimize = async () => {
    try {
      setOptimizing(true);
      setProgress(0);

      const optimized = await optimizeMultipleImages(
        images,
        undefined,
        (progress) => setProgress(progress)
      );
      setResults(optimized);

      const totalSaved = optimized.reduce(
        (acc, img) => acc + (img.original.size - img.optimized.size),
        0
      );

      toast({
        title: "Images Optimized Successfully",
        description: `Saved ${formatBytes(totalSaved)} of space across ${optimized.length} images`,
      });

      onOptimized(optimized);
      onOpenChange(false);
    } catch (error) {
      console.error("Error optimizing images:", error);
      toast({
        title: "Optimization Failed",
        description: "There was an error optimizing your images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Optimize Images</DialogTitle>
          <DialogDescription>
            Optimize {images.length} image{images.length !== 1 ? "s" : ""} for web
            display. This will reduce file size while maintaining quality.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {optimizing ? (
            <div className="space-y-4">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                Optimizing images... {Math.round(progress)}%
              </p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <span>Image {index + 1}</span>
                  <span className="text-muted-foreground">
                    {formatBytes(result.original.size)} →{" "}
                    {formatBytes(result.optimized.size)} (
                    {Math.round(result.compressionRatio)}% saved)
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <ImagePlus className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={optimizing}
          >
            Cancel
          </Button>
          <Button onClick={handleOptimize} disabled={optimizing}>
            {optimizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {optimizing ? "Optimizing..." : "Start Optimization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}