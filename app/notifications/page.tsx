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
  // const studentCompetitions = notifications.filter((n) => n.type === NotificationType.student_competition)
  const vacancies = notifications.filter((n) => n.type === NotificationType.vacancy)
  // const specialIssues = notifications.filter((n) => n.type === NotificationType.special_issue)
  const events = notifications.filter((n) => n.type === NotificationType.event)
  // const announcements = notifications.filter((n) => n.type === NotificationType.announcement)
  // const publications = notifications.filter((n) => n.type === NotificationType.publication)
  const general = notifications.filter((n) => n.type === NotificationType.general)
  
  // Other notifications (catch-all for any new types)
  const otherNotifications = notifications.filter(
    (n) => ![
      NotificationType.call_for_papers,
      // NotificationType.student_competition,
      NotificationType.vacancy,
      // NotificationType.special_issue,
      NotificationType.event,
      // NotificationType.announcement,
      // NotificationType.publication,
      NotificationType.general
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
          <div className="border-t border-stone-300"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sectionNotifications.map((notification, index) => {

              return (
              <NotificationCard
                key={notification.id}
                notification={{
                  id: notification.id,
                  title: notification.title,
                  content: notification.content,
                  type: notification.type,
                  priority: notification.priority,
                  linkDisplay: notification.linkDisplay || "",
                  linkUrl: notification.linkUrl || "",
                  date: new Date(notification.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                  expiresAt: notification.expiresAt ? new Date(notification.expiresAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) : null,
                }}
                index={index}
                unread={false} // Since we don't have user-specific read status
              />
            )})}
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
      <main className="flex-1 px-2">
        <div className="max-w-5xl mx-auto text-center mt-4 mb-16">
        <div className="mb-8 animate-slide-up justify-center pt-10 space-y-3">
            <h1 className="text-4xl sm:text-5xl text-center">Notifications</h1>
            <p className="text-stone-600 text-sm font-normal justify-center align-middle content-center text-center max-w-4xl mx-auto">
              Stay updated with the latest events, calls for papers, and announcements.
            </p>
          </div>

          <Tabs defaultValue="all" className="space-y-8">
            <TabsList className="grid bg-transparent w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-1 data-[state=active]:bg-red-800">
              <TabsTrigger value="all" className="data-[state=active]:bg-red-800 data-[state=active]:text-white text-xs sm:text-sm">All</TabsTrigger>
              <TabsTrigger value="cfp" className="data-[state=active]:bg-red-800 data-[state=active]:text-white text-xs sm:text-sm">CFP</TabsTrigger>
              <TabsTrigger value="competitions" className="data-[state=active]:bg-red-800 data-[state=active]:text-white text-xs sm:text-sm">Events</TabsTrigger>
              <TabsTrigger value="vacancies" className="data-[state=active]:bg-red-800 data-[state=active]:text-white text-xs sm:text-sm hidden sm:block">Vacancies</TabsTrigger>
              {/* <TabsTrigger value="special" className="data-[state=active]:bg-red-800 data-[state=active]:text-white text-xs sm:text-sm hidden md:block">Special</TabsTrigger> */}
              {/* <TabsTrigger value="events" className="data-[state=active]:bg-red-800 data-[state=active]:text-white text-xs sm:text-sm hidden md:block">Events</TabsTrigger> */}
              {/* <TabsTrigger value="announcements" className="hidden lg:block data-[state=active]:bg-red-800 data-[state=active]:text-white text-xs sm:text-sm">Announcements</TabsTrigger> */}
              <TabsTrigger value="general" className="hidden lg:block data-[state=active]:bg-red-800 data-[state=active]:text-white text-xs sm:text-sm">General</TabsTrigger>
            </TabsList>

            {/* All Notifications Tab */}
            <TabsContent value="all" className="space-y-8">
              {notifications.length === 0 ? (
                renderEmptyState("No notifications available at this time.")
              ) : (
                <div className="space-y-4">
                  {/* Call for Papers */}
                  {renderNotificationSection(callForPapers, "Call for Papers")}
                  
                  {/* Student Competitions */}
                  {/* {renderNotificationSection(studentCompetitions, "Student Competitions")} */}
                  
                  {/* Editorial Vacancies */}
                  {renderNotificationSection(vacancies, "Vacancies")}
                  
                  {/* Special Issues */}
                  {/* {renderNotificationSection(specialIssues, "Special Issues")} */}
                  
                  {/* Events */}
                  {renderNotificationSection(events, "Events")}
                  
                  {/* Announcements */}
                  {/* {renderNotificationSection(announcements, "Announcements")} */}
                  
                  {/* Publications */}
                  {/* {renderNotificationSection(publications, "Publications")} */}
                  
                  {/* General */}
                  {renderNotificationSection(general, "General")}
                  
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
                          linkDisplay: notification.linkDisplay || "",
                          linkUrl: notification.linkUrl || "",
                          date: new Date(notification.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }),
                          expiresAt: notification.expiresAt ? new Date(notification.expiresAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }) : null,
                          createdAt: new Date(notification.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }),
                        }}
                        index={index}
                        unread={false}
                      />
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                renderEmptyState("No call for papers at this time.")
              )}
            </TabsContent>

            {/* Student Competitions Tab
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
                          linkDisplay: notification.linkDisplay || "",
                          linkUrl: notification.linkUrl || "",
                          date: new Date(notification.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }),
                          expiresAt: notification.expiresAt ? new Date(notification.expiresAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }) : null,
                        }}
                        index={index}
                        unread={false}
                      />
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                renderEmptyState("No student competitions at this time.")
              )}
            </TabsContent> */}

            {/* Editorial Vacancies Tab */}
            <TabsContent value="vacancies" className="space-y-4">
              <div className="border-t border-border my-4"></div>
              {vacancies.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {vacancies.map((notification, index) => (
                    <ScrollReveal key={notification.id} delay={index * 100}>
                      <NotificationCard
                        notification={{
                          id: notification.id,
                          title: notification.title,
                          content: notification.content,
                          type: notification.type,
                          priority: notification.priority,
                          linkDisplay: notification.linkDisplay || "",
                          linkUrl: notification.linkUrl || "",
                          date: new Date(notification.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }),
                          expiresAt: notification.expiresAt ? new Date(notification.expiresAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }) : null,
                        }}
                        index={index}
                        unread={false}
                      />
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                renderEmptyState("No editorial vacancies at this time.")
              )}
            </TabsContent>

            {/* Special Issues Tab
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
                          linkDisplay: notification.linkDisplay || "",
                          linkUrl: notification.linkUrl || "",
                          date: new Date(notification.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }),
                          expiresAt: notification.expiresAt ? new Date(notification.expiresAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }) : null,
                        }}
                        index={index}
                        unread={false}
                      />
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                renderEmptyState("No special issues at this time.")
              )}
            </TabsContent> */}

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
                          linkDisplay: notification.linkDisplay || "",
                          linkUrl: notification.linkUrl || "",
                          date: new Date(notification.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }),
                          expiresAt: notification.expiresAt ? new Date(notification.expiresAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }) : null,
                        }}
                        index={index}
                        unread={false}
                      />
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                renderEmptyState("No events at this time.")
              )}
            </TabsContent>

            {/* Announcements Tab
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
                          linkDisplay: notification.linkDisplay || "",
                          linkUrl: notification.linkUrl || "",
                          date: new Date(notification.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }),
                          expiresAt: notification.expiresAt ? new Date(notification.expiresAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }) : null,
                        }}
                        index={index}
                        unread={false}
                      />
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                renderEmptyState("No announcements at this time.")
              )}
            </TabsContent> */}

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4">
              <div className="border-t border-border my-4"></div>
              {general.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {general.map((notification, index) => (
                    <ScrollReveal key={notification.id} delay={index * 100}>
                      <NotificationCard
                        notification={{
                          id: notification.id,
                          title: notification.title,
                          content: notification.content,
                          type: notification.type,
                          priority: notification.priority,
                          linkDisplay: notification.linkDisplay || "",
                          linkUrl: notification.linkUrl || "",
                          date: new Date(notification.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }),
                          expiresAt: notification.expiresAt ? new Date(notification.expiresAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }) : null,
                        }}
                        index={index}
                        unread={false}
                      />
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                renderEmptyState("No general notifications at this time.")
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}