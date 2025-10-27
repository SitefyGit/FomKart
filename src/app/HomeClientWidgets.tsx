'use client'

import dynamic from 'next/dynamic'

// Load heavy widgets only on the client
const LeadCaptureForm = dynamic(() => import('@/components/LeadCaptureForm'))
const CredentialsHelper = dynamic(() => import('@/components/CredentialsHelper'))

export type LeadCaptureProps = {
  creatorId?: string
  className?: string
  title?: string
  subtitle?: string
  placeholder?: string
  buttonText?: string
  showNameField?: boolean
  showPreferences?: boolean
  compactMode?: boolean
  onSubscribe?: undefined
}

export function HomeLeadCapture(props: LeadCaptureProps) {
  return <LeadCaptureForm {...props} />
}

export function HomeCredentialsHelper() {
  return <CredentialsHelper />
}

export default function HomeClientWidgets(props: LeadCaptureProps) {
  return (
    <>
      <HomeLeadCapture {...props} />
      <HomeCredentialsHelper />
    </>
  )
}
