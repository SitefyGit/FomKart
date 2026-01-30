import React from 'react'
import Link from 'next/link'

export default function SitemapPage() {
  const sections = [
    {
      title: 'Marketplace',
      links: [
        { name: 'All Products', href: '/market' },
        { name: 'Digital Products', href: '/category/digital-products' },
        { name: 'Online Courses', href: '/category/courses' },
        { name: 'Offerings', href: '/category/services' },
        { name: 'Consultations', href: '/category/consultation' },
        { name: 'Find Creators', href: '/top-creators' },
      ]
    },
    {
      title: 'Creators',
      links: [
        { name: 'Start Selling', href: '/start-selling' },
        { name: 'Creator Dashboard', href: '/creator/onboarding' },
        { name: 'Login', href: '/login' },
        { name: 'Sign Up', href: '/signup' },
      ]
    },
    {
      title: 'Support & Legal',
      links: [
        { name: 'Help Center', href: '/help' },
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Cookie Policy', href: '/cookies' },
        { name: 'Contact Us', href: '/contact' },
      ]
    }
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-12 text-gray-900 dark:text-white">Sitemap</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
              {section.title}
            </h2>
            <ul className="space-y-3">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
