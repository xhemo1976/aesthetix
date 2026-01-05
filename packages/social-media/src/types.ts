// Social Media Types

export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'google' | 'youtube' | 'whatsapp'

export interface SocialPost {
  id: string
  platform: SocialPlatform
  content: string
  imageUrl?: string
  videoUrl?: string
  link?: string
  likes?: number
  comments?: number
  shares?: number
  views?: number
  createdAt: Date
  metadata?: Record<string, any>
}

export interface SocialFeed {
  platform: SocialPlatform
  username: string
  profileUrl: string
  profileImageUrl?: string
  posts: SocialPost[]
  lastUpdated: Date
}

export interface SocialConfig {
  instagram?: {
    accessToken: string
    userId: string
  }
  facebook?: {
    pageId: string
    accessToken: string
  }
  google?: {
    placeId: string
    apiKey: string
  }
}

export interface SocialWidgetProps {
  platform: SocialPlatform
  username?: string
  maxPosts?: number
  showHeader?: boolean
  className?: string
}
