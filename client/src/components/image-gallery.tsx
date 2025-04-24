import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Mail, Phone, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import ZoomableImage from "@/components/zoomable-image";

const ImageGallery = ({ images }:any) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  const handlePrevious = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (showAllPhotos) {
    return (
      <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
        <div className="flex justify-between items-center p-4 text-white">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/20"
            onClick={() => setShowAllPhotos(false)}
          >
            <ChevronLeft className="mr-2" size={16} /> Back
          </Button>
          <div>Photo {selectedImage + 1} of {images.length}</div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image:string, index:number) => (
              <div 
                key={index} 
                className="aspect-[4/3] relative"
                onClick={() => setSelectedImage(index)}
              >
                <img 
                  src={image} 
                  alt={`Vehicle photo ${index + 1}`} 
                  className="object-cover w-full h-full rounded-md cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col lg:flex-row gap-2">
      <div className="relative flex-1 aspect-[4/3] overflow-hidden rounded-md max-h-[500px]">
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
      
      <div className="flex lg:flex-col flex-row lg:w-64 w-full gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[500px]">
        {images.slice(0, 7).map((image:string, index:number) => (
          <div 
            key={index}
            className={`relative aspect-[4/3] lg:h-auto h-20 flex-shrink-0 rounded-md overflow-hidden cursor-pointer 
              ${selectedImage === index ? 'border-2 border-blue-500' : ''}`}
            onClick={() => setSelectedImage(index)}
          >
            <img
              src={image}
              alt={`Vehicle thumbnail ${index + 1}`}
              className="object-cover w-full h-full"
            />
          </div>
        ))}
        
        {images.length > 7 && (
          <div 
            className="relative aspect-[4/3] lg:h-auto h-20 flex-shrink-0 rounded-md overflow-hidden cursor-pointer bg-black/50 flex items-center justify-center text-white"
            onClick={() => setShowAllPhotos(true)}
          >
            <div className="text-center">
              <div>VIEW ALL PHOTOS</div>
              <div>({images.length})</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;
