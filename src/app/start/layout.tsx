import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get Started — fomkart',
  description: 'Create your free link-in-bio page and start selling digital products in minutes.',
}

export default function StartLayout({ children }: { children: React.ReactNode }) {
  // No SiteHeader / Footer — this is a standalone fullscreen onboarding flow
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {children}
    </div>
  )
}
