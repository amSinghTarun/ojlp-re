// components/admin/journal-articles-table.tsx - Updated for journal articles without content/image
"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowUpDown,
  Calendar,
  Clock,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  User,
  Users,
  BookOpen,
  Archive,
  Star,
  Search,
  Filter,
  X,
  ExternalLink,
  Link as LinkIcon,
  Globe,
} from "lucide-react"
import { deleteJournalArticle } from "@/lib/actions/journal-article-actions"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Updated interface for journal articles (no content/image)
interface JournalArticle {
  id: string
  slug: string
  title: string
  abstract?: string
  contentLink?: string
  publishedAt?: string
  readTime: number
  archived: boolean
  featured: boolean
  carousel: boolean
  views: number
  keywords: string[]
  Authors?: Array<{
    id: string
    name: string
    email: string
  }> | null
  Author?: {
    id: string
    name: string
    email: string
  } | null
  journalIssue?: {
    id: string
    volume: number
    issue: number
    year: number
    theme?: string
  } | null
  JournalIssue?: {
    id: string
    volume: number
    issue: number
    year: number
    theme?: string
  } | null
}

interface JournalArticlesTableProps {
  articles: JournalArticle[]
  currentUser?: any
  canCreate?: boolean
}

type FilterType = 'all' | 'featured' | 'carousel' | 'archived' | 'published' | 'with-links' | 'no-links'
type SortField = 'title' | 'publishedAt' | 'views' | 'readTime'
type SortOrder = 'asc' | 'desc'

export function JournalArticlesTable({ articles, currentUser, canCreate }: JournalArticlesTableProps) {
  const [data, setData] = useState<JournalArticle[]>(articles)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortField, setSortField] = useState<SortField>('publishedAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleDelete = async (slug: string) => {
    const result = await deleteJournalArticle(slug)

    if (result.success) {
      setData(currentData => currentData.filter(article => article.slug !== slug))
      toast({
        title: "✅ Article Deleted",
        description: "The journal article reference has been deleted successfully.",
      })
    } else {
      toast({
        title: "❌ Error",
        description: result.error || "Failed to delete article",
        variant: "destructive",
      })
    }
  }

  // Filter and sort data
  const filteredAndSortedData = data
    .filter(article => {
      // Search filter
      const matchesSearch = searchTerm === "" || 
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (article.abstract || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        article.Authors?.some(author => 
          author.name.toLowerCase().includes(searchTerm.toLowerCase())
        )

      // Type filter
      let matchesFilter = true
      switch (filter) {
        case 'featured':
          matchesFilter = article.featured
          break
        case 'carousel':
          matchesFilter = article.carousel
          break
        case 'archived':
          matchesFilter = article.archived
          break
        case 'published':
          matchesFilter = !article.archived
          break
        case 'with-links':
          matchesFilter = !!article.contentLink
          break
        case 'no-links':
          matchesFilter = !article.contentLink
          break
        default:
          matchesFilter = true
      }

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'publishedAt':
          aValue = new Date(a.publishedAt || 0).getTime()
          bValue = new Date(b.publishedAt || 0).getTime()
          break
        case 'views':
          aValue = a.views || 0
          bValue = b.views || 0
          break
        case 'readTime':
          aValue = a.readTime || 0
          bValue = b.readTime || 0
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const getAuthorDisplay = (article: JournalArticle) => {
    const authors = article.Authors || (article.Author ? [article.Author] : [])
    if (authors.length === 0) return "No Author"
    if (authors.length === 1) return authors[0].name
    return `${authors[0].name} +${authors.length - 1} more`
  }

  const getStatusBadges = (article: JournalArticle) => {
    const badges = []
    
    // Status badge
    badges.push(
      <Badge key="status" variant={article.archived ? "secondary" : "default"} className="text-xs">
        {article.archived ? "Archived" : "Published"}
      </Badge>
    )

    // Featured badge
    if (article.featured) {
      badges.push(
        <Badge key="featured" variant="outline" className="text-xs text-yellow-600 border-yellow-300">
          <Star className="h-3 w-3 mr-1" />
          Featured
        </Badge>
      )
    }

    // Carousel badge
    if (article.carousel) {
      badges.push(
        <Badge key="carousel" variant="outline" className="text-xs text-blue-600 border-blue-300">
          <Globe className="h-3 w-3 mr-1" />
          Carousel
        </Badge>
      )
    }

    // Content link badge
    if (article.contentLink) {
      badges.push(
        <Badge key="link" variant="outline" className="text-xs text-green-600 border-green-300">
          <ExternalLink className="h-3 w-3 mr-1" />
          External
        </Badge>
      )
    }

    return badges
  }

  const formatDate = (dateValue?: string) => {
    if (!dateValue) return "No date"
    return new Date(dateValue).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  const getDomainFromUrl = (url?: string) => {
    if (!url) return null
    try {
      const domain = new URL(url).hostname
      return domain.replace('www.', '')
    } catch {
      return null
    }
  }

  const filterCounts = {
    all: data.length,
    featured: data.filter(a => a.featured).length,
    carousel: data.filter(a => a.carousel).length,
    archived: data.filter(a => a.archived).length,
    published: data.filter(a => !a.archived).length,
    'with-links': data.filter(a => !!a.contentLink).length,
    'no-links': data.filter(a => !a.contentLink).length,
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <LinkIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No journal articles found</h3>
          <p className="text-muted-foreground mb-4 text-center">
            {canCreate 
              ? "Get started by creating your first journal article reference."
              : "No journal article references have been created yet."
            }
          </p>
          {canCreate && (
            <Button asChild>
              <Link href="/admin/journal-articles/new">
                Create First Article
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Search Journal Articles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles, authors, keywords, or abstracts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {(Object.entries(filterCounts) as [FilterType, number][]).map(([filterType, count]) => (
              <Button
                key={filterType}
                variant={filter === filterType ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterType)}
                className="flex items-center gap-2"
              >
                {filterType === 'featured' && <Star className="h-3 w-3" />}
                {filterType === 'carousel' && <Globe className="h-3 w-3" />}
                {filterType === 'archived' && <Archive className="h-3 w-3" />}
                {filterType === 'published' && <Eye className="h-3 w-3" />}
                {filterType === 'with-links' && <ExternalLink className="h-3 w-3" />}
                {filterType === 'no-links' && <LinkIcon className="h-3 w-3" />}
                {filterType === 'all' && <Filter className="h-3 w-3" />}
                {filterType === 'with-links' ? 'With Links' : 
                 filterType === 'no-links' ? 'No Links' :
                 filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                <Badge variant="secondary" className="text-xs">
                  {count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Results Summary */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredAndSortedData.length} of {data.length} journal articles
            {searchTerm && ` matching "${searchTerm}"`}
            {filter !== 'all' && ` filtered by ${filter.replace('-', ' ')}`}
          </div>
        </CardContent>
      </Card>

      {/* Updated Table (no image column) */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('title')} className="h-auto p-0 font-semibold">
                    Article Details
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Authors</TableHead>
                <TableHead>External Link</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('publishedAt')} className="h-auto p-0 font-semibold">
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('views')} className="h-auto p-0 font-semibold">
                    Stats
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((article) => {
                const authors = article.Authors || (article.Author ? [article.Author] : [])
                const issue = article.journalIssue || article.JournalIssue
                const dateValue = article.publishedAt
                const domain = getDomainFromUrl(article.contentLink)

                return (
                  <TableRow key={article.id}>
                    {/* Article Details (no image) */}
                    <TableCell className="max-w-[350px]">
                      <div className="space-y-2">
                        <div className="font-medium line-clamp-2">{article.title}</div>
                        {article.abstract && (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {article.abstract}
                          </div>
                        )}
                        {article.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {article.keywords.slice(0, 3).map((keyword, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {article.keywords.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{article.keywords.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {getStatusBadges(article)}
                        </div>
                      </div>
                    </TableCell>

                    {/* Authors */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {authors.length === 1 ? (
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : authors.length > 1 ? (
                          <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : null}
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {getAuthorDisplay(article)}
                          </div>
                          {authors.length > 0 && (
                            <div className="text-xs text-muted-foreground truncate">
                              {authors[0].email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* External Link */}
                    <TableCell>
                      {article.contentLink ? (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <a 
                              href={article.contentLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline truncate block"
                            >
                              {domain || 'External Link'}
                            </a>
                            <div className="text-xs text-muted-foreground">
                              Click to view full article
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm text-muted-foreground">
                            No external link
                          </div>
                        </div>
                      )}
                    </TableCell>

                    {/* Issue */}
                    <TableCell>
                      {issue ? (
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <Badge variant="outline" className="text-xs">
                              Vol. {issue.volume}, No. {issue.issue}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {issue.year}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Not assigned</div>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="text-sm">
                          {formatDate(dateValue)}
                        </div>
                      </div>
                    </TableCell>

                    {/* Stats */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          <span>{article.views || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{article.readTime}m</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/journal-articles/${article.slug}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Reference
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/journals/${article.slug}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {article.contentLink && (
                            <DropdownMenuItem asChild>
                              <a href={article.contentLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Full Article
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Reference
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the journal article reference
                                  &quot;{article.title}&quot; and remove all its data from our servers.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(article.slug)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Reference
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Info */}
      <div className="text-sm text-muted-foreground text-center">
        Displaying {filteredAndSortedData.length} journal article{filteredAndSortedData.length !== 1 ? ' references' : ' reference'}
      </div>
    </div>
  )
}