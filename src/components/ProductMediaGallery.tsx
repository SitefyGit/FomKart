'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface ProductMediaGalleryProps {
  images: string[];
  youtubeVideoId?: string;
  title: string;
}

export function ProductMediaGallery({ images, youtubeVideoId, title }: ProductMediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine images and video into a single list
  const mediaItems = [
    ...images.map((src, index) => ({ type: 'image' as const, src, id: `img-${index}` })),
    ...(youtubeVideoId ? [{ type: 'video' as const, src: youtubeVideoId, id: 'video-1' }] : [])
  ];

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  if (mediaItems.length === 0) return null;

  const currentItem = mediaItems[currentIndex];

  return (
    <div className="space-y-4">
      {/* Main Display */}
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
        {currentItem.type === 'video' ? (
          <iframe
            src={`https://www.youtube.com/embed/${currentItem.src}`}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <Image
            src={currentItem.src}
            alt={title}
            fill
            className="object-cover"
          />
        )}

        {/* Navigation Arrows */}
        {mediaItems.length > 1 && (
          <>
            <button
              onClick={prevMedia}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10 opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMedia}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10 opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {mediaItems.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {mediaItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setCurrentIndex(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                currentIndex === index ? 'border-blue-600' : 'border-transparent hover:border-gray-300'
              }`}
            >
              {item.type === 'video' ? (
                <div className="w-full h-full bg-gray-900 relative">
                   <img 
                     src={`https://img.youtube.com/vi/${item.src}/0.jpg`} 
                     alt="Video thumbnail"
                     className="w-full h-full object-cover opacity-70"
                   />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Play className="w-8 h-8 text-white fill-white" />
                   </div>
                </div>
              ) : (
                <Image
                  src={item.src}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
