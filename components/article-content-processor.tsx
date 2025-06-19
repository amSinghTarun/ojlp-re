"use client"

import Image from "next/image"

interface ArticleContentProcessorProps {
  content: string
  images: string[]
  className?: string
}

export function ArticleContentProcessor({ content, images, className = "" }: ArticleContentProcessorProps) {
  // Function to process content and replace image placeholders
  const processContent = (text: string) => {
    // Split content by paragraphs
    const paragraphs = text.split('\n\n')
    
    return paragraphs.map((paragraph, index) => {
      // Check if this paragraph is an image placeholder
      const imageMatch = paragraph.trim().match(/^\[image:(\d+)\]$/)
      
      if (imageMatch) {
        const imageIndex = parseInt(imageMatch[1])
        const imageUrl = images[imageIndex]
        
        if (imageUrl) {
          return (
            <div key={`image-${index}`} className="my-6">
              <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={`Article image ${imageIndex + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                />
              </div>
            </div>
          )
        } else {
          // Image not found, show placeholder
          return (
            <div key={`placeholder-${index}`} className="my-6 p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
              <p>Image {imageIndex + 1} not found</p>
            </div>
          )
        }
      }
      
      // Check if this paragraph is a direct URL image placeholder
      const urlImageMatch = paragraph.trim().match(/^\[image:(https?:\/\/[^\]]+)\]$/)
      
      if (urlImageMatch) {
        const imageUrl = urlImageMatch[1]
        
        return (
          <div key={`url-image-${index}`} className="my-6">
            <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
              <Image
                src={imageUrl}
                alt={`Article image`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              />
            </div>
          </div>
        )
      }
      
      // Regular paragraph - split by single newlines for line breaks
      if (paragraph.trim()) {
        const lines = paragraph.split('\n')
        return (
          <p key={`paragraph-${index}`} className="mb-4 leading-relaxed">
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {line}
                {lineIndex < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      }
      
      return null
    }).filter(Boolean)
  }

  return (
    <div className={`prose prose-slate dark:prose-invert max-w-none ${className}`}>
      {processContent(content)}
    </div>
  )
}