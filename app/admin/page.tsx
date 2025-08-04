import React from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { articles } from "@/lib/data"
import { LogoutButton } from "@/components/admin/logout-button"

export default function AdminDashboard() {
  const stats = {
    totalPosts: articles.length,
    publishedPosts: articles.filter((article) => !article.draft).length,
    draftPosts: articles.filter((article) => article.draft).length,
    totalViews: articles.reduce((acc, article) => acc + (article.views || 0), 0),
  }

  return (
    <div className="space-y-6">
      <DashboardHeader heading="Dashboard" text="Overview of your blog content and performance." />
      <LogoutButton />
      {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedPosts} published, {stats.draftPosts} drafts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">+{Math.floor(Math.random() * 20) + 1}% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2 min</div>
            <p className="text-xs text-muted-foreground">Average read time per article</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Constitutional Law</div>
            <p className="text-xs text-muted-foreground">42% of total content</p>
          </CardContent>
        </Card>
      </div> */}

      {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>View and engagement metrics for the past 30 days.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>Your most recently published articles.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentPosts />
          </CardContent>
        </Card>
      </div> */}
    </div>
  )
}
