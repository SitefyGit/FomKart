-- Wallet and Settlement System Schema for FomKart

-- 1. Seller Wallets
CREATE TABLE IF NOT EXISTS seller_wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    available_balance DECIMAL(12, 2) DEFAULT 0.00,
    pending_balance DECIMAL(12, 2) DEFAULT 0.00,
    total_earned DECIMAL(12, 2) DEFAULT 0.00,
    total_withdrawn DECIMAL(12, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(seller_id, currency)
);

-- 2. Wallet Transactions (Ledger)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_id UUID REFERENCES seller_wallets(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'credit', 'debit', 'withdrawal', 'refund', 'chargeback'
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Settlements / Payouts
CREATE TABLE IF NOT EXISTS settlements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    payout_method VARCHAR(100), -- e.g., 'bank_transfer', 'paypal', 'stripe_connect'
    payout_details JSONB, -- Encrypted or masked payout account info
    transaction_reference VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Admin platform settings (extend if site_settings is not sufficient)
-- We assume site_settings handles commission parsing (e.g., 20% platform fee)

-- Add function to automatically create a wallet for a newly created user or upon first order
CREATE OR REPLACE FUNCTION create_wallet_for_seller()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO seller_wallets (seller_id, currency)
    VALUES (NEW.id, 'USD')
    ON CONFLICT (seller_id, currency) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_seller_wallet
AFTER INSERT ON users
FOR EACH ROW EXECUTE PROCEDURE create_wallet_for_seller();

-- Helper function to increment pending balance
CREATE OR REPLACE FUNCTION increment_seller_pending_balance(p_seller_id UUID, p_amount DECIMAL)
RETURNS void AS $$
BEGIN
    UPDATE seller_wallets
    SET pending_balance = pending_balance + p_amount
    WHERE seller_id = p_seller_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to release pending balance to available
CREATE OR REPLACE FUNCTION release_seller_pending_to_available(p_seller_id UUID, p_amount DECIMAL)
RETURNS void AS $$
BEGIN
    UPDATE seller_wallets
    SET pending_balance = pending_balance - p_amount,
        available_balance = available_balance + p_amount,
        total_earned = total_earned + p_amount
    WHERE seller_id = p_seller_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE seller_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own wallet"
ON seller_wallets FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can view their own transactions"
ON wallet_transactions FOR SELECT
USING (
    wallet_id IN (SELECT id FROM seller_wallets WHERE seller_id = auth.uid())
);

CREATE POLICY "Sellers can view their own settlements"
ON settlements FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can request settlements"
ON settlements FOR INSERT
WITH CHECK (auth.uid() = seller_id AND status = 'pending');
