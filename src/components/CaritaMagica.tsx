import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Camera } from 'lucide-react';

interface CaritaMagicaProps {
  defaultEmoji: string;
  imageUrl?: string;
  isAdmin?: boolean;
  onImageChange?: (file: File) => void;
  isDraggable?: boolean;
}

const CaritaMagica: React.FC<CaritaMagicaProps> = ({ 
  defaultEmoji, 
  imageUrl, 
  isAdmin = false,
  isDraggable = false,
  onImageChange 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (isAdmin && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageChange) {
      onImageChange(file);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('emoji', defaultEmoji);
    if (imageUrl) {
      e.dataTransfer.setData('imageUrl', imageUrl);
    }
  };

  return (
    <div 
      className={`relative w-16 h-16 flex items-center justify-center text-3xl 
        rounded-full overflow-hidden bg-white shadow-md
        ${isAdmin ? 'hover:opacity-80' : ''}
        ${isDraggable ? 'cursor-grab active:cursor-grabbing' : isAdmin ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
    >
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={defaultEmoji} 
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <span>{defaultEmoji}</span>
      )}
      
      {isAdmin && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </>
      )}
    </div>
  );
};

export default CaritaMagica; 