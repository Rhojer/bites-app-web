-- Migración: Soporte Multimoneda Estática y Canje Manual de Divisas entre Bóvedas

-- 1. Actualizar order_payments para almacenar montos nominales inmutables por moneda y bóveda
ALTER TABLE IF EXISTS order_payments
  ADD COLUMN IF NOT EXISTS amount_currency numeric,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS exchange_rate numeric,
  ADD COLUMN IF NOT EXISTS amount_usd numeric,
  ADD COLUMN IF NOT EXISTS amount_ves numeric,
  ADD COLUMN IF NOT EXISTS vault text DEFAULT 'cash_usd';

-- 2. Actualizar cash_expenses para vincular egresos con bóvedas específicas
ALTER TABLE IF EXISTS cash_expenses
  ADD COLUMN IF NOT EXISTS vault text DEFAULT 'cash_usd',
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS exchange_rate numeric;

-- 3. Crear tabla currency_exchanges para registrar canjes y transferencias entre bóvedas
CREATE TABLE IF NOT EXISTS currency_exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_vault text NOT NULL, -- 'cash_usd', 'cash_ves', 'bank_ves', 'bank_usd'
  to_vault text NOT NULL,   -- 'cash_usd', 'cash_ves', 'bank_ves', 'bank_usd'
  from_amount numeric NOT NULL,
  from_currency text NOT NULL, -- 'USD', 'VES'
  to_amount numeric NOT NULL,
  to_currency text NOT NULL,   -- 'USD', 'VES'
  exchange_rate numeric NOT NULL, -- Tasa negociada/usada en el momento
  notes text,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Índices de auditoría
CREATE INDEX IF NOT EXISTS idx_currency_exchanges_created_at ON currency_exchanges(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_payments_vault ON order_payments(vault);
CREATE INDEX IF NOT EXISTS idx_cash_expenses_vault ON cash_expenses(vault);
