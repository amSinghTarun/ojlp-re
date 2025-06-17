import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getActiveNotifications } from "@/lib/controllers/notifications"
import { getCurrentUser } from "@/lib/auth"
import { NotificationCard } from "@/components/notification-card"
import { NotificationType } from "@prisma/client"

export const revalidate = 3600 // Revalidate every hour

export default async function NotificationsPage() {
  
  // Fetch active notifications from database
  const notifications = await getActiveNotifications()

  // Group notifications by type using database enum values
  const callForPapers = notifications.filter((n) => n.type === NotificationType.call_for_papers)
  const studentCompetitions = notifications.filter((n) => n.type === NotificationType.student_competition)
  const editorialVacancies = notifications.filter((n) => n.type === NotificationType.editorial_vacancy)
  const specialIssues = notifications.filter((n) => n.type === NotificationType.special_issue)
  const events = notifications.filter((n) => n.type === NotificationType.event)
  const announcements = notifications.filter((n) => n.type === NotificationType.announcement)
  const publications = notifications.filter((n) => n.type === NotificationType.publication)
  
  // Other notifications (catch-all for any new types)
  const otherNotifications = notifications.filter(
    (n) => ![
      NotificationType.call_for_papers,
      NotificationType.student_competition,
      NotificationType.editorial_vacancy,
      NotificationType.special_issue,
      NotificationType.event,
      NotificationType.announcement,
      NotificationType.publication
    ].includes(n.type)
  )

  // Helper function to render notification sections
  const renderNotificationSection = (
    sectionNotifications: typeof notifications,
    title?: string
  ) => {
    if (sectionNotifications.length === 0) return null

    return (
      <ScrollReveal>
        <div className="space-y-4">
          {title && (
            <>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <div className="border-t border-border"></div>
            </>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sectionNotifications.map((notification, index) => (
              <NotificationCard
                key={notification.id}
                notification={{
                  id: notification.id,
                  title: notification.title,
                  content: notification.content,
                  type: notification.type,
                  priority: notification.priority,
                  link: notification.link || "",
                  image: notification.image || "",
                  date: new Date(notification.date || notification.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                  read: notification.read,
                }}
                index={index}
                unread={!notification.read}
              />
            ))}
          </div>
        </div>
      </ScrollReveal>
    )
  }

  // Helper function for empty state
  const renderEmptyState = (message: string) => (
    <Card className="p-8 text-center">
      <p className="text-muted-foreground">{message}</p>
    </Card>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container px-4 py-12 md:px-6">
          <div className="mb-8 animate-slide-up">
            <DecorativeHeading level={1}>Notifications</DecorativeHeading>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto">
              Stay updated with the latest events, calls for papers, and announcements.
            </p>
          </div>

          <Tabs defaultValue="all" className="space-y-8">
            <TabsList className="grid w-full grid-cols-6 lg:grid-cols-7">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="cfp">Call for Papers</TabsTrigger>
              <TabsTrigger value="competitions">Competitions</TabsTrigger>
              <TabsTrigger value="vacancies">Vacancies</TabsTrigger>
              <TabsTrigger value="special">Special Issues</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="announcements" className="hidden lg:block">Announcements</TabsTrigger>
            </TabsList>

            {/* All Notifications Tab */}
            <TabsContent value="all" className="space-y-8">
              {notifications.length === 0 ? (
                renderEmptyState("No notifications available at this time.")
              ) : (
                <div className="space-y-12">
                  {/* Call for Papers */}
                  {renderNotificationSection(callForPapers, "Call for Papers")}
                  
                  {/* Student Competitions */}
                  {renderNotificationSection(studentCompetitions, "Student Competitions")}
                  
                  {/* Editorial Vacancies */}
                  {renderNotificationSection(editorialVacancies, "Editorial Vacancies")}
                  
                  {/* Special Issues */}
                  {renderNotificationSection(specialIssues, "Special Issues")}
                  
                  {/* Events */}
                  {renderNotificationSection(events, "Events")}
                  
                  {/* Announcements */}
                  {renderNotificationSection(announcements, "Announcements")}
                  
                  {/* Publications */}
                  {renderNotificationSection(publications, "Publications")}
                  
                  {/* Other notifications */}
                  {renderNotificationSection(otherNotifications, "Other Notifications")}
                </div>
              )}
            </TabsContent>

            {/* Call for Papers Tab */}
            <TabsContent value="cfp" className="space-y-4">
              <div className="border-t border-border my-4"></div>
              {callForPapers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {callForPapers.map((notification, index) => (
                    <ScrollReveal key={notification.id} delay={index * 100}>
                      <NotificationCard
                        notification={{
                          id: notification.id,
                          title: notification.title,
                          content: notification.content,
                          type: notification.type,
                          priority: notification.priority,
                          link: notification.link || "",
                          image: notification.image || "",
                          date: new Date(notification.date || notification.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }),
                          read: notification.read,
                        }}
                        index={index}
                        unread={!notification.read}
                      />
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                renderEmptyState("No call for papers at this time.")
              )}
            </TabsContent>

            {/* Student Competitions Tab */}
            <TabsContent value="competitions" className="space-y-4">
              <div className="border-t border-border my-4"></div>
              {studentCompetitions.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {studentCompetitions.map((notification, index) => (
                    <ScrollReveal key={notification.id} delay={index * 100}>
                      <NotificationCard
                        notification={{
                          id: notification.id,
                          title: notification.title,
                          content: notification.content,
                          type: notification.type,
                          priority: notification.priority,
                          link: notification.link || "",
                          image: notification.image || "",
                          date: new Date(notification.date || notification.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }),
                          read: notification.read,
                        }}
                        index={index}
                        unread={!notification.read}
                      />
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                renderEmptyState("No student competitions at this time.")
              )}
            </TabsContent>

            {/* Editorial Vacancies Tab */}
            <TabsContent value="vacancies" className="space-y-4">
              <div className="border-t border-border my-4"></div>
              {editorialVacancies.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {editorialVacancies.map((notification, index) => (
                    <ScrollReveal key={notification.id} delay={index * 100}>
                      <NotificationCard
                        notification={{
                          id: notification.id,
                          title: notification.title,
                          content: notification.content,
                          type: notification.type,
                          priority: notification.priority,
                          link: notification.link || "",
                          image: notification.image || "",
                          date: new Date(notification.date || notification.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }),
                          read: notification.read,
                        }}
                        index={index}
                        unread={!notification.read}
                      />
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                renderEmptyState("No editorial vacancies at this time.")
              )}
            </TabsContent>

            {/* Special Issues Tab */}
            <TabsContent value="special" className="space-y-4">
              <div className="border-t border-border my-4"></div>
              {specialIssues.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {specialIssues.map((notification, index) => (
                    <ScrollReveal key={notification.id} delay={index * 100}>
                      <NotificationCard
                        notification={{
                          id: notification.id,
                          title: notification.title,
                          content: notification.content,
                          type: notification.type,
                          priority: notification.priority,
                          link: notification.link || "",
                          image: notification.image || "",
                          date: new Date(notification.date || notification.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }),
                          read: notification.read,
                        }}
                        index={index}
                        unread={!notification.read}
                      />
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                renderEmptyState("No special issues at this time.")
              )}
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-4">
              <div className="border-t border-border my-4"></div>
              {events.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {events.map((notification, index) => (
                    <ScrollReveal key={notification.id} delay={index * 100}>
                      <NotificationCard
                        notification={{
                          id: notification.id,
                          title: notification.title,
                          content: notification.content,
                          type: notification.type,
                          priority: notification.priority,
                          link: notification.link || "",
                          image: notification.image || "",
                          date: new Date(notification.date || notification.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }),
                          read: notification.read,
                        }}
                        index={index}
                        unread={!notification.read}
                      />
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                renderEmptyState("No events at this time.")
              )}
            </TabsContent>

            {/* Announcements Tab */}
            <TabsContent value="announcements" className="space-y-4">
              <div className="border-t border-border my-4"></div>
              {announcements.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {announcements.map((notification, index) => (
                    <ScrollReveal key={notification.id} delay={index * 100}>
                      <NotificationCard
                        notification={{
                          id: notification.id,
                          title: notification.title,
                          content: notification.content,
                          type: notification.type,
                          priority: notification.priority,
                          link: notification.link || "",
                          image: notification.image || "",
                          date: new Date(notification.date || notification.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }),
                          read: notification.read,
                        }}
                        index={index}
                        unread={!notification.read}
                      />
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                renderEmptyState("No announcements at this time.")
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}