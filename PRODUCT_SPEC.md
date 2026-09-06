# 🍔 BITES APP — Documento Maestro de Producto, Arquitectura y Alcance (ERP Gastronómico)

> **Versión**: 1.0.0  
> **Tipo de Software**: ERP Gastronómico, Sistema POS y Back-Office de Gestión y Administración Integral de Restaurantes.  
> **Stack Tecnológico**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Supabase (PostgreSQL, Auth, Storage, Realtime).

---

## 🎯 1. Visión y Propósito del Producto

**Bites App** es una plataforma integral de gestión y administración para negocios gastronómicos (restaurantes, cocinas ocultas/dark kitchens, cafeterías y cadenas de comida). 

El sistema centraliza las operaciones clave del negocio:
1. **Control de costos en tiempo real** mediante escandallos avanzados con soporte para **sub-recetas anidadas** (salsas, marinados, masas).
2. **Operación de salón y cocina** con comandas digitales, control de mesas y Punto de Venta (POS).
3. **Control financiero estricto**, incluyendo arqueos de caja multi-moneda/método de pago, **egresos de dinero con notas de justificación** y estado de Pérdidas y Ganancias (P&L).
4. **Gestión de inventario con deducción automática por receta** y alertas de stock crítico.
5. **CRM y fidelización de clientes**, con cuentas de crédito, historial de consumo y campañas de comunicación.

---

## 👥 2. Roles y Accesos en el Back-Office

| Rol | Alcance y Permisos |
| :--- | :--- |
| **👑 Administrador / Dueño** | Acceso total: Dashboard P&L, métricas, configuración de comisiones, márgenes, costos, egresos y usuarios. |
| **💼 Gerente / Supervisor** | Gestión de inventario, compras, proveedores, cuentas por pagar, arqueos de caja y personal. |
| **🍳 Cocina / Chef** | Visualización de recetas/escandallos, monitor de comandas de cocina (KDS) y registro de mermas/lotes. |
| **💳 Cajero** | Apertura/cierre de caja, registro de ventas POS, cobros multi-método y **registro de egresos de caja con nota**. |
| **🍽️ Mesero** | Apertura de mesas, toma de comandas desde tablet/móvil y envío a cocina. |

---

## 📦 3. Desglose Exhaustivo de Módulos

### 📊 Módulo 1: Dashboard Ejecutivo & Alertas Inteligentes
- **Métricas Clave (KPIs)**:
  - Facturación neta diaria, semanal y mensual.
  - Ticket promedio por cliente / comanda.
  - Volumen de órdenes y platos más vendidos.
  - Utilidad neta en tiempo real ($\text{Ventas} - \text{Costos Insumos} - \text{Gastos Operativos}$).
- **Panel de Alertas Críticas**:
  - Insumos por debajo del stock mínimo.
  - Facturas a proveedores por vencer (próximos 7 días) o vencidas.
  - Alertas de mermas inusuales o descuadres en arqueos de caja.

---

### 🥫 Módulo 2: Inventario, Insumos & Proveedores
- **Catálogo de Insumos**:
  - Código único, categoría (Carnes, Lácteos, Vegetales, Salsas, Empaques, Bebidas), unidad de medida (`kg`, `gr`, `lt`, `ml`, `und`, `porcion`), ubicación física en almacén/cocina y fecha de caducidad.
  - Costo unitario actual y costo promedio ponderado.
  - Configuración de stock mínimo (alerta) y stock máximo.
- **Movimientos de Stock**:
  - Registro de Entradas (compras a proveedores).
  - Salidas automáticas por venta (según receta/escandallo).
  - Registro manual de **Mermas** (desperdicios, vencimientos, caídas) con motivo justificado.
  - Transferencias entre ubicaciones (ej. de Bodega a Cocina caliente).
- **Gestión de Proveedores**:
  - Directorio comercial, condiciones de pago, días de crédito y RIF/NIT/Tax ID.
  - Historial de compras por proveedor.

---

### 🍲 Módulo 3: Recetas, Sub-recetas & Escandallo Dinámico
- **Árbol de Composición Gastronómica (Recetas Anidadas)**:
  - **Sub-recetas / Pre-elaboraciones**: Recetas intermedias que se preparan por lotes (ej. *Salsa Especial Tártara*, *Pollo Crispy Marinado*, *Masa Madre*, *Cebolla Caramelizada*) con su rendimiento (`yield_quantity` y `yield_unit`).
  - **Platos Finales (Venta)**: Compuestos por una combinación de **Insumos directos** (Pan, Queso, Lechuga) + **Sub-recetas** (Pollo Crispy, Salsa Especial).
- **Costeo Dinámico en Cascada**:
  - Si el proveedor sube el precio de un insumo base (ej. aceite o huevos), el sistema **recalcula automáticamente el costo de la sub-receta** (Salsa Tártara) y, en consecuencia, **el costo y margen de ganancia de todos los platos finales que la utilicen**.
- **Cálculo de Platos Preparables**:
  - Identifica el insumo limitante e informa: *"Con el stock actual puedes preparar 35 Hamburguesas Crispy"*.

---

### 🖥️ Módulo 4: Punto de Venta (POS), Salón, Mesas & Comandas
- **Mapa de Mesas y Canales de Venta**:
  - Salón (Mesas con estados: Libre, Ocupada, Pidiendo, Facturada).
  - Venta directa / Para llevar (Takeaway).
  - Pedidos de Delivery.
- **Toma de Comandas & Cocina**:
  - Modificadores y notas por plato (ej. *"Término medio"*, *"Sin cebolla"*).
  - Enrutamiento de comandas a cocina y barra con estados (`En cocina` ➔ `Listo` ➔ `Servido`).
- **Cobro Multi-Método Dividido**:
  - Permite pagar una sola cuenta combinando múltiples formas de pago (ej. 20\$ en Efectivo + 15\$ por Zelle + restante por Tarjeta/POS).
- **Deducción de Inventario en Cascada**:
  - Al completar el cobro, el sistema deduce del stock los gramos exactos de los ingredientes y sub-recetas.

---

### 💰 Módulo 5: Caja, Egresos con Justificación, Bancos & Conciliación
- **Apertura y Cierre de Turno de Caja**:
  - Registro de fondo de caja inicial en efectivo.
- **💸 Egresos de Dinero / Retiros de Caja (Con Nota y Categoría)**:
  - Permite retirar dinero de caja durante el turno para compras de emergencia, propinas, pagos a proveedores menores o gastos varios.
  - Campos: Monto, moneda, responsable, categoría del egreso y **Nota detallada de justificación (en qué se difirió el gasto)**.
- **Arqueo y Conciliación Diaria**:
  - Comparativa en vivo: $\text{Saldo Esperado del Sistema} \text{ vs } \text{Saldo Físico Contado}$.
  $$\text{Efectivo Esperado} = \text{Fondo Inicial} + \text{Ventas Efectivo} - \text{Egresos con Nota}$$
  - Conciliación de cuentas digitales (Zelle, Pago Móvil, Lotes de Puntos de Venta) con deducción de comisiones bancarias configuradas.
- **Cuentas por Pagar a Proveedores (Bills Payable)**:
  - Facturas a crédito, fechas de vencimiento, pagos parciales y estado (`Pendiente`, `Pagado`, `Vencido`).

---

### 📉 Módulo 6: Resumen Financiero, Gastos & Estado P&L
- **Control de Gastos Operativos**:
  - **Gastos Fijos**: Alquiler del local, nómina fija, servicios básicos (agua, luz, gas, internet), licencias.
  - **Gastos Variables**: Mantenimiento, marketing, transporte, insumos imprevistos.
- **Estado de Pérdidas y Ganancias (P&L)**:
  $$\text{Utilidad Bruta} = \text{Ingresos por Ventas} - \text{Costo de Alimentos (Food Cost)}$$
  $$\text{Utilidad Neta} = \text{Utilidad Bruta} - \text{Gastos Fijos y Variables} - \text{Comisiones Bancarias}$$

---

### 👥 Módulo 7: CRM, Clientes & Créditos
- **Ficha del Cliente**:
  - Datos de contacto, preferencias, cumpleaños, total gastado y frecuencia de visitas.
- **Línea de Crédito / Cuentas Corrientes**:
  - Asignación de límite de crédito, registro de deuda actual e historial de abonos con comprobante.
- **Campañas de Marketing**:
  - Segmentación de clientes (ej. clientes inactivos hace 30 días, cumpleañeros del mes, clientes VIP).
  - Generador de mensajes promocionales vía SMS / WhatsApp.

---

### 🌐 Módulo 8: Portal Público & Delivery (Fase Futura)
- Menú digital interactivo con códigos QR por mesa.
- Módulo de pedidos online / delivery propio con checkout directo.

---

## 🗄️ 4. Estructura de Base de Datos Integrada

```
                        ┌──────────────┐
                        │   SUPPLIERS  │
                        └──────┬───────┘
                               │ 1:N
┌─────────────────┐     ┌──────▼───────┐     ┌───────────────────────┐
│   INGREDIENTS   ├────►│  RECIPES     ├────►│  RECIPE_SUB_RECIPES   │
└────────┬────────┘     │ (dish / base)│     │ (Composición anidada) │
         │              └──────┬───────┘     └───────────────────────┘
         │                     │ 1:N
┌────────▼────────┐     ┌──────▼───────┐     ┌───────────────────────┐
│INVENTORY_MOVEM. │     │ ORDER_ITEMS  │◄────┤       ORDERS          │
└─────────────────┘     └──────────────┘     │   (POS / Salón / Del) │
                                             └──────────┬────────────┘
                                                        │
┌─────────────────┐     ┌──────────────┐     ┌──────────▼────────────┐
│ CASH_REGISTERS  │◄────┤ CASH_EXPENSES│     │    ORDER_PAYMENTS     │
│ (Arqueos / Caja)│     │(Egresos/Nota)│     │  (Multi-método pago)  │
└─────────────────┘     └──────────────┘     └───────────────────────┘
```

---

## 🛣️ 5. Hoja de Ruta de Implementación

| Fase | Módulo Principal | Componentes a Entregar |
| :---: | :--- | :--- |
| **1** | **Layout & Inventario** | Sidebar Back-Office, CRUD de Insumos, alertas de stock mínimo y registro de mermas/entradas. |
| **2** | **Recetas & Sub-recetas** | Escandallo con costeo en cascada dinámico, margen de utilidad y cálculo de unidades preparables. |
| **3** | **POS, Salón & Egresos** | Punto de Venta, comandas de cocina, cobro multi-método, egresos de caja con nota y descuento automático de stock. |
| **4** | **Caja & Finanzas P&L** | Apertura/Arqueo de caja, conciliación Zelle/POS, cuentas por pagar y reporte P&L de utilidad neta. |
| **5** | **CRM & Métricas** | Dashboard analítico, créditos a clientes y campañas de fidelización. |
