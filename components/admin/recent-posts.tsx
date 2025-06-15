import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { articles } from "@/lib/data"

export function RecentPosts() {
  // In a real application, you would fetch this data from your database
  const recentPosts = articles.slice(0, 5)

  return (
    <div className="space-y-8">
      {recentPosts.map((post) => (
        <div key={post.slug} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`https://avatar.vercel.sh/${post.slug}.png`} alt={post.author} />
            <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{post.title}</p>
            <p className="text-sm text-muted-foreground">
              {post.author} on {post.date}
            </p>
          </div>
          <div className="ml-auto font-medium">{post.views || Math.floor(Math.random() * 1000) + 100} views</div>
        </div>
      ))}
    </div>
  )
}
