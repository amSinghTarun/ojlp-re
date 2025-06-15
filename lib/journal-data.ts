import type { JournalIssue, Article, JournalVolume } from "./types"
import { articles as baseArticles } from "./data" // Import articles directly

// Add keywords to articles for journal issues
const journalArticles: Article[] = [
  {
    ...baseArticles[0],
    keywords: ["Constitutional Interpretation", "Judicial Review", "Legal Theory"],
    type: "journal",
  },
  {
    ...baseArticles[1],
    keywords: ["Criminal Justice", "Fourth Amendment", "Privacy Law"],
    type: "journal",
  },
  {
    ...baseArticles[2],
    keywords: ["Administrative Law", "Regulatory Policy", "Executive Power"],
    type: "journal",
  },
  {
    ...baseArticles[3],
    keywords: ["Civil Rights", "Equal Protection", "Discrimination Law"],
    type: "journal",
  },
  {
    ...baseArticles[4],
    keywords: ["First Amendment", "Free Speech", "Religious Liberty"],
    type: "journal",
  },
  {
    ...baseArticles[5],
    keywords: ["International Law", "Human Rights", "Comparative Law"],
    type: "journal",
  },
  {
    ...baseArticles[6],
    keywords: ["Environmental Law", "Climate Litigation", "Regulatory Compliance"],
    type: "journal",
  },
  {
    ...baseArticles[7],
    keywords: ["Tax Law", "Fiscal Policy", "Economic Regulation"],
    type: "journal",
  },
  {
    ...baseArticles[8],
    keywords: ["Legal History", "Originalism", "Living Constitution"],
    type: "journal",
  },
  {
    ...baseArticles[9],
    keywords: ["Intellectual Property", "Copyright Law", "Patent Reform"],
    type: "journal",
  },
]

// Static data for journal issues
export const journalIssues: JournalIssue[] = [
  {
    id: "1",
    title: "Constitutional Challenges in the Digital Age",
    description: "Exploring how constitutional principles apply to emerging technologies and digital rights.",
    volume: 15,
    issue: 2,
    year: 2024,
    publishDate: "April 2024",
    coverImage: "/placeholder-1ceqv.png",
    articles: [],
  },
  {
    id: "2",
    title: "Federalism and State Power",
    description: "Examining the evolving relationship between federal and state authority in contemporary governance.",
    volume: 15,
    issue: 1,
    year: 2024,
    publishDate: "January 2024",
    coverImage: "/placeholder-1ceqv.png",
    articles: [],
  },
  {
    id: "3",
    title: "Judicial Independence and Court Reform",
    description:
      "Analyzing proposals for structural changes to the judiciary and their implications for judicial independence.",
    volume: 14,
    issue: 4,
    year: 2023,
    publishDate: "October 2023",
    coverImage: "/placeholder-1ceqv.png",
    articles: [],
  },
  {
    id: "4",
    title: "Constitutional Interpretation Methodologies",
    description: "Examining different approaches to interpreting constitutional text and their implications.",
    volume: 14,
    issue: 3,
    year: 2023,
    publishDate: "July 2023",
    coverImage: "/placeholder-1ceqv.png",
    articles: [],
  },
  {
    id: "5",
    title: "Privacy Rights in the Digital Era",
    description: "Exploring the evolution of privacy protections in response to technological advancements.",
    volume: 14,
    issue: 2,
    year: 2023,
    publishDate: "April 2023",
    coverImage: "/placeholder-1ceqv.png",
    articles: [],
  },
  {
    id: "6",
    title: "Executive Power and Its Limits",
    description: "Analyzing the scope and constraints of executive authority in the constitutional framework.",
    volume: 14,
    issue: 1,
    year: 2023,
    publishDate: "January 2023",
    coverImage: "/placeholder-1ceqv.png",
    articles: [],
  },
  {
    id: "7",
    title: "Federalism in the Modern Age",
    description: "Examining the evolving dynamics of federal-state relations in contemporary governance.",
    volume: 13,
    issue: 4,
    year: 2022,
    publishDate: "October 2022",
    coverImage: "/placeholder-1ceqv.png",
    articles: [],
  },
  {
    id: "8",
    title: "First Amendment Jurisprudence",
    description: "Analyzing recent developments in free speech, religion, and assembly protections.",
    volume: 13,
    issue: 3,
    year: 2022,
    publishDate: "July 2022",
    coverImage: "/placeholder-1ceqv.png",
    articles: [],
  },
  {
    id: "9",
    title: "Equal Protection and Anti-Discrimination Law",
    description: "Exploring the evolution and application of equality principles in constitutional law.",
    volume: 13,
    issue: 2,
    year: 2022,
    publishDate: "April 2022",
    coverImage: "/placeholder-1ceqv.png",
    articles: [],
  },
  {
    id: "10",
    title: "Administrative State and Democratic Accountability",
    description: "Examining the tensions between administrative governance and democratic principles.",
    volume: 13,
    issue: 1,
    year: 2022,
    publishDate: "January 2022",
    coverImage: "/placeholder-1ceqv.png",
    articles: [],
  },
  {
    id: "11",
    title: "International Law and Domestic Courts",
    description: "Analyzing the relationship between international legal norms and domestic judicial systems.",
    volume: 12,
    issue: 4,
    year: 2021,
    publishDate: "October 2021",
    coverImage: "/placeholder-1ceqv.png",
    articles: [],
  },
  {
    id: "12",
    title: "Criminal Justice Reform",
    description: "Exploring constitutional dimensions of efforts to reform criminal justice systems.",
    volume: 12,
    issue: 3,
    year: 2021,
    publishDate: "July 2021",
    coverImage: "/placeholder-1ceqv.png",
    articles: [],
  },
]

// Static data for calls for papers
export const callsForPapers = [
  {
    id: "1",
    title: "Constitutional Law Symposium",
    description: "Seeking papers on emerging trends in constitutional interpretation for our annual symposium.",
    deadline: "August 15, 2024",
    guidelines: "Papers should be 5,000-10,000 words and follow OSCOLA citation style.",
    topics: ["Constitutional Interpretation", "Judicial Review", "Separation of Powers"],
    eligibility: "Open to legal scholars, practitioners, and advanced graduate students.",
    contact: "symposium@legalinsight.com",
    volume: 16,
    issue: 1,
  },
  {
    id: "2",
    title: "Special Issue: Technology and Privacy Law",
    description:
      "Exploring the intersection of technology, privacy, and constitutional protections in the digital age.",
    deadline: "October 30, 2024",
    guidelines: "Submissions should be 6,000-12,000 words with an abstract of 250-300 words.",
    topics: ["Digital Privacy", "Fourth Amendment", "Data Protection", "Surveillance"],
    eligibility: "Open to academics, legal practitioners, and technology policy experts.",
    contact: "privacy@legalinsight.com",
    volume: 16,
    issue: 2,
  },
  {
    id: "3",
    title: "Comparative Constitutional Law",
    description: "Examining constitutional systems across different jurisdictions and legal traditions.",
    deadline: "December 15, 2024",
    guidelines: "Articles should be 8,000-15,000 words and include comparative analysis of at least two jurisdictions.",
    topics: ["Comparative Constitutionalism", "Global Constitutional Trends", "Constitutional Design"],
    eligibility: "Open to scholars with expertise in multiple legal systems.",
    contact: "comparative@legalinsight.com",
    volume: 16,
    issue: 3,
  },
]

// Functions to get journal data (now using static data)
export function getLatestIssue() {
  return journalIssues.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    if (a.volume !== b.volume) return b.volume - a.volume
    return b.issue - a.issue
  })[0]
}

export function getJournalIssues() {
  return journalIssues.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    if (a.volume !== b.volume) return b.volume - a.volume
    return b.issue - a.issue
  })
}

export function getJournalIssueById(id: string) {
  return journalIssues.find((issue) => issue.id === id) || null
}

export function getArticlesByIssue(volume: number, issue: number) {
  // Since our static data doesn't have volume/issue, we'll simulate this
  // by returning a subset of articles based on the volume and issue numbers
  const startIndex = (volume * 10 + issue) % journalArticles.length
  const count = 3 // Return 3 articles per issue

  const result = []
  for (let i = 0; i < count; i++) {
    const index = (startIndex + i) % journalArticles.length
    result.push(journalArticles[index])
  }

  return result
}

export function getCallsForPapers() {
  return callsForPapers.sort((a, b) => {
    // Sort by deadline (assuming deadline is a string in format "Month DD, YYYY")
    const dateA = new Date(a.deadline)
    const dateB = new Date(b.deadline)
    return dateA.getTime() - dateB.getTime()
  })
}

export function getCallForPapersById(id: string) {
  return callsForPapers.find((cfp) => cfp.id === id) || null
}

// New function to get journal volumes
export function getJournalVolumes(): JournalVolume[] {
  // Group issues by volume
  const volumeMap = new Map<number, JournalIssue[]>()

  journalIssues.forEach((issue) => {
    if (!volumeMap.has(issue.volume)) {
      volumeMap.set(issue.volume, [])
    }
    const issues = volumeMap.get(issue.volume)
    if (issues) {
      issues.push(issue)
    }
  })

  // Convert to array of volume objects
  const volumes: JournalVolume[] = []

  volumeMap.forEach((issues, volumeNumber) => {
    // Sort issues by issue number
    const sortedIssues = issues.sort((a, b) => a.issue - b.issue)

    // Get the year from the latest issue in the volume
    const year = sortedIssues[0].year

    // Create a title based on the first issue's title or a default
    const firstIssue = sortedIssues[0]
    const title = firstIssue.title.split(":")[0] || `Volume ${volumeNumber} (${year})`

    volumes.push({
      id: `vol-${volumeNumber}`,
      number: volumeNumber,
      title,
      year,
      issueCount: issues.length,
      issues: sortedIssues,
    })
  })

  // Sort volumes by number (descending)
  return volumes.sort((a, b) => b.number - a.number)
}

// Function to get a specific volume by number
export function getVolumeByNumber(volumeNumber: number): JournalVolume | null {
  const volumes = getJournalVolumes()
  return volumes.find((vol) => vol.number === volumeNumber) || null
}
