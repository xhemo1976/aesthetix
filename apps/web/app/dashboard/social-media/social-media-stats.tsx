'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, Star, TrendingUp } from 'lucide-react'
import type { SocialAccount } from '@/lib/actions/social-media'

interface SocialMediaStatsProps {
  accounts: SocialAccount[]
  posts: any[]
  reviews: any[]
  averageRating: number
  totalReviews: number
}

export function SocialMediaStats({
  accounts,
  posts,
  reviews,
  averageRating,
  totalReviews
}: SocialMediaStatsProps) {
  const activeAccounts = accounts.filter(a => a.is_active).length

  // Calculate total engagement
  const totalEngagement = posts.reduce(
    (sum, post) => sum + (post.likes_count || 0) + (post.comments_count || 0) + (post.shares_count || 0),
    0
  )

  const stats = [
    {
      title: 'Verbundene Accounts',
      value: activeAccounts,
      subtitle: `von ${accounts.length} gesamt`,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      title: 'Gesamte Posts',
      value: posts.length,
      subtitle: 'Gecachte Beiträge',
      icon: FileText,
      color: 'text-purple-500'
    },
    {
      title: 'Durchschnittsbewertung',
      value: averageRating ? averageRating.toFixed(1) : '0',
      subtitle: `${totalReviews} Bewertungen`,
      icon: Star,
      color: 'text-yellow-500'
    },
    {
      title: 'Engagement',
      value: formatNumber(totalEngagement),
      subtitle: 'Likes, Kommentare & Shares',
      icon: TrendingUp,
      color: 'text-green-500'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
