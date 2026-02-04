'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';

export interface ProductCardProps {
  product: {
    id: string;
    title: string;
    description?: string;
    images?: string[];
    base_price?: number;
    rating?: number;
    reviews_count?: number;
    type?: 'product' | 'service';
    delivery_time?: string;
  };
  variant?: 'grid' | 'list' | 'featured';
  showDescription?: boolean;
  showRating?: boolean;
  showDeliveryTime?: boolean;
  onShare?: (product: { id: string; title: string }) => void;
  onDelete?: (productId: string) => void;
  isOwner?: boolean;
  isDeleting?: boolean;
}

export default function ProductCard({
  product,
  variant = 'grid',
  showDescription = true,
  showRating = true,
  showDeliveryTime = false,
  onShare,
  onDelete,
  isOwner = false,
  isDeleting = false,
}: ProductCardProps) {
  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const price = typeof product.base_price === 'number' && product.base_price >= 0 ? product.base_price : undefined;
  const rating = product.rating ?? 0;
  const reviewsCount = product.reviews_count ?? 0;

  if (variant === 'list') {
    return (
      <Link
        href={`/product/${product.id}`}
        className="group flex gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-lg transition-shadow"
      >
        {/* Image */}
        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
          {images.length > 0 ? (
            <Image
              src={images[0]}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              No image
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-2 mb-1">
            {product.title}
          </h3>
          {showDescription && product.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
              {product.description}
            </p>
          )}
          <div className="flex items-center gap-4">
            {showRating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {rating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({reviewsCount})
                </span>
              </div>
            )}
            {showDeliveryTime && product.delivery_time && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {product.delivery_time} delivery
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="shrink-0 text-right">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">From</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            ${price ?? 0}
          </div>
        </div>
      </Link>
    );
  }

  // Grid or Featured variant
  return (
    <Link
      href={`/product/${product.id}`}
      className={`group block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow ${
        variant === 'featured' ? 'h-full' : ''
      }`}
    >
      {/* Image */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {images.length > 0 ? (
          <Image
            src={images[0]}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
            sizes="(min-width: 768px) 33vw, 100vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}

        {/* Action buttons */}
        {onShare && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onShare({ id: product.id, title: product.title });
            }}
            className="absolute right-2 top-2 bg-white/90 hover:bg-white text-gray-700 rounded-full px-2.5 py-1 text-xs shadow"
          >
            Share
          </button>
        )}
        {isOwner && onDelete && !product.id.startsWith('dummy-') && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onDelete(product.id);
            }}
            disabled={isDeleting}
            className="absolute left-2 top-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full px-2.5 py-1 text-xs shadow disabled:opacity-60"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        )}

        {/* Product type badge */}
        {product.type && (
          <div className="absolute left-2 bottom-2">
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              product.type === 'service'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
            }`}>
              {product.type === 'service' ? 'Service' : 'Digital'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-2 mb-2">
          {product.title}
        </h3>

        {showDescription && product.description && variant === 'featured' && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        {/* Rating & Price */}
        <div className="flex items-center justify-between">
          {showRating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {rating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({reviewsCount})
              </span>
            </div>
          )}
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">From</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              ${price ?? 0}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
