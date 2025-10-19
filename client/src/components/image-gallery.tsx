import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Mail, Phone, MapPin, ChevronLeft, ChevronRight, X } from "lucide-react";
import ZoomableImage from "@/components/zoomable-image";

const ImageGallery = ({ images }: any) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [enlargedIndex, setEnlargedIndex] = useState<number | null>(null);
  const thumbnailsRef = useRef<HTMLDivElement | null>(null);

  const handlePrevious = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Scroll thumbnail into view when selectedImage changes
  useEffect(() => {
    if (!thumbnailsRef.current) return;
    const container = thumbnailsRef.current;
    const el = container.querySelector(`[data-index=\"${selectedImage}\"]`) as HTMLElement | null;
    if (el) {
      // smooth scroll the thumbnail into view (works for horizontal and vertical layouts)
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedImage]);

  // keyboard close for enlarged modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setEnlargedIndex(null);
    if (e.key === 'ArrowLeft') {
      setEnlargedIndex((cur) => {
        if (cur === null) return cur;
        return cur === 0 ? images.length - 1 : cur - 1;
      });
    }
    if (e.key === 'ArrowRight') {
      setEnlargedIndex((cur) => {
        if (cur === null) return cur;
        return cur === images.length - 1 ? 0 : cur + 1;
      });
    }
  }, []);

  useEffect(() => {
    if (enlargedIndex !== null) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enlargedIndex, handleKeyDown]);

  if (showAllPhotos) {
    return (
      <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
        <div className="flex justify-between items-center p-4 text-white bg-blue-700/90">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => setShowAllPhotos(false)}
          >
            <ChevronLeft className="mr-2" size={16} /> Back
          </Button>
          <div className="text-sm">Photo {selectedImage + 1} of {images.length}</div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image: string, index: number) => (
              <div
                key={index}
                className="relative bg-white rounded-md overflow-hidden shadow-sm cursor-pointer"
              >
                <button
                  aria-label={`Open image ${index + 1} enlarged`}
                  onClick={() => {
                    setSelectedImage(index);
                    setEnlargedIndex(index);
                  }}
                  className="w-full h-full block"
                >
                  <img
                    src={image}
                    alt={`Vehicle photo ${index + 1}`}
                    className="object-contain w-full h-48 sm:h-56 md:h-44 lg:h-40"
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Enlarged modal for a single image */}
        {enlargedIndex !== null && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
            <div className="relative w-full max-w-4xl mx-auto">
              <button
                aria-label="Close enlarged image"
                onClick={() => setEnlargedIndex(null)}
                className="absolute right-2 top-2 z-50 bg-white/90 text-blue-700 rounded-full p-2 shadow"
              >
                <X size={18} />
              </button>
              <div className="bg-white rounded-md p-2 relative">
                <button
                  aria-label="Previous image"
                  onClick={() => setEnlargedIndex((i) => (i === null ? null : i === 0 ? images.length - 1 : i - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 text-blue-700 rounded-full p-2 shadow z-50"
                >
                  <ChevronLeft size={20} />
                </button>

                <img
                  src={images[enlargedIndex]}
                  alt={`Enlarged image ${enlargedIndex + 1}`}
                  className="object-contain w-full h-full max-h-[80vh] mx-auto"
                />

                <button
                  aria-label="Next image"
                  onClick={() => setEnlargedIndex((i) => (i === null ? null : i === images.length - 1 ? 0 : i + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 text-blue-700 rounded-full p-2 shadow z-50"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col lg:flex-row gap-2 bg-white p-2 rounded-md">
      <div className="relative flex-1 aspect-[4/3] overflow-hidden rounded-md max-h-[600px] bg-white">
        <ZoomableImage
          src={images[selectedImage]}
          alt="Vehicle main view"
        />
        
        <button 
          onClick={handlePrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 z-20"
        >
          <ChevronLeft size={24} />
        </button>
        
        <button 
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 z-20"
        >
          <ChevronRight size={24} />
        </button>
      </div>
      
      <div
        ref={thumbnailsRef}
        className="flex lg:flex-col flex-row lg:w-64 w-full gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[500px] p-1"
      >
        {images.slice(0, 7).map((image: string, index: number) => (
          <div
            key={index}
            data-index={index}
            className={`relative aspect-[4/3] lg:h-auto h-20 flex-shrink-0 rounded-md overflow-hidden cursor-pointer transition-shadow duration-150
              ${selectedImage === index ? 'ring-2 ring-blue-500' : 'ring-0'}`}
            onClick={() => setSelectedImage(index)}
          >
            <img
              src={image}
              alt={`Vehicle thumbnail ${index + 1}`}
              className="object-contain w-full h-full bg-white"
            />
          </div>
        ))}
        
        {images.length > 7 && (
          <div
            className="relative aspect-[4/3] lg:h-auto h-20 flex-shrink-0 rounded-md overflow-hidden cursor-pointer bg-blue-600/90 flex items-center justify-center text-white"
            onClick={() => setShowAllPhotos(true)}
          >
            <div className="text-center text-xs">
              <div className="font-semibold">VIEW ALL PHOTOS</div>
              <div className="text-[10px]">({images.length})</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;
