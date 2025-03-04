import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GalleryProps {
  images: string[];
  title: string;
}

export default function VehicleGallery({ images, title }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const next = () => setActiveIndex((i) => (i + 1) % images.length);
  const prev = () => setActiveIndex((i) => (i - 1 + images.length) % images.length);

  return (
    <div className="relative group">
      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
        <img
          src={images[activeIndex]}
          alt={`${title} - Image ${activeIndex + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      <Button
        variant="outline"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={prev}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={next}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <div className="flex gap-2 mt-4 overflow-auto pb-2">
        {images.map((image, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={cn(
              "flex-none w-20 aspect-video rounded-md overflow-hidden",
              activeIndex === i && "ring-2 ring-primary"
            )}
          >
            <img src={image} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
