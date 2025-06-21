"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Article } from "@/lib/types"

interface ArticleCarouselProps {
  articles: Partial<Article>[]
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
    <div className="relative w-full h-full overflow-hidden bg-white">
      <div
        className="relative w-full"
        style={{ minHeight: "400px" }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {articles.map((article, index) => (
          <div
            key={article.slug}
            className={` inset-0 w-full h-full transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            {/* Clean white background */}
            {/* <div className="absolute inset-0 bg-white" /> */}
            
            {/* Content Container */}
            <div className="absolute inset-0 z-20 flex py-5">
              <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center space-y-4">
                  
                  {/* Article Type Label */}
                  <div className="mb-6">
                    <span className="text-xs font-semibold tracking-[0.3em] text-gray-800 uppercase">
                      ARTICLE
                    </span>
                  </div>

                  {/* Article Title */}
                  <div className="space-y-3 mb-6">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif text-red-700 leading-tight max-w-4xl mx-auto px-4">
                      {article.title}
                    </h1>
                  </div>

                  {/* Author */}
                  <div className="mb-6">
                    <h2 className="text-base md:text-lg text-gray-800 font-normal">
                      {article.author}
                    </h2>
                  </div>

                  {/* Article Description/Excerpt */}
                  <div className="max-w-3xl mx-auto mb-8">
                    <p className="text-gray-700 text-sm md:text-base leading-relaxed px-6 font-light">
                      {article.excerpt}
                    </p>
                  </div>

                  {/* Article Metadata */}
                  <div className="space-y-3 pt-2">
                    <div className="text-xs text-gray-600 tracking-wide">
                      <span className="font-medium">{article.date}</span>
                    </div>
                    
                    {/* Categories/Tags */}
                    <div className="flex flex-wrap justify-center gap-1 text-xs text-gray-600 uppercase tracking-wider">
                      <span>DATA COLONIALISM</span>
                      <span>•</span>
                      <span>ECONOMIC INDEPENDENCE</span>
                      <span>•</span>
                      <span>GLOBAL TRADE</span>
                    </div>
                  </div>
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
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full text-gray-400 hover:text-red-700 hover:bg-red-50 transition-all duration-300"
        onClick={prevSlide}
        aria-label="Previous article"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full text-gray-400 hover:text-red-700 hover:bg-red-50 transition-all duration-300"
        onClick={nextSlide}
        aria-label="Next article"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Pagination Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-3">
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
      </div>

      {/* Progress Bar */}
      {/* <div className="absolute bottom-0 left-0 w-full px-10 h-0.5 z-30">
        <div 
          className="h-full bg-red-700 transition-all duration-300 ease-out"
        />
      </div> */}
    </div>
  )
}