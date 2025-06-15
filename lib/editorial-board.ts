import type { EditorialBoardMember } from "./types"

// Static data for editorial board members
export const editorialBoardMembers: EditorialBoardMember[] = [
  {
    id: "1",
    name: "Prof. Eleanor Blackwood",
    designation: "Editor-in-Chief",
    image: "/placeholder.svg?height=400&width=400",
    order: 1,
    bio: "Professor of Constitutional Law at Yale Law School with over 25 years of experience in legal scholarship.",
    email: "eblackwood@legalinsight.com",
    linkedin: "https://www.linkedin.com/in/eleanor-blackwood",
    orcid: "0000-0002-1825-0097",
    detailedBio:
      "Professor Eleanor Blackwood is a leading scholar in constitutional law with a focus on separation of powers and federalism. She has authored three books and over 50 articles in top law reviews. Before joining Yale Law School, she served as a law clerk to Justice Ruth Bader Ginsburg and worked in the Office of Legal Counsel at the Department of Justice.",
    expertise: ["Constitutional Law", "Federalism", "Judicial Politics"],
    education: [
      "J.D., Harvard Law School",
      "Ph.D. in Political Science, Princeton University",
      "B.A. in Government, Cornell University",
    ],
    achievements: [
      "American Law Institute, Elected Member",
      "Federalist Society, Academic Advisor",
      "American Constitution Society, Board Member",
    ],
    publications: [
      "The Evolution of Executive Power in the 21st Century (Harvard University Press, 2022)",
      "Judicial Independence Under Threat: Comparative Perspectives (Yale Law Journal, 2021)",
      "Rethinking Federalism in an Age of Polarization (Columbia Law Review, 2020)",
    ],
  },
  {
    id: "2",
    name: "Dr. Marcus Reynolds",
    designation: "Managing Editor",
    image: "/placeholder.svg?height=400&width=400",
    order: 2,
    bio: "Former clerk to Supreme Court Justice and specialist in judicial politics and constitutional interpretation.",
    email: "mreynolds@legalinsight.com",
    linkedin: "https://www.linkedin.com/in/marcus-reynolds",
    orcid: "0000-0002-1825-0098",
    detailedBio:
      "Dr. Marcus Reynolds brings a wealth of practical and academic experience to his role as Managing Editor. After clerking for Justice Elena Kagan, he joined the faculty at Georgetown Law where he teaches courses on constitutional interpretation and judicial decision-making. His research examines how judges approach constitutional questions and the influence of political factors on judicial outcomes.",
    expertise: ["Judicial Politics", "Constitutional Interpretation", "Supreme Court"],
    education: [
      "J.D., Yale Law School",
      "Ph.D. in Political Science, University of Chicago",
      "B.A. in Philosophy, Williams College",
    ],
  },
  {
    id: "3",
    name: "Prof. Sophia Chen",
    designation: "Senior Editor, Constitutional Law",
    image: "/placeholder.svg?height=400&width=400",
    order: 3,
    bio: "Award-winning scholar focusing on comparative constitutional law and democratic theory.",
    email: "schen@legalinsight.com",
    linkedin: "https://www.linkedin.com/in/sophia-chen",
    orcid: "0000-0002-1825-0099",
    expertise: ["Comparative Constitutional Law", "Democratic Theory", "Asian Legal Systems"],
    education: ["J.S.D., Stanford Law School", "LL.M., Harvard Law School", "LL.B., Peking University"],
  },
  {
    id: "4",
    name: "Judge Robert Harrington",
    designation: "Senior Editor, Judicial Affairs",
    image: "/placeholder.svg?height=400&width=400",
    order: 4,
    bio: "Retired federal judge with extensive experience in complex constitutional litigation.",
    email: "rharrington@legalinsight.com",
    linkedin: "https://www.linkedin.com/in/robert-harrington",
    orcid: "0000-0002-1825-0100",
    expertise: ["Judicial Administration", "Constitutional Litigation", "Federal Courts"],
    education: ["J.D., University of Michigan Law School", "B.A. in History, Dartmouth College"],
  },
  {
    id: "5",
    name: "Dr. Amara Washington",
    designation: "Senior Editor, Legal History",
    image: "/placeholder.svg?height=400&width=400",
    order: 5,
    bio: "Legal historian specializing in the development of constitutional doctrine in the 20th century.",
    email: "awashington@legalinsight.com",
    linkedin: "https://www.linkedin.com/in/amara-washington",
    orcid: "0000-0002-1825-0101",
    expertise: ["Legal History", "Civil Rights Law", "Constitutional Development"],
    education: [
      "Ph.D. in History, Columbia University",
      "J.D., New York University School of Law",
      "B.A. in African American Studies, Howard University",
    ],
  },
  {
    id: "6",
    name: "Prof. James Okafor",
    designation: "Senior Editor, International Law",
    image: "/placeholder.svg?height=400&width=400",
    order: 6,
    bio: "Expert in international human rights law and its intersection with domestic constitutional protections.",
    email: "jokafor@legalinsight.com",
    linkedin: "https://www.linkedin.com/in/james-okafor",
    orcid: "0000-0002-1825-0102",
    expertise: ["International Human Rights", "Comparative Constitutional Law", "African Legal Systems"],
    education: ["S.J.D., Harvard Law School", "LL.M., University of London", "LL.B., University of Lagos"],
  },
  {
    id: "7",
    name: "Dr. Leila Patel",
    designation: "Associate Editor",
    image: "/placeholder.svg?height=400&width=400",
    order: 7,
    bio: "Specialist in administrative law and regulatory policy with a focus on environmental regulations.",
    email: "lpatel@legalinsight.com",
    linkedin: "https://www.linkedin.com/in/leila-patel",
    orcid: "0000-0002-1825-0103",
    expertise: ["Administrative Law", "Environmental Law", "Regulatory Policy"],
    education: [
      "J.D., University of California, Berkeley",
      "Ph.D. in Public Policy, Princeton University",
      "B.S. in Environmental Science, MIT",
    ],
  },
  {
    id: "8",
    name: "Prof. Thomas Grayson",
    designation: "Associate Editor",
    image: "/placeholder.svg?height=400&width=400",
    order: 8,
    bio: "Scholar of federalism and state constitutional law with particular interest in local government authority.",
    email: "tgrayson@legalinsight.com",
    linkedin: "https://www.linkedin.com/in/thomas-grayson",
    orcid: "0000-0002-1825-0104",
    expertise: ["State Constitutional Law", "Federalism", "Local Government Law"],
    education: [
      "J.D., University of Virginia School of Law",
      "Ph.D. in Political Science, Duke University",
      "B.A. in Public Policy, University of North Carolina",
    ],
  },
]

// Functions to get editorial board members (now using static data)
export function getEditorialBoardMembers() {
  return editorialBoardMembers
}

export function getEditorialBoardMemberById(id: string) {
  return editorialBoardMembers.find((member) => member.id === id) || null
}
