import { supabase } from '../supabase'

export interface NewsletterSubscriptionData {
  email: string
  name?: string
  creatorId?: string
  preferences?: string[]
  source?: string
}

export interface NewsletterSubscriber {
  id: string
  email: string
  name?: string
  preferences?: { interests?: string[] }
  source: string
  status: 'active' | 'unsubscribed' | 'bounced'
  tags: string[]
  created_at: string
  updated_at: string
  confirmed: boolean
}

export class NewsletterService {
  /**
   * Subscribe a user to a newsletter
   */
  static async subscribe(data: NewsletterSubscriptionData): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        return { success: false, error: 'Invalid email address' }
      }

      // Try API route first
      try {
        const response = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email.toLowerCase().trim(),
            name: data.name?.trim(),
            creatorId: data.creatorId,
            preferences: data.preferences,
            source: data.source || 'manual'
          })
        })

        if (response.ok) {
          const result = await response.json()
          return { success: result.success }
        }
      } catch (apiError) {
        console.warn('API route failed, trying direct Supabase:', apiError)
      }

      // Fallback to direct Supabase call
      if (data.creatorId) {
        const { error } = await supabase
          .from('newsletter_subscriptions')
          .upsert({
            email: data.email.toLowerCase().trim(),
            creator_id: data.creatorId,
            name: data.name?.trim() || null,
            preferences: data.preferences ? { interests: data.preferences } : {},
            source: data.source || 'manual',
            tags: data.preferences || [],
            status: 'active'
          }, {
            onConflict: 'email,creator_id'
          })

        if (error) {
          return { success: false, error: error.message }
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  /**
   * Get subscribers for a creator
   */
  static async getSubscribers(
    creatorId: string, 
    status: 'all' | 'active' | 'unsubscribed' | 'bounced' = 'active'
  ): Promise<{ success: boolean; subscribers?: NewsletterSubscriber[]; error?: string }> {
    try {
      const params = new URLSearchParams({
        creatorId,
        ...(status !== 'all' && { status })
      })
      
      const response = await fetch(`/api/newsletter?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to fetch subscribers' }
      }
      
      return { success: true, subscribers: data.subscribers }
    } catch (error) {
      console.error('Error fetching subscribers:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch subscribers' 
      }
    }
  }

  /**
   * Unsubscribe a user from a newsletter
   */
  static async unsubscribe(email: string, creatorId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .update({ status: 'unsubscribed', updated_at: new Date().toISOString() })
        .match({ email: email.toLowerCase(), creator_id: creatorId })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Unsubscribe error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to unsubscribe' 
      }
    }
  }

  /**
   * Get subscription statistics for a creator
   */
  static async getStats(creatorId: string): Promise<{
    success: boolean
    stats?: {
      total: number
      active: number
      thisMonth: number
      topSources: { source: string; count: number }[]
      topPreferences: { preference: string; count: number }[]
    }
    error?: string
  }> {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .select('*')
        .eq('creator_id', creatorId)

      if (error) {
        return { success: false, error: error.message }
      }

      const now = new Date()
      const thisMonth = data?.filter(sub => {
        const subDate = new Date(sub.created_at)
        return subDate.getMonth() === now.getMonth() && subDate.getFullYear() === now.getFullYear()
      }).length || 0

      const sourceCounts = data?.reduce((acc, sub) => {
        acc[sub.source] = (acc[sub.source] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const preferenceCounts = data?.reduce((acc, sub) => {
        const interests = sub.preferences?.interests || []
        interests.forEach((interest: string) => {
          acc[interest] = (acc[interest] || 0) + 1
        })
        return acc
      }, {} as Record<string, number>) || {}

      return {
        success: true,
        stats: {
          total: data?.length || 0,
          active: data?.filter(s => s.status === 'active').length || 0,
          thisMonth,
          topSources: Object.entries(sourceCounts)
            .map(([source, count]) => ({ source, count: count as number }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5),
          topPreferences: Object.entries(preferenceCounts)
            .map(([preference, count]) => ({ preference, count: count as number }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch statistics' 
      }
    }
  }

  /**
   * Send newsletter to subscribers (mock implementation)
   * In production, this would integrate with an email service
   */
  static async sendNewsletter(
    creatorId: string, 
    subject: string, 
    content: string, 
    targetPreferences?: string[]
  ): Promise<{ success: boolean; sent?: number; error?: string }> {
    try {
      // Get active subscribers
      const { success, subscribers, error } = await this.getSubscribers(creatorId, 'active')
      
      if (!success || !subscribers) {
        return { success: false, error: error || 'Failed to get subscribers' }
      }

      // Filter by preferences if specified
      let targetSubscribers = subscribers
      if (targetPreferences && targetPreferences.length > 0) {
        targetSubscribers = subscribers.filter(sub => 
          sub.preferences?.interests?.some(interest => 
            targetPreferences.includes(interest)
          )
        )
      }

      // In a real implementation, you would:
      // 1. Use an email service (SendGrid, Mailchimp, etc.)
      // 2. Create email templates
      // 3. Handle bounce management
      // 4. Track open rates and clicks
      
      console.log(`Would send newsletter "${subject}" to ${targetSubscribers.length} subscribers`)
      console.log('Content preview:', content.substring(0, 100) + '...')
      
      // Mock successful send
      return { 
        success: true, 
        sent: targetSubscribers.length 
      }
    } catch (error) {
      console.error('Newsletter send error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send newsletter' 
      }
    }
  }
}

export default NewsletterService
