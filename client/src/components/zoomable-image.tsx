import react, { useState, useRef } from 'react';

const ZoomableImage = ({ src, alt }:any) => {
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const zoomFactor = 10

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!imageRef.current) return;
    
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    
    // Calculate cursor position relative to the image
    const x = ((e.clientX - left) / width);
    const y = ((e.clientY - top) / height);
    
    // Constrain values between 0 and 1
    const boundedX = Math.max(0, Math.min(1, x));
    const boundedY = Math.max(0, Math.min(1, y));
    
    setZoomPosition({ x: boundedX, y: boundedY });
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseEnter = () => {
    setShowZoom(true);
  };

  const handleMouseLeave = () => {
    setShowZoom(false);
  };

  return (
    <div className="relative  w-full h-full">
      <div 
        className="w-full h-full cursor-crosshair"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className="object-cover  w-full h-full"
        />
      </div>
      
      {showZoom && (
        <div 
          className="absolute w-32 h-32 border-2 border-gray-200 bg-white rounded-md overflow-hidden shadow-xl pointer-events-none z-50"
          style={{
            top: `${mousePosition.y }px`,
            left: `${mousePosition.x }px`,
            backgroundImage: `url(${src})`,
            backgroundPosition: `${zoomPosition.x  * 100}% ${zoomPosition.y * 100}%`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${zoomFactor * 100}%`,
            transform: 'translate(-40%, -140%)'
          }}
        />
      )}
    </div>
  );
};

export default ZoomableImage