-- ==============================================================================
-- BITES APP — ACTUALIZACIÓN Y CORRECCIÓN DE ESQUEMA (ORDERS, ITEMS & MOVEMENTS)
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase
-- ==============================================================================

-- 1. Actualizar tabla ORDERS
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS type text DEFAULT 'dine_in';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS table_id uuid REFERENCES public.restaurant_tables(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text DEFAULT 'Cliente Salón';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'paid';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kitchen_status text DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes text;

-- 2. Actualizar tabla ORDER_ITEMS
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS kitchen_status text DEFAULT 'pending';

-- 3. Actualizar tabla INVENTORY_MOVEMENTS
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS ingredient_id uuid REFERENCES public.ingredients(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS quantity numeric;

-- 4. Actualizar tabla PROFILES (CRM & Créditos)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credit_limit numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_debt numeric DEFAULT 0;

-- 5. Recargar el schema cache de PostgREST
NOTIFY pgrst, 'reload schema';
