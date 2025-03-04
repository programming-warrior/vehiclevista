import { useState } from "react";
import { ChevronLeft, ChevronRight, Image } from "lucide-react";
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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = "data:image/svg+xml," + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2"/>
        <path d="M2 8h20"/>
        <path d="M12 12v4"/>
        <path d="M10 14h4"/>
      </svg>
    `);
    target.classList.add("bg-muted", "p-4");
  };

  return (
    <div className="relative group">
      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
        <img
          src={images[activeIndex]}
          alt={`${title} - Image ${activeIndex + 1}`}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      </div>

      {images.length > 1 && (
        <>
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
        </>
      )}

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
            <img 
              src={image} 
              alt="" 
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          </button>
        ))}
      </div>
    </div>
  );
}