-- ==============================================================================
-- BITES APP — AUDITORÍA DE SEGURIDAD Y POLÍTICAS ROW LEVEL SECURITY (RLS)
-- Archivo: supabase/security_rls.sql
-- Stack: PostgreSQL 15+ / Supabase Auth & Storage
-- Versión: 1.0.0
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIÓN Y CONFIGURACIÓN DE ROLES OPERATIVOS
-- Roles soportados: 'admin', 'manager', 'cashier', 'kitchen', 'waiter'
-- ------------------------------------------------------------------------------

-- Validar que la columna 'role' en profiles tenga un check constraint de valores válidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('admin', 'manager', 'cashier', 'kitchen', 'waiter', 'customer'));
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. FUNCIONES DE AYUDA DE SEGURIDAD (SECURITY DEFINER CON SEARCH_PATH SEGURO)
-- Optimizadas para ser evaluadas en subconsultas de políticas RLS sin degradar performance.
-- ------------------------------------------------------------------------------

-- Obtener el rol del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    -- 1. Intentar obtener desde claims/app_metadata de auth si está presente
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role'),
    -- 2. Fallback a la tabla profiles
    (SELECT role FROM public.profiles WHERE id = user_uuid LIMIT 1),
    -- 3. Default a un rol restringido
    'waiter'
  );
$$;

-- Validar si el usuario actual posee alguno de los roles provistos
CREATE OR REPLACE FUNCTION public.has_role(VARIADIC allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = (SELECT auth.uid()) 
      AND role = ANY(allowed_roles)
  );
$$;

-- Helper directo para Admin / Manager
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'manager')
  );
$$;

-- Helper directo para Admin exclusivo
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
  );
$$;

-- Otorgar ejecución a authenticated y revocar de anon y public general
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(VARIADIC text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(VARIADIC text[]) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_admin_or_manager() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. ÍNDICES DE PERFORMANCE PARA EVALUACIÓN RLS Y CLAVES FORÁNEAS
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_kitchen_status ON public.orders(kitchen_status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_recipe_id ON public.order_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON public.order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_created_by ON public.order_payments(created_by);
CREATE INDEX IF NOT EXISTS idx_cash_registers_opened_by ON public.cash_registers(opened_by);
CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON public.cash_registers(status);
CREATE INDEX IF NOT EXISTS idx_cash_register_details_register_id ON public.cash_register_details(cash_register_id);
CREATE INDEX IF NOT EXISTS idx_cash_expenses_register_id ON public.cash_expenses(cash_register_id);
CREATE INDEX IF NOT EXISTS idx_cash_expenses_created_by ON public.cash_expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_ingredient_id ON public.inventory_movements(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_by ON public.inventory_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_bills_payable_supplier_id ON public.bills_payable(supplier_id);
CREATE INDEX IF NOT EXISTS idx_credit_payments_customer_id ON public.credit_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_payments_created_by ON public.credit_payments(created_by);

-- ------------------------------------------------------------------------------
-- 4. TRIGGERS DE SEGURIDAD
-- 4.1 Auto-creación de perfil al registrarse un usuario en auth.users
-- 4.2 Prevención de escalado de privilegios y manipulación no autorizada de deuda
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'role', 'waiter')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para bloquear auto-escalado de privilegios y créditos sin ser Admin/Manager
CREATE OR REPLACE FUNCTION public.check_profile_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_role text;
BEGIN
  -- Si no es usuario autenticado directo (ej. migraciones internas o service_role), permitir
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  v_caller_role := (SELECT public.get_user_role(auth.uid()));

  -- Solo 'admin' o 'manager' pueden cambiar el rol, el límite de crédito o la deuda
  IF v_caller_role NOT IN ('admin', 'manager') THEN
    IF (OLD.role IS DISTINCT FROM NEW.role) THEN
      RAISE EXCEPTION 'Violación de Seguridad: No tienes permisos para alterar el rol de usuario.';
    END IF;
    IF (OLD.credit_limit IS DISTINCT FROM NEW.credit_limit) THEN
      RAISE EXCEPTION 'Violación de Seguridad: No tienes permisos para modificar el límite de crédito.';
    END IF;
    IF (OLD.current_debt IS DISTINCT FROM NEW.current_debt AND v_caller_role NOT IN ('cashier')) THEN
      RAISE EXCEPTION 'Violación de Seguridad: No tienes permisos para modificar el saldo de deuda.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_profile_escalation ON public.profiles;
CREATE TRIGGER trg_check_profile_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_escalation();

-- ------------------------------------------------------------------------------
-- 5. HABILITACIÓN DE RLS EN LAS 19 TABLAS DEL ERP
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_sub_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_register_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Forzar RLS en todas las tablas
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients FORCE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements FORCE ROW LEVEL SECURITY;
ALTER TABLE public.recipes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients FORCE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_sub_recipes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables FORCE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cash_registers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cash_register_details FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cash_expenses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bills_payable FORCE ROW LEVEL SECURITY;
ALTER TABLE public.expenses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.credit_payments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns FORCE ROW LEVEL SECURITY;

-- Limpiar políticas preexistentes para evitar duplicados
DO $$
DECLARE
  tbl text;
  pol record;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
      'profiles', 'suppliers', 'ingredients', 'inventory_movements', 'recipes',
      'recipe_ingredients', 'recipe_sub_recipes', 'restaurant_tables', 'orders',
      'order_items', 'payment_methods', 'order_payments', 'cash_registers',
      'cash_register_details', 'cash_expenses', 'bills_payable', 'expenses',
      'credit_payments', 'marketing_campaigns'
    )
  LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;
  END LOOP;
END $$;

-- ==============================================================================
-- 6. POLÍTICAS RLS DETALLADAS POR TABLA
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 6.1 TABLA: profiles (Perfiles y Usuarios)
-- ------------------------------------------------------------------------------
-- Lectura: Empleados operativos ven perfiles (clientes/colegas); el propio usuario ve su perfil
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (SELECT public.has_role('admin', 'manager', 'cashier', 'waiter'))
    OR (id = (SELECT auth.uid()))
  );

-- Inserción: Admin/Manager o registro del propio usuario
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.has_role('admin', 'manager'))
    OR (id = (SELECT auth.uid()))
  );

-- Modificación: Admin/Manager total; Cajero/Mesero actualiza clientes; Usuario actualiza sus datos personales (bloqueo por trigger)
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.has_role('admin', 'manager', 'cashier', 'waiter'))
    OR (id = (SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT public.has_role('admin', 'manager', 'cashier', 'waiter'))
    OR (id = (SELECT auth.uid()))
  );

-- Eliminación: Solo Administrador
CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));


-- ------------------------------------------------------------------------------
-- 6.2 TABLA: suppliers (Proveedores)
-- ------------------------------------------------------------------------------
CREATE POLICY "suppliers_select_policy" ON public.suppliers
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'cashier')));

CREATE POLICY "suppliers_insert_policy" ON public.suppliers
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "suppliers_update_policy" ON public.suppliers
  FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')))
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "suppliers_delete_policy" ON public.suppliers
  FOR DELETE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')));


-- ------------------------------------------------------------------------------
-- 6.3 TABLA: ingredients (Insumos e Inventario)
-- ------------------------------------------------------------------------------
-- Lectura: Todo el personal operativo necesita consultar existencias/recetas
CREATE POLICY "ingredients_select_policy" ON public.ingredients
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'kitchen', 'cashier', 'waiter')));

-- Inserción: Admin y Manager
CREATE POLICY "ingredients_insert_policy" ON public.ingredients
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

-- Modificación: Admin/Manager (datos maestros) + Cocina/Cajero (descuento y actualización de stock)
CREATE POLICY "ingredients_update_policy" ON public.ingredients
  FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'kitchen', 'cashier')))
  WITH CHECK ((SELECT public.has_role('admin', 'manager', 'kitchen', 'cashier')));

-- Eliminación: Solo Admin y Manager
CREATE POLICY "ingredients_delete_policy" ON public.ingredients
  FOR DELETE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')));


-- ------------------------------------------------------------------------------
-- 6.4 TABLA: inventory_movements (Kárdex y Mermas)
-- ------------------------------------------------------------------------------
-- Lectura: Admin, Manager, Cocina (historial de mermas/preparaciones) y Cajero (ventas)
CREATE POLICY "inventory_movements_select_policy" ON public.inventory_movements
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'kitchen', 'cashier')));

-- Inserción: Admin/Manager (compras), Cocina (mermas/lotes), Cajero (salidas por venta)
CREATE POLICY "inventory_movements_insert_policy" ON public.inventory_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.has_role('admin', 'manager', 'kitchen', 'cashier'))
  );

-- Modificación: Solo Admin y Manager para correcciones
CREATE POLICY "inventory_movements_update_policy" ON public.inventory_movements
  FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')))
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

-- Eliminación: Auditoría estricta - Solo Admin
CREATE POLICY "inventory_movements_delete_policy" ON public.inventory_movements
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));


-- ------------------------------------------------------------------------------
-- 6.5 TABLA: recipes (Platos, Recetas y Sub-recetas)
-- ------------------------------------------------------------------------------
CREATE POLICY "recipes_select_policy" ON public.recipes
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'kitchen', 'cashier', 'waiter')));

CREATE POLICY "recipes_insert_policy" ON public.recipes
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "recipes_update_policy" ON public.recipes
  FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'kitchen')))
  WITH CHECK ((SELECT public.has_role('admin', 'manager', 'kitchen')));

CREATE POLICY "recipes_delete_policy" ON public.recipes
  FOR DELETE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')));


-- ------------------------------------------------------------------------------
-- 6.6 TABLA: recipe_ingredients (Composición Insumos -> Receta)
-- ------------------------------------------------------------------------------
CREATE POLICY "recipe_ingredients_select_policy" ON public.recipe_ingredients
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'kitchen', 'cashier', 'waiter')));

CREATE POLICY "recipe_ingredients_insert_policy" ON public.recipe_ingredients
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "recipe_ingredients_update_policy" ON public.recipe_ingredients
  FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')))
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "recipe_ingredients_delete_policy" ON public.recipe_ingredients
  FOR DELETE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')));


-- ------------------------------------------------------------------------------
-- 6.7 TABLA: recipe_sub_recipes (Composición Sub-recetas anidadas)
-- ------------------------------------------------------------------------------
CREATE POLICY "recipe_sub_recipes_select_policy" ON public.recipe_sub_recipes
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'kitchen', 'cashier', 'waiter')));

CREATE POLICY "recipe_sub_recipes_insert_policy" ON public.recipe_sub_recipes
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "recipe_sub_recipes_update_policy" ON public.recipe_sub_recipes
  FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')))
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "recipe_sub_recipes_delete_policy" ON public.recipe_sub_recipes
  FOR DELETE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')));


-- ------------------------------------------------------------------------------
-- 6.8 TABLA: restaurant_tables (Mesas de Salón)
-- ------------------------------------------------------------------------------
CREATE POLICY "restaurant_tables_select_policy" ON public.restaurant_tables
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'waiter', 'cashier', 'kitchen')));

CREATE POLICY "restaurant_tables_insert_policy" ON public.restaurant_tables
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

-- Meseros, Cajeros, Cocina y Gerentes pueden actualizar estados de mesa
CREATE POLICY "restaurant_tables_update_policy" ON public.restaurant_tables
  FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'waiter', 'cashier')))
  WITH CHECK ((SELECT public.has_role('admin', 'manager', 'waiter', 'cashier')));

CREATE POLICY "restaurant_tables_delete_policy" ON public.restaurant_tables
  FOR DELETE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')));


-- ------------------------------------------------------------------------------
-- 6.9 TABLA: orders (Comandas, Salón, Delivery y Ventas POS)
-- ------------------------------------------------------------------------------
CREATE POLICY "orders_select_policy" ON public.orders
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'cashier', 'waiter', 'kitchen')));

CREATE POLICY "orders_insert_policy" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'manager', 'cashier', 'waiter')));

-- Cocina actualiza kitchen_status; Cajero actualiza payment_status/totales; Mesero actualiza comandas abiertas
CREATE POLICY "orders_update_policy" ON public.orders
  FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'cashier', 'waiter', 'kitchen')))
  WITH CHECK ((SELECT public.has_role('admin', 'manager', 'cashier', 'waiter', 'kitchen')));

CREATE POLICY "orders_delete_policy" ON public.orders
  FOR DELETE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')));


-- ------------------------------------------------------------------------------
-- 6.10 TABLA: order_items (Líneas de la Comanda)
-- ------------------------------------------------------------------------------
CREATE POLICY "order_items_select_policy" ON public.order_items
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'cashier', 'waiter', 'kitchen')));

CREATE POLICY "order_items_insert_policy" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'manager', 'cashier', 'waiter')));

CREATE POLICY "order_items_update_policy" ON public.order_items
  FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'cashier', 'waiter', 'kitchen')))
  WITH CHECK ((SELECT public.has_role('admin', 'manager', 'cashier', 'waiter', 'kitchen')));

CREATE POLICY "order_items_delete_policy" ON public.order_items
  FOR DELETE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'waiter', 'cashier')));


-- ------------------------------------------------------------------------------
-- 6.11 TABLA: payment_methods (Métodos de Pago y Comisiones)
-- ------------------------------------------------------------------------------
-- Lectura: Cajeros y meseros para elegir método al facturar
CREATE POLICY "payment_methods_select_policy" ON public.payment_methods
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'cashier', 'waiter')));

CREATE POLICY "payment_methods_insert_policy" ON public.payment_methods
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "payment_methods_update_policy" ON public.payment_methods
  FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')))
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "payment_methods_delete_policy" ON public.payment_methods
  FOR DELETE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')));


-- ------------------------------------------------------------------------------
-- 6.12 TABLA: order_payments (Transacciones de Pago)
-- ------------------------------------------------------------------------------
CREATE POLICY "order_payments_select_policy" ON public.order_payments
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'cashier', 'waiter')));

CREATE POLICY "order_payments_insert_policy" ON public.order_payments
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'manager', 'cashier', 'waiter')));

CREATE POLICY "order_payments_update_policy" ON public.order_payments
  FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')))
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "order_payments_delete_policy" ON public.order_payments
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));


-- ------------------------------------------------------------------------------
-- 6.13 TABLA: cash_registers (Arqueos y Turnos de Caja)
-- ------------------------------------------------------------------------------
-- Lectura: Admin/Manager ven todas las cajas; Cajeros ven sus turnos o la caja abierta activa
CREATE POLICY "cash_registers_select_policy" ON public.cash_registers
  FOR SELECT TO authenticated
  USING (
    (SELECT public.has_role('admin', 'manager'))
    OR (
      (SELECT public.has_role('cashier'))
      AND (opened_by = (SELECT auth.uid()) OR status = 'open')
    )
  );

-- Inserción: Admin, Manager y Cajero (apertura de turno)
CREATE POLICY "cash_registers_insert_policy" ON public.cash_registers
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'manager', 'cashier')));

-- Actualización: Admin/Manager o el propio cajero responsable para cerrar su turno
CREATE POLICY "cash_registers_update_policy" ON public.cash_registers
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.has_role('admin', 'manager'))
    OR ((SELECT public.has_role('cashier')) AND opened_by = (SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT public.has_role('admin', 'manager'))
    OR ((SELECT public.has_role('cashier')) AND opened_by = (SELECT auth.uid()))
  );

CREATE POLICY "cash_registers_delete_policy" ON public.cash_registers
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));


-- ------------------------------------------------------------------------------
-- 6.14 TABLA: cash_register_details (Desglose de Arqueo por Método de Pago)
-- ------------------------------------------------------------------------------
CREATE POLICY "cash_register_details_select_policy" ON public.cash_register_details
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'cashier')));

CREATE POLICY "cash_register_details_insert_policy" ON public.cash_register_details
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'manager', 'cashier')));

CREATE POLICY "cash_register_details_update_policy" ON public.cash_register_details
  FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'cashier')))
  WITH CHECK ((SELECT public.has_role('admin', 'manager', 'cashier')));

CREATE POLICY "cash_register_details_delete_policy" ON public.cash_register_details
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));


-- ------------------------------------------------------------------------------
-- 6.15 TABLA: cash_expenses (Egresos y Retiros de Caja con Nota Obligatoria)
-- ------------------------------------------------------------------------------
-- Lectura: Admin/Manager ven todos; Cajero ve los de su turno/caja
CREATE POLICY "cash_expenses_select_policy" ON public.cash_expenses
  FOR SELECT TO authenticated
  USING (
    (SELECT public.has_role('admin', 'manager'))
    OR (
      (SELECT public.has_role('cashier'))
      AND (
        created_by = (SELECT auth.uid())
        OR cash_register_id IN (
          SELECT id FROM public.cash_registers 
          WHERE opened_by = (SELECT auth.uid()) AND status = 'open'
        )
      )
    )
  );

-- Inserción: Admin, Manager y Cajero (CON NOTA OBLIGATORIA Y JUSTIFICADA)
CREATE POLICY "cash_expenses_insert_policy" ON public.cash_expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.has_role('admin', 'manager', 'cashier'))
    AND notes IS NOT NULL 
    AND length(trim(notes)) >= 3
  );

-- Modificación: Solo Admin y Manager
CREATE POLICY "cash_expenses_update_policy" ON public.cash_expenses
  FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')))
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

-- Eliminación: Solo Admin (Evitar ocultamiento de faltantes de caja)
CREATE POLICY "cash_expenses_delete_policy" ON public.cash_expenses
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));


-- ------------------------------------------------------------------------------
-- 6.16 TABLA: bills_payable (Cuentas por Pagar a Proveedores - FINANCIERO)
-- ------------------------------------------------------------------------------
CREATE POLICY "bills_payable_select_policy" ON public.bills_payable
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "bills_payable_insert_policy" ON public.bills_payable
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "bills_payable_update_policy" ON public.bills_payable
  FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')))
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "bills_payable_delete_policy" ON public.bills_payable
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));


-- ------------------------------------------------------------------------------
-- 6.17 TABLA: expenses (Gastos Generales / Operativos P&L - FINANCIERO)
-- ------------------------------------------------------------------------------
CREATE POLICY "expenses_select_policy" ON public.expenses
  FOR SELECT TO authenticated
  USING (
    (SELECT public.has_role('admin', 'manager'))
    OR ((SELECT public.has_role('cashier')) AND created_by = (SELECT auth.uid()))
  );

CREATE POLICY "expenses_insert_policy" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'manager', 'cashier')));

CREATE POLICY "expenses_update_policy" ON public.expenses
  FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')))
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "expenses_delete_policy" ON public.expenses
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));


-- ------------------------------------------------------------------------------
-- 6.18 TABLA: credit_payments (Abonos a Cuentas de Crédito de Clientes)
-- ------------------------------------------------------------------------------
CREATE POLICY "credit_payments_select_policy" ON public.credit_payments
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'manager', 'cashier')));

CREATE POLICY "credit_payments_insert_policy" ON public.credit_payments
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'manager', 'cashier')));

CREATE POLICY "credit_payments_update_policy" ON public.credit_payments
  FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')))
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "credit_payments_delete_policy" ON public.credit_payments
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));


-- ------------------------------------------------------------------------------
-- 6.19 TABLA: marketing_campaigns (Campañas CRM y Fidelización)
-- ------------------------------------------------------------------------------
CREATE POLICY "marketing_campaigns_select_policy" ON public.marketing_campaigns
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "marketing_campaigns_insert_policy" ON public.marketing_campaigns
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "marketing_campaigns_update_policy" ON public.marketing_campaigns
  FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')))
  WITH CHECK ((SELECT public.has_role('admin', 'manager')));

CREATE POLICY "marketing_campaigns_delete_policy" ON public.marketing_campaigns
  FOR DELETE TO authenticated
  USING ((SELECT public.has_role('admin', 'manager')));

-- ==============================================================================
-- FIN DEL SCRIPT DE SEGURIDAD Y POLÍTICAS RLS (BITES APP)
-- ==============================================================================
