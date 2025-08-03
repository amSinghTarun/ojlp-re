"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ArticleType } from "@prisma/client"

interface ArticleCarouselProps {
  articles: Partial<ArticleType>[]
  issueInfo?: string
}

export function ArticleCarousel({ articles, issueInfo }: ArticleCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % articles.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide === 0 ? articles.length - 1 : prevSlide - 1))
  }

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!isHovering) {
        nextSlide()
      }
    }, 8000) // Slower transition for reading

    return () => clearInterval(intervalId)
  }, [isHovering])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      nextSlide()
    }

    if (touchStart - touchEnd < -50) {
      prevSlide()
    }
  }

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="relative w-full"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {articles.map((article, index) => (
          <div
            key={article.slug}
            className={`w-full transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100 block" : "opacity-0 hidden"
            }`}
          >
            {/* Clean white background */}
            {/* <div className="absolute inset-0 bg-white" /> */}
            
            {/* Content Container */}
            <div className="relative z-20 py-10 md:py-16">
              <div className="container mx-auto px-4 max-w-4xl xl:max-w-6xl">
                <div className="text-center space-y-6">
                  
                  {/* Article Type Label */}
                  <div>
                    <span className="text-sm font-semibold text-red-800">
                      ARTICLE
                    </span>
                  </div>

                  {/* Article Title */}
                  <div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl text-stone-800 leading-tight max-w-4xl mx-auto px-4">
                      {article.title?.toUpperCase()}
                    </h1>
                  </div>

                  {/* Article Description/Excerpt */}
                  {article.abstract && (
                    <div className="">
                      <h2 className="text-stone-800 font-medium text-base md:text-lg leading-relaxed px-6">
                        {article.abstract}
                        {article.abstract}
                      </h2>
                    </div>
                  )}

                  {/* Author */}
                  {article.author && (
                    <div>
                      <span className="text-sm text-stone-600">
                        {article.author.toUpperCase()}
                      </span>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full text-stone-400 hover:text-stone-100 hover:bg-red-800 transition-all duration-300"
        onClick={prevSlide}
        aria-label="Previous article"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full text-stone-400 hover:text-stone-100 hover:bg-red-800 transition-all duration-300"
        onClick={nextSlide}
        aria-label="Next article"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Pagination Dots */}
      {/* <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-3">
        {articles.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? "bg-red-700 scale-125" 
                : "bg-gray-300 hover:bg-gray-400"
            }`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to article ${index + 1}`}
          />
        ))}
      </div> */}

      {/* Progress Bar */}
      {/* <div className="absolute bottom-0 left-0 w-full px-10 h-0.5 z-30">
        <div 
          className="h-full bg-red-700 transition-all duration-300 ease-out"
        />
      </div> */}
    </div>
  )
}