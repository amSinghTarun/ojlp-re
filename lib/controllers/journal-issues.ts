// lib/controllers/journal-issues.ts - Enhanced for comprehensive archive view
import { prisma } from "@/lib/prisma"

export async function getJournalIssues() {
  return prisma.journalIssue.findMany({
    orderBy: [{ year: "desc" }, { volume: "desc" }, { issue: "desc" }],
    include: {
      Article: {
        where: {
          archived: false // Only include non-archived articles
        },
        include: {
          authors: {
            include: {
              author: true,
            },
            orderBy: {
              authorOrder: 'asc'
            }
          },
        },
      },
      _count: {
        select: {
          Article: {
            where: {
              archived: false
            }
          }
        }
      }
    },
  })
}

export async function getJournalIssueById(id: string) {
  return prisma.journalIssue.findUnique({
    where: { id },
    include: {
      Article: {
        where: {
          archived: false
        },
        include: {
          authors: {
            include: {
              author: true,
            },
            orderBy: {
              authorOrder: 'asc'
            }
          }
        },
        orderBy: {
          publishedAt: 'desc'
        }
      },
      _count: {
        select: {
          Article: {
            where: {
              archived: false
            }
          }
        }
      }
    },
  })
}

export async function getJournalIssueByVolume(volume: number, issue: number, year: number) {
  return prisma.journalIssue.findFirst({
    where: {
      volume,
      issue,
      year,
    },
    include: {
      Article: {
        where: {
          archived: false
        },
        include: {
          authors: {
            include: {
              author: true,
            },
            orderBy: {
              authorOrder: 'asc'
            }
          }
        },
        orderBy: {
          publishedAt: 'desc'
        }
      },
    },
  })
}

export async function getJournalIssueByVolumeAndIssue(volumeNumber: number, issueNumber: number) {
  return prisma.journalIssue.findFirst({
    where: {
      volume: volumeNumber,
      issue: issueNumber,
    },
    include: {
      Article: {
        where: {
          archived: false
        },
        include: {
          authors: {
            include: {
              author: true,
            },
            orderBy: {
              authorOrder: 'asc'
            }
          }
        },
        orderBy: {
          publishedAt: 'desc'
        }
      },
    },
  })
}

export async function createJournalIssue(data: {
  volume: number
  theme?: string
  issue: number
  year: number
  publishDate?: string
}) {
  return prisma.journalIssue.create({
    data,
    include: {
      Article: {
        where: {
          archived: false
        }
      },
      _count: {
        select: {
          Article: {
            where: {
              archived: false
            }
          }
        }
      }
    },
  })
}

export async function updateJournalIssue(
  id: string,
  data: {
    volume?: number
    theme?: string
    issue?: number
    year?: number
    publishDate?: string
  },
) {
  return prisma.journalIssue.update({
    where: { id },
    data,
    include: {
      Article: {
        where: {
          archived: false
        }
      },
      _count: {
        select: {
          Article: {
            where: {
              archived: false
            }
          }
        }
      }
    },
  })
}

export async function deleteJournalIssue(id: string) {
  return prisma.journalIssue.delete({
    where: { id },
  })
}

export async function getLatestIssue() {
  return prisma.journalIssue.findFirst({
    orderBy: [{ year: "desc" }, { volume: "desc" }, { issue: "desc" }],
    include: {
      Article: {
        where: {
          archived: false
        },
        include: {
          authors: {
            include: {
              author: true,
            },
            orderBy: {
              authorOrder: 'asc'
            }
          },
        },
      },
    },
  })
}

export async function getJournalVolumes() {
  // Get all journal issues with their articles
  const issues = await prisma.journalIssue.findMany({
    orderBy: [{ volume: "desc" }, { issue: "asc" }],
    include: {
      Article: {
        where: {
          archived: false
        },
        select: {
          id: true,
          title: true,
          slug: true,
          publishedAt: true,
        }
      },
      _count: {
        select: {
          Article: {
            where: {
              archived: false
            }
          }
        }
      }
    }
  })

  // Group issues by volume
  const volumeMap = new Map()

  issues.forEach((issue) => {
    if (!volumeMap.has(issue.volume)) {
      volumeMap.set(issue.volume, {
        number: issue.volume,
        year: issue.year,
        title: `Volume ${issue.volume}`,
        issueCount: 0,
        articleCount: 0,
        issues: [],
        earliestYear: issue.year,
        latestYear: issue.year,
      })
    }

    const volume = volumeMap.get(issue.volume)
    volume.issues.push(issue)
    volume.issueCount++
    volume.articleCount += issue._count.Article

    // Track year range for the volume
    if (issue.year < volume.earliestYear) {
      volume.earliestYear = issue.year
    }
    if (issue.year > volume.latestYear) {
      volume.latestYear = issue.year
    }
    
    // Use the latest year as the primary year for the volume
    volume.year = volume.latestYear
  })

  // Convert map to array and sort by volume number (descending)
  return Array.from(volumeMap.values())
    .map((volume) => ({
      ...volume,
      id: `vol-${volume.number}`,
      // Add year range if they differ
      yearRange: volume.earliestYear !== volume.latestYear 
        ? `${volume.earliestYear}-${volume.latestYear}`
        : volume.year.toString(),
      // Sort issues within each volume by issue number
      issues: volume.issues.sort((a: any, b: any) => a.issue - b.issue)
    }))
    .sort((a, b) => b.number - a.number)
}

export async function getVolumeByNumber(volumeNumber: number) {
  const issues = await prisma.journalIssue.findMany({
    where: {
      volume: volumeNumber,
    },
    orderBy: {
      issue: "asc",
    },
    include: {
      Article: {
        where: {
          archived: false
        },
        include: {
          authors: {
            include: {
              author: true,
            },
            orderBy: {
              authorOrder: 'asc'
            }
          },
        },
        orderBy: {
          publishedAt: 'desc'
        }
      },
      _count: {
        select: {
          Article: {
            where: {
              archived: false
            }
          }
        }
      }
    },
  })

  if (issues.length === 0) {
    return null
  }

  // Get the year range from all issues in the volume
  const years = issues.map((issue) => issue.year)
  const earliestYear = Math.min(...years)
  const latestYear = Math.max(...years)
  const totalArticles = issues.reduce((sum, issue) => sum + issue._count.Article, 0)

  return {
    id: `vol-${volumeNumber}`,
    number: volumeNumber,
    title: `Volume ${volumeNumber}`,
    year: latestYear,
    yearRange: earliestYear !== latestYear ? `${earliestYear}-${latestYear}` : latestYear.toString(),
    issueCount: issues.length,
    articleCount: totalArticles,
    issues,
  }
}

export async function getArchiveStats() {
  const [volumeCount, issueCount, articleCount] = await Promise.all([
    prisma.journalIssue.findMany({
      select: { volume: true },
      distinct: ['volume']
    }).then(volumes => volumes.length),
    
    prisma.journalIssue.count(),
    
    prisma.article.count({
      where: {
        type: 'journal',
        archived: false
      }
    })
  ])

  return {
    volumes: volumeCount,
    issues: issueCount,
    articles: articleCount
  }
}

export async function searchArchive(query: string) {
  const [issues, articles] = await Promise.all([
    // Search in issue themes
    prisma.journalIssue.findMany({
      where: {
        theme: {
          contains: query,
          mode: 'insensitive'
        }
      },
      include: {
        _count: {
          select: {
            Article: {
              where: { archived: false }
            }
          }
        }
      }
    }),
    
    // Search in articles
    prisma.article.findMany({
      where: {
        AND: [
          { type: 'journal' },
          { archived: false },
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { abstract: { contains: query, mode: 'insensitive' } },
              { keywords: { hasSome: [query] } }
            ]
          }
        ]
      },
      include: {
        authors: {
          include: {
            author: true
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
        JournalIssue: true
      },
      take: 20
    })
  ])

  return {
    issues,
    articles
  }
}