'use client'

import Link from 'next/link'

interface Props {
  username: string
  planTier?: 'free' | 'pro' | 'business'
  customBranding?: { text: string; url: string } | null
  themeColor?: string
}

export const PoweredByFomkart = ({ username, planTier = 'free', customBranding, themeColor }: Props) => {
  // Paid users can remove or customize branding
  if (planTier !== 'free' && !customBranding) return null

  const href = customBranding
    ? customBranding.url
    : `/start?ref=${encodeURIComponent(username)}`

  const label = customBranding
    ? customBranding.text
    : 'Powered by fomkart'

  const handleClick = () => {
    // Fire-and-forget referral tracking
    if (!customBranding) {
      fetch('/api/referrals/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref_code: username, attribution_source: 'profile_footer' }),
      }).catch(() => {})
    }
  }

  return (
    <div className="w-full py-8 flex flex-col items-center justify-center bg-transparent">
      <Link
        href={href}
        onClick={handleClick}
        className="group flex flex-col items-center gap-1.5 transition-all"
      >
        <span className="text-[11px] text-gray-400 group-hover:text-white tracking-wider transition-colors uppercase">
          {label}
        </span>
        {!customBranding && (
          <span 
            className="text-xs font-semibold transition-colors flex items-center gap-1 hover:brightness-125"
            style={{ color: themeColor || '#10b981' }}
          >
            Start for free
            <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        )}
      </Link>
    </div>
  )
}
