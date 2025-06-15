import type { BoardAdvisor } from "./types"

// Static data for board advisors
export const boardAdvisors: BoardAdvisor[] = [
  {
    id: "1",
    name: "Judge Eleanor Simmons",
    designation: "Chair, Board of Advisors",
    image: "/female-judge-headshot.png",
    order: 1,
    bio: "Judge Eleanor Simmons served on the Federal Court of Appeals for 25 years before retiring in 2020. She brings extensive judicial experience and a commitment to legal education.",
    email: "eleanor.simmons@example.com",
    expertise: ["Constitutional Law", "Judicial Ethics", "Legal Education"],
    linkedin: "https://linkedin.com/in/eleanor-simmons",
    orcid: "0000-0002-1825-0097",
  },
  {
    id: "2",
    name: "Professor Richard Chen",
    designation: "Academic Advisor",
    image: "/placeholder.svg?key=33lgd",
    order: 2,
    bio: "Dr. Richard Chen is a distinguished professor of Constitutional Law at Harvard Law School with over 100 published articles in leading law journals.",
    email: "richard.chen@example.com",
    expertise: ["Constitutional Theory", "Comparative Law", "Legal Philosophy"],
    linkedin: "https://linkedin.com/in/richard-chen",
    orcid: "0000-0002-1825-0098",
  },
  {
    id: "3",
    name: "Maria Rodriguez",
    designation: "Public Policy Advisor",
    image: "/latina-woman-headshot.png",
    order: 3,
    bio: "Maria Rodriguez has served as legal counsel to three presidential administrations and specializes in the intersection of law and public policy.",
    email: "maria.rodriguez@example.com",
    expertise: ["Public Policy", "Administrative Law", "Government Relations"],
    linkedin: "https://linkedin.com/in/maria-rodriguez",
    orcid: "0000-0002-1825-0099",
  },
  {
    id: "4",
    name: "Dr. James Washington",
    designation: "Ethics Advisor",
    image: "/black-male-professor-headshot.png",
    order: 4,
    bio: "Dr. Washington is the director of the Center for Legal Ethics and has authored several influential books on professional responsibility in legal practice.",
    email: "james.washington@example.com",
    expertise: ["Legal Ethics", "Professional Responsibility", "Legal Education"],
    linkedin: "https://linkedin.com/in/james-washington",
    orcid: "0000-0002-1825-0100",
  },
  {
    id: "5",
    name: "Sarah Goldstein",
    designation: "International Law Advisor",
    image: "/female-lawyer-headshot.png",
    order: 5,
    bio: "Sarah Goldstein has extensive experience in international law, having served as legal counsel to the United Nations and various international tribunals.",
    email: "sarah.goldstein@example.com",
    expertise: ["International Law", "Human Rights", "Diplomatic Relations"],
    linkedin: "https://linkedin.com/in/sarah-goldstein",
    orcid: "0000-0002-1825-0101",
  },
]

// Functions to get board advisors (now using static data)
export function getBoardAdvisors() {
  return boardAdvisors
}

export function getBoardAdvisorById(id: string) {
  return boardAdvisors.find((advisor) => advisor.id === id) || null
}
