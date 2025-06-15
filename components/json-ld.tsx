import { siteConfig } from "@/lib/metadata"

interface JsonLdProps {
  data: Record<string, any>
}

export function JsonLd({ data }: JsonLdProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}

export function generateArticleJsonLd(article: any) {
  return {
    "@context": "https://schema.org",
    "@type": article.type === "journal" ? "ScholarlyArticle" : "BlogPosting",
    headline: article.title,
    image: article.image || `${siteConfig.url}/og-image.jpg`,
    datePublished: article.date,
    dateModified: article.updatedAt || article.date,
    author: {
      "@type": "Person",
      name: article.author,
      url: `${siteConfig.url}/authors/${article.authorSlug}`,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/logo.png`,
      },
    },
    description: article.excerpt || `${article.title} by ${article.author}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/${article.type === "journal" ? "journals" : "blogs"}/${article.slug}`,
    },
    ...(article.doi && {
      sameAs: `https://doi.org/${article.doi}`,
    }),
  }
}

export function generateAuthorJsonLd(author: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    jobTitle: author.title,
    description: author.bio,
    image: author.image || `${siteConfig.url}/placeholder-author.jpg`,
    url: `${siteConfig.url}/authors/${author.slug}`,
    ...(author.socialLinks?.twitter && {
      sameAs: [author.socialLinks.twitter],
    }),
    ...(author.socialLinks?.linkedin && {
      sameAs: [...(author.socialLinks?.twitter ? [author.socialLinks.twitter] : []), author.socialLinks.linkedin],
    }),
  }
}

export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    sameAs: [siteConfig.links.twitter, siteConfig.links.github],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-123-456-7890", // Replace with actual contact number
      contactType: "customer service",
      email: "contact@legalinsight.org", // Replace with actual contact email
      availableLanguage: "English",
    },
  }
}

export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
