'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function RouteProgress() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null
    const el = document.createElement('div')
    el.id = 'route-progress'
    el.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0;background:#10b981;z-index:9999;transition:width .2s ease-out,opacity .3s;'
    document.body.appendChild(el)

    const start = () => {
      el.style.opacity = '1'
      el.style.width = '20%'
  if (intervalId) clearInterval(intervalId)
  intervalId = setInterval(() => {
        const w = parseFloat(el.style.width)
        if (w < 95) el.style.width = Math.min(95, w + Math.random() * 15) + '%'
      }, 200)
    }
    const done = () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
      el.style.width = '100%'
      setTimeout(() => { el.style.opacity = '0' }, 150)
    }

    if (router) start()
    done()

    return () => {
      if (intervalId) clearInterval(intervalId)
      el.remove()
    }
  }, [pathname, router])

  return null
}
