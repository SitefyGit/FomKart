import React from 'react'

export default function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="prose dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Cookie Policy</h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">1. What Are Cookies</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
            They are widely used to make websites work more efficiently and provide information to the owners of the site.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">2. How We Use Cookies</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            We use cookies for the following purposes:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
            <li><strong>Essential Cookies:</strong> Necessary for the website to function (e.g., shopping cart, login status).</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website.</li>
            <li><strong>Functional Cookies:</strong> Enable enhanced functionality and personalization.</li>
            <li><strong>Marketing Cookies:</strong> Used to track visitors across websites to display relevant ads.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">3. Managing Cookies</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, 
            you may worsen your overall user experience, since it will no longer be personalized to you.
          </p>
        </section>
      </div>
    </div>
  )
}
