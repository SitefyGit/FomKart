import React from 'react'

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="prose dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Terms of Service</h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">1. Acceptance of Terms</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            By accessing and using FomKart ("the Platform"), you agree to comply with and be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use our services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">2. Creator Accounts</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            To sell products or services on FomKart, you must register for a creator account. You agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Accept responsibility for all activities that occur under your account</li>
            <li>Promptly notify us of any unauthorized use</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">3. Selling and Payments</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Creators set their own prices for products and services. FomKart charges a platform fee on each successful transaction. 
            Payouts are processed according to our payout schedule, subject to a security hold period.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">4. Prohibited Content</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You may not upload, post, or transmit any content that:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
            <li>Infringes on intellectual property rights</li>
            <li>Is illegal, threatening, defamatory, or obscene</li>
            <li>Contains viruses or malicious code</li>
            <li>Promotes hate speech or discrimination</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">5. Limitation of Liability</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            FomKart shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, 
            loss of profits, data, use, goodwill, or other intangible losses.
          </p>
        </section>
      </div>
    </div>
  )
}
