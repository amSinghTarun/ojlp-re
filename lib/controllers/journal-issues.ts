import prisma from "@/lib/prisma"

export async function getJournalIssues() {
  return prisma.journalIssue.findMany({
    orderBy: [{ year: "desc" }, { volume: "desc" }, { issue: "desc" }],
    include: {
      Article: {
        include: {
          authors: {
            include: {
              author: true,
            },
          },
        },
      },
    },
  })
}

export async function getJournalIssueById(id: string) {
  return prisma.journalIssue.findUnique({
    where: { id },
    include: {
      Article: {
        include: {
          authors: {
            include: {
              author: true,
            },
          }
        },
      },
    },
  })
}

export async function getJournalIssueByVolume(volume: number, issue: number) {
  return prisma.journalIssue.findFirst({
    where: {
      volume,
      issue,
    },
    include: {
      Article: {
        include: {
          authors: {
            include: {
              author: true,
            },
          }
        },
      },
    },
  })
}

export async function createJournalIssue(data: {
  title: string
  description?: string
  volume: number
  issue: number
  year: number
  publishDate: string
  coverImage?: string
}) {
  return prisma.journalIssue.create({
    data,
    include: {
      Article: true,
    },
  })
}

export async function updateJournalIssue(
  id: string,
  data: {
    title?: string
    description?: string
    volume?: number
    issue?: number
    year?: number
    publishDate?: string
    coverImage?: string
  },
) {
  return prisma.journalIssue.update({
    where: { id },
    data,
    include: {
      Article: true,
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
        include: {
          authors: {
            include: {
              author: true,
            },
          },
        },
      },
    },
  })
}

export async function getJournalVolumes() {
  // Get all journal issues
  const issues = await prisma.journalIssue.findMany({
    orderBy: [{ volume: "desc" }, { issue: "asc" }],
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
        issues: [],
      })
    }

    const volume = volumeMap.get(issue.volume)
    volume.issues.push(issue)
    volume.issueCount++

    // Use the latest year for the volume
    if (issue.year > volume.year) {
      volume.year = issue.year
    }
  })

  // Convert map to array and sort by volume number (descending)
  return Array.from(volumeMap.values())
    .map((volume) => ({
      ...volume,
      id: `vol-${volume.number}`,
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
        include: {
          authors: {
            include: {
              author: true,
            },
          },
        },
      },
    },
  })

  if (issues.length === 0) {
    return null
  }

  // Get the year from the latest issue in the volume
  const year = Math.max(...issues.map((issue) => issue.year))

  return {
    id: `vol-${volumeNumber}`,
    number: volumeNumber,
    title: `Volume ${volumeNumber}`,
    year,
    issueCount: issues.length,
    issues,
  }
}
