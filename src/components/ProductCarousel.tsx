import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal, Share2, ExternalLink } from 'lucide-react'

interface Product {
  id: number
  title: string
  subtitle: string
  image: string
  price: number
  category: string
}

interface ProductCarouselProps {
  products: Product[]
  title?: string
}

export function ProductCarousel({ products, title = "Featured Products" }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showProductMenu, setShowProductMenu] = useState<number | null>(null)

  const nextProduct = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length)
  }

  const prevProduct = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length)
  }

  const visibleProducts = products.slice(currentIndex, currentIndex + 3)
  
  // If we don't have enough products to fill 3 slots, wrap around
  if (visibleProducts.length < 3) {
    const remaining = 3 - visibleProducts.length
    visibleProducts.push(...products.slice(0, remaining))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <div className="flex space-x-2">
            <button
              onClick={prevProduct}
              className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              disabled={products.length <= 3}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextProduct}
              className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              disabled={products.length <= 3}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleProducts.map((product, index) => (
            <div key={`${product.id}-${index}`} className="relative group">
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                <div className="aspect-square relative">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowProductMenu(showProductMenu === product.id ? null : product.id)
                    }}
                    className="absolute top-3 right-3 bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  
                  {/* Product Menu */}
                  {showProductMenu === product.id && (
                    <div className="absolute top-12 right-3 bg-white rounded-lg shadow-lg border p-2 z-10 min-w-[120px]">
                      <button 
                        className="flex items-center space-x-2 w-full p-2 hover:bg-gray-50 rounded text-sm transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle share functionality
                          console.log('Share product:', product.title)
                          setShowProductMenu(null)
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                      </button>
                      <button 
                        className="flex items-center space-x-2 w-full p-2 hover:bg-gray-50 rounded text-sm transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle view details
                          console.log('View details for:', product.title)
                          setShowProductMenu(null)
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>View Details</span>
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 line-clamp-1">{product.title}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-1">{product.subtitle}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                      {product.category}
                    </span>
                    <span className="font-bold text-emerald-600">${product.price}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Indicators */}
        {products.length > 3 && (
          <div className="flex justify-center space-x-2 mt-6">
            {Array.from({ length: Math.ceil(products.length / 3) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * 3)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  Math.floor(currentIndex / 3) === index 
                    ? 'bg-emerald-600' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
