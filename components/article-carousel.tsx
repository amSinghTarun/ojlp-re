"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Article } from "@/lib/types"

interface ArticleCarouselProps {
  articles: Article[]
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
    }, 5000)

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
      // Swipe left
      nextSlide()
    }

    if (touchStart - touchEnd < -50) {
      // Swipe right
      prevSlide()
    }
  }

  return (
    <div className="relative w-full overflow-hidden bg-black">
      <div
        className="relative w-full"
        style={{ height: "clamp(300px, 50vh, 700px)" }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {articles.map((article, index) => (
          <div
            key={article.slug}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <div className="absolute inset-0 bg-black/30 z-10" />
            <Image
              src={article.image || "/placeholder.svg?height=800&width=1200&query=law journal article"}
              alt={article.title}
              fill
              className="object-cover"
              priority={index === 0}
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?key=ohzxk"
              }}
            />
            <div className="absolute inset-0 z-20 flex items-end">
              <div className="container mx-auto px-4 pb-8 sm:pb-12 md:pb-16 lg:pb-24">
                <div className="max-w-3xl bg-black/50 p-3 sm:p-6 backdrop-blur-sm rounded-lg">
                  <div className="text-xs text-white/70 mb-1 sm:mb-2">
                    {article.author} • {article.date} • {article.readTime} min read
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 font-serif">
                    {article.title}
                  </h2>
                  <p className="text-white/90 mb-2 sm:mb-4 line-clamp-2 text-sm sm:text-base">{article.excerpt}</p>
                  <Button asChild size="sm" className="transition-all duration-300 hover:scale-105">
                    <Link href="/journals">Read Journal</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/50 border-white/20 text-white hover:bg-black/70 hover:text-white carousel-nav-button w-8 h-8 sm:w-10 sm:h-10"
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/50 border-white/20 text-white hover:bg-black/70 hover:text-white carousel-nav-button w-8 h-8 sm:w-10 sm:h-10"
        onClick={nextSlide}
        aria-label="Next slide"
      >
        <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
      </Button>

      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex space-x-1 sm:space-x-2">
        {articles.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
              index === currentSlide ? "bg-white scale-125" : "bg-white/50"
            }`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
