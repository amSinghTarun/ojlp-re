import type { Author } from "./types"

// Static data for authors
export const authors: Author[] = [
  {
    slug: "prof-sarah-johnson",
    name: "Prof. Sarah Johnson",
    email: "sjohnson@law.harvard.edu",
    title: "Constitutional Law Professor",
    bio: "Sarah Johnson is a distinguished professor of Constitutional Law at Harvard Law School. Her research focuses on Fourth Amendment jurisprudence and digital privacy rights. She has authored three books and numerous articles on constitutional interpretation in the digital age.",
    image: "/placeholder.svg?height=400&width=400",
    expertise: ["Constitutional Law", "Fourth Amendment", "Digital Privacy", "Supreme Court"],
    education: ["J.D., Yale Law School", "Ph.D. in Legal History, Columbia University"],
    socialLinks: {
      twitter: "https://twitter.com/sarahjohnson",
      linkedin: "https://linkedin.com/in/sarahjohnson",
      email: "sjohnson@law.harvard.edu",
    },
    userId: "user_1",
  },
  {
    slug: "dr-michael-chen",
    name: "Dr. Michael Chen",
    email: "mchen@stanford.edu",
    title: "Legal Philosopher",
    bio: "Michael Chen is a legal philosopher and scholar specializing in constitutional interpretation. His work examines the philosophical underpinnings of different approaches to constitutional interpretation, with a particular focus on originalism and living constitutionalism.",
    image: "/placeholder.svg?height=400&width=400",
    expertise: ["Legal Philosophy", "Constitutional Interpretation", "Originalism", "Living Constitutionalism"],
    education: ["J.D., Stanford Law School", "Ph.D. in Philosophy, Princeton University"],
    socialLinks: {
      twitter: "https://twitter.com/michaelchen",
      linkedin: "https://linkedin.com/in/michaelchen",
      email: "mchen@stanford.edu",
    },
    userId: "user_2",
  },
  {
    slug: "prof-james-wilson",
    name: "Prof. James Wilson",
    email: "jwilson@georgetown.edu",
    title: "Federalism Scholar",
    bio: "James Wilson is a leading expert on federalism and the balance of power between state and federal governments. His research examines how federalism principles adapt to contemporary challenges including climate change, healthcare policy, and technological innovation.",
    image: "/placeholder.svg?height=400&width=400",
    expertise: ["Federalism", "State and Federal Powers", "Administrative Law", "Environmental Law"],
    education: ["J.D., University of Chicago Law School", "M.P.P., Harvard Kennedy School"],
    socialLinks: {
      twitter: "https://twitter.com/jameswilson",
      linkedin: "https://linkedin.com/in/jameswilson",
      email: "jwilson@georgetown.edu",
    },
    userId: "user_3",
  },
  {
    slug: "lisa-montgomery",
    name: "Lisa Montgomery",
    email: "lmontgomery@brennancenter.org",
    title: "Judicial Independence Researcher",
    bio: "Lisa Montgomery is a researcher and advocate focused on judicial independence and court reform. She previously served as a law clerk to Justice Sonia Sotomayor and has written extensively on threats to judicial independence both domestically and internationally.",
    image: "/placeholder.svg?height=400&width=400",
    expertise: ["Judicial Independence", "Court Reform", "Comparative Constitutional Law"],
    education: ["J.D., NYU School of Law", "B.A. in Political Science, Amherst College"],
    socialLinks: {
      twitter: "https://twitter.com/lisamontgomery",
      linkedin: "https://linkedin.com/in/lisamontgomery",
      email: "lmontgomery@brennancenter.org",
    },
    userId: "user_4",
  },
  {
    slug: "dr-rebecca-torres",
    name: "Dr. Rebecca Torres",
    email: "rtorres@law.berkeley.edu",
    title: "First Amendment Scholar",
    bio: "Rebecca Torres specializes in First Amendment law with a focus on free speech in digital contexts. Her research examines how traditional First Amendment doctrines apply to emerging technologies including social media platforms, artificial intelligence, and virtual reality.",
    image: "/placeholder.svg?height=400&width=400",
    expertise: ["First Amendment", "Free Speech", "Technology Law", "Media Law"],
    education: ["J.D., UC Berkeley School of Law", "Ph.D. in Communication, University of Pennsylvania"],
    socialLinks: {
      twitter: "https://twitter.com/rebeccatorres",
      linkedin: "https://linkedin.com/in/rebeccatorres",
      email: "rtorres@law.berkeley.edu",
    },
    userId: "user_5",
  },
  {
    slug: "prof-elena-rodriguez",
    name: "Prof. Elena Rodriguez",
    email: "erodriguez@ucla.edu",
    title: "Immigration Law Expert",
    bio: "Elena Rodriguez is a professor of immigration law and constitutional rights. Her scholarship focuses on the constitutional rights of non-citizens and the legal frameworks governing immigration enforcement, asylum, and citizenship.",
    image: "/placeholder.svg?height=400&width=400",
    expertise: ["Immigration Law", "Constitutional Rights", "Citizenship", "International Human Rights"],
    education: ["J.D., Harvard Law School", "LL.M. in International Law, Georgetown University"],
    socialLinks: {
      twitter: "https://twitter.com/elenarodriguez",
      linkedin: "https://linkedin.com/in/elenarodriguez",
      email: "erodriguez@ucla.edu",
    },
    userId: "user_6",
  },
]

// Functions to get authors (now using static data)
export function getAuthors() {
  return authors
}

export function getAuthorBySlug(slug: string) {
  return authors.find((author) => author.slug === slug) || null
}

export function getAuthorByEmail(email: string) {
  return authors.find((author) => author.email === email) || null
}
