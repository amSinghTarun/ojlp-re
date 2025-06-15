import type { Notification } from "./types"

// Static data for notifications
export const notifications: Notification[] = [
  {
    id: "1",
    title: "Call for Papers: Constitutional Law Symposium",
    content:
      "Submit your papers for our upcoming symposium on emerging trends in constitutional interpretation. Deadline is August 15, 2024.",
    date: "June 5, 2024",
    type: "call-for-papers",
    priority: "high",
    read: false,
    link: "/call-for-papers/constitutional-law-symposium",
    expiresAt: "August 15, 2024",
  },
  {
    id: "2",
    title: "Annual Legal Conference 2024",
    content:
      "Join us for the Annual Legal Conference on September 20-22, 2024 at Harvard Law School. Early bird registration ends July 31.",
    date: "May 28, 2024",
    type: "event",
    priority: "medium",
    read: false,
    link: "/events/annual-legal-conference-2024",
    image: "/legal-conference.png",
  },
  {
    id: "3",
    title: "Special Issue: Technology and Privacy Law",
    content:
      "Our special issue on Technology and Privacy Law has been published. Featuring articles from leading scholars in the field.",
    date: "May 15, 2024",
    type: "special-issue",
    priority: "medium",
    read: true,
    link: "/journals/special-issue-technology-privacy-law",
  },
  {
    id: "4",
    title: "Editorial Vacancy: Associate Editor for Constitutional Law",
    content: "We are seeking an Associate Editor specializing in Constitutional Law to join our editorial board.",
    date: "May 10, 2024",
    type: "editorial-vacancy",
    priority: "high",
    read: false,
    link: "/editorial-board/vacancies",
  },
  {
    id: "5",
    title: "Workshop: Legal Writing for Scholars",
    content: "Improve your legal writing skills with our upcoming virtual workshop led by Professor James Wilson.",
    date: "May 5, 2024",
    type: "event",
    priority: "medium",
    read: false,
    link: "/events/legal-writing-workshop",
    expiresAt: "July 1, 2024",
  },
  {
    id: "6",
    title: "Student Paper Competition Results Announced",
    content: "Congratulations to the winners of our 2024 Student Paper Competition on Human Rights Law.",
    date: "April 28, 2024",
    type: "student-competition",
    priority: "medium",
    read: false,
    link: "/student-competitions/2024-results",
  },
  {
    id: "7",
    title: "Special Symposium: Federalism in the 21st Century",
    content: "Join us for a special symposium exploring the evolving nature of federalism in modern governance.",
    date: "April 20, 2024",
    type: "special-issue",
    priority: "high",
    read: false,
    link: "/symposia/federalism-21st-century",
    image: "/federalism-symposium.png",
  },
  {
    id: "8",
    title: "Call for Papers: Environmental Law Review",
    content: "Submit your research on climate litigation and regulatory frameworks for our Environmental Law Review.",
    date: "April 15, 2024",
    type: "call-for-papers",
    priority: "medium",
    read: true,
    link: "/call-for-papers/environmental-law-review",
    expiresAt: "July 31, 2024",
  },
  {
    id: "9",
    title: "Editorial Vacancy: Senior Editor for International Law",
    content: "We are looking for a Senior Editor with expertise in International Law to join our editorial team.",
    date: "April 10, 2024",
    type: "editorial-vacancy",
    priority: "medium",
    read: true,
    link: "/editorial-board/vacancies",
  },
  {
    id: "10",
    title: "Student Paper Competition: Legal Ethics",
    content:
      "Announcing our new student paper competition on Legal Ethics in the Digital Age. Submissions due by September 30.",
    date: "April 5, 2024",
    type: "student-competition",
    priority: "high",
    read: false,
    link: "/student-competitions/legal-ethics",
    expiresAt: "September 30, 2024",
  },
]

// Functions to get notifications (now using static data)
export function getNotifications() {
  return notifications.filter((notification) => {
    if (notification.expiresAt) {
      const expiryDate = new Date(notification.expiresAt)
      return expiryDate > new Date()
    }
    return true
  })
}

export function getNotificationById(id: string) {
  return notifications.find((notification) => notification.id === id) || null
}

export function markNotificationAsRead(id: string) {
  const notification = notifications.find((n) => n.id === id)
  if (notification) {
    notification.read = true
  }
  return notification
}
