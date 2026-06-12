'use client'

import { useState, useEffect } from 'react'
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useCurrency } from '@/contexts/CurrencyContext'
import { convertToUSD, convertFromUSD } from '@/lib/currency'
import { supabase } from '@/lib/supabase'

interface WalletData {
  id: string
  available_balance: number
  pending_balance: number
  total_earned: number
  currency: string
}

interface Transaction {
  id: string
  transaction_type: string
  amount: number
  status: string
  description: string
  created_at: string
  orders?: { order_number: string }
}

interface Settlement {
  id: string
  amount: number
  status: string
  payout_method: string
  created_at: string
}

export default function WalletDashboard() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const { formatPrice, currency } = useCurrency()

  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer')
  
  const [payoutForm, setPayoutForm] = useState({
    country: 'US',
    accountName: '',
    accountNumber: '',
    bankName: '',
    routingCode: '',
    paypalEmail: '',
    walletAddress: '',
  })
  const [saveDetails, setSaveDetails] = useState(false)

  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchWallet()
    // Load saved details
    const saved = localStorage.getItem('fomkart_payout_details')
    if (saved) {
      try {
        setPayoutForm(JSON.parse(saved))
        setSaveDetails(true)
      } catch(e) {}
    }
  }, [])

  // Auto-save in realtime if option is checked
  useEffect(() => {
    if (saveDetails) {
      localStorage.setItem('fomkart_payout_details', JSON.stringify(payoutForm))
    } else {
      localStorage.removeItem('fomkart_payout_details')
    }
  }, [payoutForm, saveDetails])

  const fetchWallet = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/wallet', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch wallet')
      const data = await res.json()
      setWallet(data.wallet)
      setTransactions(data.transactions)
      setSettlements(data.settlements)
    } catch (err) {
      console.error(err)
      setError('Could not load wallet data.')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    const inputAmount = parseFloat(withdrawAmount)
    if (isNaN(inputAmount) || inputAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    const amount = convertToUSD(inputAmount, currency)

    // Handle floating point precision issues (allow within 1 cent)
    if (wallet && amount > wallet.available_balance && (amount - wallet.available_balance) > 0.01) {
      setError('Amount exceeds available balance')
      return
    }

    // Ensure we don't withdraw more than available due to precision
    const finalAmount = Math.min(amount, wallet?.available_balance || 0);

    if (payoutMethod === 'bank_transfer') {
      if (!payoutForm.accountName || !payoutForm.accountNumber || !payoutForm.bankName || !payoutForm.routingCode) {
        setError('Please fill in all bank details')
        return
      }
    } else if (payoutMethod === 'paypal') {
      if (!payoutForm.paypalEmail) {
        setError('Please provide your PayPal email')
        return
      }
    } else if (payoutMethod === 'crypto') {
      if (!payoutForm.walletAddress) {
        setError('Please provide your Crypto wallet address')
        return
      }
    }

    setIsWithdrawing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          amount: finalAmount,
          payoutMethod,
          payoutDetails: payoutForm
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to request withdrawal')

      setSuccess('Withdrawal request submitted successfully!')
      setWithdrawAmount('')
      if (!saveDetails) {
        setPayoutForm({
          country: 'US',
          accountName: '',
          accountNumber: '',
          bankName: '',
          routingCode: '',
          paypalEmail: '',
          walletAddress: '',
        })
      }
      fetchWallet() // refresh data
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsWithdrawing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Wallet className="w-6 h-6 text-emerald-600" />
          Wallet & Earnings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your funds, view transactions, and request payouts.</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Available Balance</h3>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatPrice(wallet?.available_balance || 0)}
          </div>
          <p className="text-xs text-gray-500 mt-2">Ready to withdraw</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Pending Balance</h3>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatPrice(wallet?.pending_balance || 0)}
          </div>
          <p className="text-xs text-gray-500 mt-2">Held in escrow until order completion</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Earned</h3>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatPrice(wallet?.total_earned || 0)}
          </div>
          <p className="text-xs text-gray-500 mt-2">Lifetime earnings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Transactions & History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No transactions yet.</div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                        {tx.amount > 0 ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{tx.description}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                          {new Date(tx.created_at).toLocaleDateString()} • 
                          <span className={`capitalize font-medium ${
                            tx.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 
                            tx.status === 'pending' ? 'text-amber-600 dark:text-amber-400' : 
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {tx.status}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatPrice(tx.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Withdraw & Settlements */}
        <div className="space-y-6">
          {/* Withdrawal Form */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Request Payout</h2>
            
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
            {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg">{success}</div>}

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payout Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="crypto">Crypto Wallet</option>
                </select>
              </div>
              {payoutMethod === 'bank_transfer' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Country</label>
                    <select
                      value={payoutForm.country}
                      onChange={(e) => setPayoutForm({ ...payoutForm, country: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="US">United States</option>
                      <option value="IN">India</option>
                      <option value="GB">United Kingdom</option>
                      <option value="EU">Europe (SEPA)</option>
                      <option value="AU">Australia</option>
                      <option value="CA">Canada</option>
                      <option value="OTHER">Other / International</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={payoutForm.accountName}
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="John Doe"
                      onChange={(e) => setPayoutForm({ ...payoutForm, accountName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {['EU'].includes(payoutForm.country) ? 'IBAN' : 'Account Number'}
                    </label>
                    <input
                      type="text"
                      value={payoutForm.accountNumber}
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Account Number"
                      onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={payoutForm.bankName}
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g. Chase Bank, HDFC, SBI"
                      onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {payoutForm.country === 'IN' && 'IFSC Code'}
                      {payoutForm.country === 'US' && 'Routing Number'}
                      {payoutForm.country === 'GB' && 'Sort Code'}
                      {payoutForm.country === 'AU' && 'BSB Number'}
                      {payoutForm.country === 'CA' && 'Transit Number'}
                      {payoutForm.country === 'EU' && 'BIC / SWIFT'}
                      {payoutForm.country === 'OTHER' && 'Routing / SWIFT Code'}
                    </label>
                    <input
                      type="text"
                      value={payoutForm.routingCode}
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Code"
                      onChange={(e) => setPayoutForm({ ...payoutForm, routingCode: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}
              {payoutMethod === 'paypal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PayPal Email Address</label>
                  <input
                    type="email"
                    value={payoutForm.paypalEmail}
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="email@example.com"
                    onChange={(e) => setPayoutForm({ ...payoutForm, paypalEmail: e.target.value })}
                    required
                  />
                </div>
              )}
              {payoutMethod === 'crypto' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Crypto Wallet Address (USDT/USDC)</label>
                  <input
                    type="text"
                    value={payoutForm.walletAddress}
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0x..."
                    onChange={(e) => setPayoutForm({ ...payoutForm, walletAddress: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="saveDetails" 
                  checked={saveDetails} 
                  onChange={(e) => setSaveDetails(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="saveDetails" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  Save these payout details securely for future withdrawals
                </label>
              </div>
              <button
                type="submit"
                disabled={isWithdrawing || !wallet || wallet.available_balance <= 0}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isWithdrawing ? 'Processing...' : 'Withdraw Funds'}
              </button>
            </form>
          </div>

          {/* Settlement History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payout History</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {settlements.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">No payouts requested yet.</div>
              ) : (
                settlements.map((settlement) => (
                  <div key={settlement.id} className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(settlement.amount)}</span>
                      {settlement.status === 'completed' && <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Paid</span>}
                      {settlement.status === 'pending' && <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Pending</span>}
                      {settlement.status === 'failed' && <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full"><XCircle className="w-3 h-3" /> Failed</span>}
                    </div>
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span className="capitalize">{settlement.payout_method.replace('_', ' ')}</span>
                      <span>{new Date(settlement.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
