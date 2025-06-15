import type { Metadata } from "next"

// Base metadata that will be used across the site
export const siteConfig = {
  name: "Open Journal of Law & Policy",
  description: "Expert analysis and commentary on legal developments, constitutional law, and judicial decisions.",
  url: "https://ojlp.org", // Replace with your actual domain
  ogImage: "https://ojlp.org/og-image.jpg", // Replace with your actual OG image
  links: {
    twitter: "https://twitter.com/ojlp",
    github: "https://github.com/ojlp",
  },
}

// Helper function to construct metadata for each page
export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  icons = "/favicon.ico",
  noIndex = false,
  pathname = "",
}: {
  title?: string
  description?: string
  image?: string
  icons?: string
  noIndex?: boolean
  pathname?: string
}): Metadata {
  const url = `${siteConfig.url}${pathname}`

  return {
    title: {
      default: title,
      template: `%s | ${siteConfig.name}`,
    },
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      url,
      siteName: siteConfig.name,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@ojlp",
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    icons,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: url,
    },
  }
}
