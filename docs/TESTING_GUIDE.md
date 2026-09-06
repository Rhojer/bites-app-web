# 🧪 Guía de Pruebas Automatizadas y QA — Bites App Web

> **Versión**: 1.0.0  
> **Framework de Testing**: Vitest v5 + @testing-library/react + @testing-library/jest-dom + jsdom  
> **Entorno**: Next.js 16 (App Router), TypeScript, Supabase Mocking  

---

## 📋 Índice
1. [Visión General de la Suite de Pruebas](#-visión-general-de-la-suite-de-pruebas)
2. [Estructura del Directorio de Testing](#-estructura-del-directorio-de-testing)
3. [Reglas Críticas de Negocio Cubiertas](#-reglas-críticas-de-negocio-cubiertas)
   - [1. Costeo Dinámico de Recetas y Sub-recetas en Cascada](#1-costeo-dinámico-de-recetas-y-sub-recetas-en-cascada)
   - [2. Cálculo de Platos Preparables (Insumo Limitante)](#2-cálculo-de-platos-preparables-insumo-limitante)
   - [3. Procesamiento de POS y Deducción de Stock](#3-procesamiento-de-pos-y-deducción-de-stock)
   - [4. Arqueo de Caja y Egresos Justificados con Nota](#4-arqueo-de-caja-y-egresos-justificados-con-nota)
   - [5. Estado de Pérdidas y Ganancias (P&L)](#5-estado-de-pérdidas-y-ganancias-pl)
4. [Mocks de Supabase y Pruebas de Integración de Server Actions](#-mocks-de-supabase-y-pruebas-de-integración-de-server-actions)
5. [Comandos de Ejecución](#-comandos-de-ejecución)
6. [Guía para Desarrolladores: Añadir Nuevas Pruebas](#-guía-para-desarrolladores-añadir-nuevas-pruebas)

---

## 🎯 Visión General de la Suite de Pruebas

La suite de pruebas automatizadas de **Bites App Web** fue diseñada con un enfoque en la confiabilidad financiera, consistencia de inventario y robustez operativa del ERP gastronómico.

### Objetivos Principales:
- **Exactitud Financiera**: Garantizar que ningún descuadre de caja, error de food cost o fallo de cálculo en el P&L llegue a producción.
- **Trazabilidad de Stock**: Verificar que cada plato vendido descuente la cantidad exacta de ingredientes base, incluso a través de múltiples niveles de sub-recetas anidadas (ej. masa madre, salsas compuestas, marinados).
- **Control Antifraude**: Validar que los egresos de caja requieran obligatoriamente una nota descriptiva del gasto antes de autorizar la salida de efectivo.

---

## 📁 Estructura del Directorio de Testing

```
bites-app-web/
├── lib/
│   └── domain/                         # Lógica pura de dominio desacoplada y comprobable
│       ├── recipes.ts                  # Costeo en cascada y platos preparables
│       ├── pos.ts                      # Totales de orden, pagos divididos y deducción
│       ├── cash-register.ts            # Balance de caja, egresos con nota y arqueo
│       └── finances.ts                 # Estado de P&L, márgenes y comisiones
├── tests/
│   ├── mocks/
│   │   └── supabase.ts                 # Mock type-safe de Supabase Server Client
│   ├── unit/
│   │   ├── recipes-costing.test.ts     # Escandallo en cascada y margen %
│   │   ├── preparable-dishes.test.ts   # Insumo limitante (cuello de botella)
│   │   ├── pos-processing.test.ts      # Carrito, pagos multi-método y deducción
│   │   ├── cash-register.test.ts       # Validación de egresos y arqueo de turno
│   │   ├── pl-statement.test.ts        # Cálculo completo de P&L
│   │   └── pl-statement-component.test.tsx # Renderizado de componentes UI
│   └── integration/
│       ├── pos-checkout-flow.test.ts   # Flujo end-to-end de orden POS y stock
│       ├── cash-register-actions.test.ts # Server Action de egreso de caja
│       ├── recipes-actions.test.ts     # Server Action de creación de recetas
│       └── finances-actions.test.ts    # Server Actions de finanzas y facturas
├── vitest.config.mts                   # Configuración de Vitest con alias @/ y JSDOM
└── vitest.setup.ts                     # Setup de jest-dom matchers
```

---

## 🧠 Reglas Críticas de Negocio Cubiertas

### 1. Costeo Dinámico de Recetas y Sub-recetas en Cascada
- **Archivo de prueba**: [`tests/unit/recipes-costing.test.ts`](file:///c:/dev/bites-app-web/tests/unit/recipes-costing.test.ts)
- **Módulo**: [`lib/domain/recipes.ts`](file:///c:/dev/bites-app-web/lib/domain/recipes.ts)
- **Fórmulas Verificadas**:
  $$\text{Costo Unitario Sub-receta} = \frac{\sum (\text{Cantidad Insumo} \times \text{Costo Unitario}) + \sum (\text{Cantidad Sub-receta} \times \text{Costo Sub-receta})}{\text{Rendimiento de Lote (Yield)}}$$
  $$\text{Food Cost del Plato} = \sum \text{Insumos Directos} + \sum \text{Sub-recetas Anidadas}$$
  $$\text{Margen de Utilidad (\%)} = \frac{\text{Precio de Venta} - \text{Costo Total}}{\text{Precio de Venta}} \times 100$$
- **Casos de Prueba**:
  - Cálculo de sub-recetas de nivel 1 (Mayonesa Casera).
  - Cálculo de sub-recetas de nivel 2 (Salsa Tártara compuesta por Mayonesa Casera + Pepinillos).
  - Costeo de plato final (Hamburguesa Deluxe) con insumos directos y sub-receta.
  - Efecto cascada: aumento de precio de un insumo base (Aceite +100%) actualiza automáticamente el costo y margen de todos los platos derivados.
  - Prevención de ciclos de recursión infinita / dependencias circulares.

---

### 2. Cálculo de Platos Preparables (Insumo Limitante)
- **Archivo de prueba**: [`tests/unit/preparable-dishes.test.ts`](file:///c:/dev/bites-app-web/tests/unit/preparable-dishes.test.ts)
- **Módulo**: [`lib/domain/recipes.ts`](file:///c:/dev/bites-app-web/lib/domain/recipes.ts)
- **Fórmulas Verificadas**:
  $$\text{Porciones Preparables por Insumo } i = \left\lfloor \frac{\text{Stock Actual}_i}{\text{Requerimiento por Porción}_i} \right\rfloor$$
  $$\text{Platos Preparables Totales} = \min_{i} (\text{Porciones Preparables}_i)$$
- **Casos de Prueba**:
  - Detección del insumo limitante directo (ej. carne para tacos).
  - Detección de insumo limitante ubicado dentro de una sub-receta (ej. tomates dentro de salsa).
  - Caso borde con stock 0 de un insumo clave (resultado = 0 platos).
  - Caso borde con receta sin ingredientes asociados.

---

### 3. Procesamiento de POS y Deducción de Stock
- **Archivo de prueba**: [`tests/unit/pos-processing.test.ts`](file:///c:/dev/bites-app-web/tests/unit/pos-processing.test.ts) y [`tests/integration/pos-checkout-flow.test.ts`](file:///c:/dev/bites-app-web/tests/integration/pos-checkout-flow.test.ts)
- **Módulo**: [`lib/domain/pos.ts`](file:///c:/dev/bites-app-web/lib/domain/pos.ts) y [`app/pos/actions.ts`](file:///c:/dev/bites-app-web/app/pos/actions.ts)
- **Casos de Prueba**:
  - Cálculo de subtotales, descuentos e impuestos del carrito de compras.
  - Validación de cobro dividido multi-método (Efectivo + Tarjeta + Zelle = Total).
  - Deducción recursiva y exacta en gramos/unidades de inventario al completar la venta.
  - Generación de movimientos en `inventory_movements` con `type: 'sale_deduction'` para auditoría y trazabilidad.
  - Manejo de error al intentar procesar órdenes vacías.

---

### 4. Arqueo de Caja y Egresos Justificados con Nota
- **Archivo de prueba**: [`tests/unit/cash-register.test.ts`](file:///c:/dev/bites-app-web/tests/unit/cash-register.test.ts) y [`tests/integration/cash-register-actions.test.ts`](file:///c:/dev/bites-app-web/tests/integration/cash-register-actions.test.ts)
- **Módulo**: [`lib/domain/cash-register.ts`](file:///c:/dev/bites-app-web/lib/domain/cash-register.ts) y [`app/cash-register/actions.ts`](file:///c:/dev/bites-app-web/app/cash-register/actions.ts)
- **Fórmulas Verificadas**:
  $$\text{Saldo Esperado en Efectivo} = \text{Fondo Inicial} + \text{Ventas en Efectivo} - \text{Egresos con Nota}$$
  $$\text{Diferencia de Arqueo} = \text{Efectivo Físico Contado} - \text{Saldo Esperado}$$
- **Casos de Prueba**:
  - **Validación Antifraude**: Rechazo de retiros de dinero con monto <= 0 o sin nota descriptiva de justificación.
  - Conciliación de caja cuadrada (`balanced`), faltante (`deficit`) y sobrante (`surplus`).
  - Sincronización de egresos en `cash_expenses` y en el libro de gastos operativos `expenses`.

---

### 5. Estado de Pérdidas y Ganancias (P&L)
- **Archivo de prueba**: [`tests/unit/pl-statement.test.ts`](file:///c:/dev/bites-app-web/tests/unit/pl-statement.test.ts) y [`tests/unit/pl-statement-component.test.tsx`](file:///c:/dev/bites-app-web/tests/unit/pl-statement-component.test.tsx)
- **Módulo**: [`lib/domain/finances.ts`](file:///c:/dev/bites-app-web/lib/domain/finances.ts) y [`components/finances/pl-statement.tsx`](file:///c:/dev/bites-app-web/components/finances/pl-statement.tsx)
- **Estructura Contable del P&L**:
  $$\text{Ingresos Totales} = \sum \text{Ventas POS \& Salón}$$
  $$\text{Total Food Cost} = \text{Costo Insumos Recetas Vendidas} + \text{Costo de Mermas/Desperdicios}$$
  $$\text{Utilidad Bruta} = \text{Ingresos Totales} - \text{Total Food Cost}$$
  $$\text{Gastos Operativos (Opex)} = \text{Gastos Fijos} + \text{Gastos Variables}$$
  $$\text{Comisiones Pasarelas} = \sum (\text{Monto Transacción} \times \% \text{Comisión} + \text{Comisión Fija})$$
  $$\text{Utilidad Neta Real} = \text{Utilidad Bruta} - \text{Gastos Operativos} - \text{Comisiones Pasarelas}$$
- **Casos de Prueba**:
  - Cálculo de Food Cost directo o a partir de ingredientes de recetas dinámicas.
  - Inclusión de mermas justificadas en el costo total de alimentos.
  - Separación de gastos fijos (alquiler, nómina) vs variables (mantenimiento, compras imprevistas).
  - Deducción de comisiones bancarias y pasarelas de pago.
  - Indicadores de salud financiera gastronómica (Óptimo <= 32%, Crítico > 38%, etc.).
  - Resiliencia ante períodos sin ventas (0 revenue sin divisiones por cero).

---

## 🔌 Mocks de Supabase y Pruebas de Integración de Server Actions

Para probar las Server Actions de Next.js (`'use server'`) sin requerir una conexión activa a internet ni modificar la base de datos de producción, se implementó un mock en memoria de Supabase en [`tests/mocks/supabase.ts`](file:///c:/dev/bites-app-web/tests/mocks/supabase.ts).

### Capacidades del Mock:
- Soporte para `.from('tabla')`, `.select()`, `.insert()`, `.update()`, `.delete()`.
- Soporte para filtros encadenados (`.eq()`, `.limit()`, `.order()`, `.single()`).
- Almacenamiento en memoria accesible mediante `mockSupabase._dataStore` para aserciones de inserciones y modificaciones.
- Mock de `next/cache` (`revalidatePath`).

---

## 🚀 Comandos de Ejecución

En la raíz del proyecto (`c:\dev\bites-app-web`), ejecuta:

### Ejecutar todas las pruebas una vez (CI/CD):
```bash
npm run test
```

### Ejecutar pruebas en modo interactivo / watch (Desarrollo):
```bash
npm run test:watch
```

### Ejecutar un archivo de prueba específico:
```bash
npx vitest run tests/unit/recipes-costing.test.ts
```

### Ejecutar pruebas con reporte de cobertura:
```bash
npx vitest run --coverage
```

---

## 🛠️ Guía para Desarrolladores: Añadir Nuevas Pruebas

1. **Lógica de Cálculo**: Agrega la función pura en [`lib/domain/`](file:///c:/dev/bites-app-web/lib/domain/).
2. **Prueba Unitaria**: Crea un archivo `tests/unit/<nombre>.test.ts` importando la función de dominio.
3. **Prueba de Integración (Server Actions)**:
   - Importa `createMockSupabaseClient` de `../mocks/supabase`.
   - Inicializa el almacén de datos con las filas de prueba necesarias.
   - Ejecuta la Server Action y verifica tanto el resultado retornado como las mutaciones en `mockSupabase._dataStore`.
4. **Verificación**: Ejecuta `npm run test` y confirma que todas las pruebas pasen en verde.
