# 🛡️ Guía de Arquitectura de Seguridad y Row Level Security (RLS) — Bites App

> **Plataforma**: ERP Gastronómico Bites App Web  
> **Motor**: PostgreSQL 15+ / Supabase Auth & Database  
> **Script SQL Asociado**: [`supabase/security_rls.sql`](../supabase/security_rls.sql)  
> **Fecha de Auditoría**: Septiembre 2026  

---

## 🎯 1. Resumen Ejecutivo y Objetivos de Seguridad

La arquitectura de seguridad de **Bites App** implementa un modelo **Zero-Trust** a nivel de motor de base de datos mediante **Row Level Security (RLS)** en PostgreSQL. Esto garantiza que ningún cliente (interfaz web, terminal POS, tablet de comandas o llamada API) pueda leer o mutar datos fuera del alcance estricto de su rol operativo, incluso ante vulnerabilidades o manipulaciones en el frontend.

### Principios Fundamentales:
1. **Defensa en Profundidad**: La seguridad no depende del frontend ni de Next.js; la base de datos rechaza cualquier consulta no autorizada.
2. **Optimización de Rendimiento RLS**: Todas las funciones auxiliares de comprobación de roles se ejecutan envueltas en subconsultas `(SELECT ...)` para permitir que el planificador de PostgreSQL cachee el resultado por sentencia (evitando re-evaluaciones fila por fila en tablas con millones de registros).
3. **Prevención de Inyección de Esquema (`search_path`)**: Todas las funciones con `SECURITY DEFINER` declaran explícitamente `SET search_path = ''` para mitigar ataques de suplantación de esquemas y funciones.
4. **Protección Anti-Escalamiento de Privilegios**: Triggers en base de datos impiden que usuarios no autorizados eleven su propio rol o aumenten líneas de crédito/saldos de deuda.

---

## 👥 2. Matriz de Roles Operativos

| Rol | Identificador | Alcance Operativo |
| :--- | :--- | :--- |
| **👑 Administrador** | `admin` | Acceso total: Configuración global, P&L, márgenes, borrado de auditoría, gestión de usuarios y roles. |
| **💼 Gerente** | `manager` | Operación completa de inventario, proveedores, compras, cuentas por pagar, costos y auditoría de cajas. |
| **🍳 Cocina / Chef** | `kitchen` | Visualización de recetas y escandallos, monitor KDS de comandas y registro de mermas/lotes de inventario. |
| **💳 Cajero** | `cashier` | Apertura/cierre de turnos de caja, cobros multi-método, abonos a créditos y **egresos de dinero con nota obligatoria**. |
| **🍽️ Mesero** | `waiter` | Estado de mesas, toma de comandas, adición de platos/modificadores y consulta de carta/menú. |

---

## 📊 3. Matriz Granular de Permisos por Tabla (19 Tablas)

| # | Tabla Supabase | Admin | Manager | Cashier | Kitchen | Waiter | Reglas y Restricciones Clave |
| :-: | :--- | :-: | :-: | :-: | :-: | :-: | :--- |
| **1** | `profiles` | CRUD | CRUD | RU (Clientes) | R (Limitado) | RU (Clientes) | Trigger bloquea auto-escalación de `role` y `credit_limit`. |
| **2** | `suppliers` | CRUD | CRUD | R | — | — | Gestión exclusiva de compras/gerencia. |
| **3** | `ingredients` | CRUD | CRUD | RU (Stock) | RU (Stock/Mermas) | R | Permite actualizar `current_stock` en cocina/ventas. |
| **4** | `inventory_movements` | CRUD | CRUD | CR | CR (Mermas/Lotes) | — | Registro de kárdex con trazabilidad (`created_by`). |
| **5** | `recipes` | CRUD | CRUD | R | RU (Instrucc./KDS) | R | Cocina consulta composición y estados de preparación. |
| **6** | `recipe_ingredients` | CRUD | CRUD | R | R | R | Insumos por plato requeridos para deducción automática. |
| **7** | `recipe_sub_recipes` | CRUD | CRUD | R | R | R | Sub-recetas anidadas (ej. salsas, masas, marinados). |
| **8** | `restaurant_tables` | CRUD | CRUD | RU (Estados) | R | RU (Estados) | Meseros y cajeros cambian estados (Libre/Ocupada). |
| **9** | `orders` | CRUD | CRUD | CRU | RU (KDS) | CRU | Cocina actualiza `kitchen_status`; POS factura. |
| **10** | `order_items` | CRUD | CRUD | CRUD | RU (KDS) | CRUD | Platos individuales de comanda con modificadores/notas. |
| **11** | `payment_methods` | CRUD | CRUD | R | — | R | Catálogo de medios de pago y comisiones bancarias. |
| **12** | `order_payments` | CRUD | CRUD | CR | — | CR | Registro inmutable de transacciones de cobro. |
| **13** | `cash_registers` | CRUD | CRUD | CRU (Turno propio)| — | — | Cajero solo puede cerrar o modificar su propio turno. |
| **14** | `cash_register_details`| CRUD | CRUD | CRU (Arqueo) | — | — | Desglose por método de pago para conciliación. |
| **15** | `cash_expenses` | CRUD | CRUD | CR (Con Nota) | — | — | **Obligatorio `notes` $\ge$ 3 caracteres**; DELETE solo Admin. |
| **16** | `bills_payable` | CRUD | CRUD | — | — | — | **Financiero**: Cuentas por pagar restringidas. |
| **17** | `expenses` | CRUD | CRUD | CR (Egresos turno)| — | — | **Financiero**: Gastos operativos y P&L. |
| **18** | `credit_payments` | CRUD | CRUD | CR | — | — | Abonos a cuentas corrientes de clientes con crédito. |
| **19** | `marketing_campaigns` | CRUD | CRUD | — | — | — | Segmentación de clientes y fidelización. |

*Leyenda: **C** = Insert/Create, **R** = Select/Read, **U** = Update, **D** = Delete, **—** = Sin acceso.*

---

## 🔒 4. Mecanismos de Seguridad Implementados

### 4.1 Funciones Auxiliares de Consulta de Rol
- `public.get_user_role(user_uuid)`: Consulta optimizada con fallback de metadatos JWT y tabla `profiles`.
- `public.has_role(VARIADIC allowed_roles)`: Valida pertenencia a un conjunto de roles en $O(1)$ gracias a índices en `profiles(role)`.
- `public.is_admin_or_manager()`: Verificación rápida para áreas administrativas y financieras.

### 4.2 Restricción a Nivel de Base de Datos para Egresos de Caja
En la tabla `cash_expenses`, la política de inserción impone validación de contenido:
```sql
WITH CHECK (
  (SELECT public.has_role('admin', 'manager', 'cashier'))
  AND notes IS NOT NULL 
  AND length(trim(notes)) >= 3
)
```
Esto asegura que ningún retiro de caja se realice sin una justificación explicativa.

### 4.3 Trigger Anti-Escalamiento en `public.profiles`
El trigger `check_profile_escalation` intercepta cualquier intento de `UPDATE` en `profiles`. Si el usuario conectado no es `admin` o `manager`, cualquier modificación a las columnas `role`, `credit_limit` o `current_debt` genera una excepción `RAISE EXCEPTION` abortando la transacción.

### 4.4 Índices de Rendimiento RLS
Se indexaron todas las columnas utilizadas en predicados de seguridad y claves foráneas (`role`, `user_id`, `customer_id`, `opened_by`, `created_by`, `cash_register_id`, `table_id`, `kitchen_status`).

---

## 🚀 5. Instrucciones de Despliegue y Ejecución

### Opción A: Supabase Dashboard (Recomendada)
1. Inicia sesión en tu consola de **Supabase**.
2. Dirígete a la sección **SQL Editor**.
3. Abre y copia el contenido completo del archivo [`supabase/security_rls.sql`](../supabase/security_rls.sql).
4. Haz clic en **Run** (Ejecutar).
5. Verifica que todas las tablas tengan el distintivo **"RLS Enabled"** en el **Table Editor**.

### Opción B: Supabase CLI
Ejecuta en tu terminal local:
```bash
supabase db execute --file ./supabase/security_rls.sql
```
O incorpóralo como una migración estándar:
```bash
supabase migration new security_rls
# Copia el script a la nueva migración en supabase/migrations/
supabase db push
```

---

## ✅ 6. Pruebas y Verificación de Políticas

Para comprobar que las políticas están funcionando correctamente para un usuario específico, puedes simular la sesión en el SQL Editor con:

```sql
-- 1. Simular usuario con rol 'kitchen'
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "USER_UUID_COCINA", "app_metadata": {"role": "kitchen"}}';

-- 2. Debe permitir ver recetas
SELECT count(*) FROM public.recipes; -- Retorna filas exitosamente

-- 3. Debe denegar acceso a finanzas
SELECT count(*) FROM public.bills_payable; -- Retorna 0 filas (RLS bloquea lectura)
```
