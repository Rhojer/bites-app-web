/**
 * Seed Data Gastronómico para Bites App Web
 * Stack: Node.js (fetch nativo) -> Supabase REST API
 */

import fs from 'fs';

let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqvdopbegosjggkxamoo.supabase.co';
let AUTH_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdmRvcGJlZ29zamdna3hhbW9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzE2MTUxOSwiZXhwIjoyMTAyNzM3NTE5fQ.bkgn0lVGzl9hyVU7Yr4Tch3lMcUVyLW1nYecKSvh7Js';

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const matchUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
  if (matchUrl) SUPABASE_URL = matchUrl[1].trim();
  const matchService = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
  if (matchService) AUTH_KEY = matchService[1].trim();
}

const headers = {
  'apikey': AUTH_KEY,
  'Authorization': `Bearer ${AUTH_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation,resolution=merge-duplicates'
};

async function apiRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    data = text;
  }

  if (!response.ok) {
    throw new Error(`Error en API [${response.status} ${response.statusText}] ${options.method || 'GET'} ${endpoint}: ${JSON.stringify(data)}`);
  }

  return data;
}

async function seed() {
  console.log('🍔 ========================================================');
  console.log('   INICIANDO POBLADO DE DATOS (SEED DATA GASTRONÓMICO)');
  console.log('   Proyecto: Bites App Web');
  console.log('   URL:', SUPABASE_URL);
  console.log('========================================================\n');

  // --------------------------------------------------------------------------
  // 0. Limpieza previa (opcional / idempotencia)
  // --------------------------------------------------------------------------
  console.log('🧹 [1/6] Verificando y preparando entorno...');
  
  // --------------------------------------------------------------------------
  // 1. Proveedores (suppliers)
  // --------------------------------------------------------------------------
  console.log('📦 [2/6] Insertando Proveedores gastronómicos (suppliers)...');
  const suppliersPayload = [
    {
      name: 'Carnes Premium La Hacienda',
      contact_name: 'Carlos Mendoza (Gerente Comercial)',
      phone: '+58 414-555-1234',
      email: 'ventas@carneslahacienda.com',
      tax_id: 'J-30495821-4',
      credit_days: 15,
      notes: 'Proveedor exclusivo de cortes vacunos Angus y pechugas de pollo frescas certificadas con cadena de frío.'
    },
    {
      name: 'Distribuidora Lácteos Los Andes',
      contact_name: 'Valentina Rivas (Ejecutiva de Cuentas)',
      phone: '+58 424-678-4321',
      email: 'pedidos@lacteoslosandes.com',
      tax_id: 'J-40192837-1',
      credit_days: 21,
      notes: 'Distribuidor mayorista de quesos cheddar americanos en bloque, mozzarella hilada y mantequilla sin sal.'
    },
    {
      name: 'Panadería Artesanal San Pedro',
      contact_name: 'Mateo Bianchi (Maestro Panadero)',
      phone: '+58 412-987-6543',
      email: 'contacto@panaderiasanpedro.com',
      tax_id: 'J-29384756-0',
      credit_days: 7,
      notes: 'Pan brioche artesanal horneado con masa madre y harinas de fuerza con alto contenido proteico.'
    },
    {
      name: 'Agrícola Huerto Verde',
      contact_name: 'Sofía Cardona (Directora de Producción)',
      phone: '+58 416-234-8765',
      email: 'pedidos@huertoverde.com',
      tax_id: 'J-50987612-8',
      credit_days: 15,
      notes: 'Hortalizas hidropónicas de cultivo orgánico: lechuga romana crujiente, tomates chonto maduros y cebolla morada dulce.'
    },
    {
      name: 'Importadora & Gourmet Del Pacífico',
      contact_name: 'Andrés Velázquez (Importaciones)',
      phone: '+58 414-111-9988',
      email: 'ventas@pacificogourmet.com',
      tax_id: 'J-31234567-9',
      credit_days: 30,
      notes: 'Abarrotes finos: Panko japonés grado premium, mostaza dijon francesa, pepinillos encurtidos, alcaparras y aceite para freír de alto rendimiento.'
    }
  ];

  const createdSuppliers = await apiRequest('suppliers', {
    method: 'POST',
    body: JSON.stringify(suppliersPayload)
  });
  console.log(`   ✅ ${createdSuppliers.length} Proveedores creados exitosamente.`);

  const supplierMap = {};
  for (const s of createdSuppliers) {
    supplierMap[s.name] = s.id;
  }

  // --------------------------------------------------------------------------
  // 2. Insumos e Ingredientes (ingredients)
  // --------------------------------------------------------------------------
  console.log('\n🥫 [3/6] Insertando Insumos e Ingredientes base (ingredients)...');
  const ingredientsPayload = [
    // Carnes & Aves
    {
      code: 'ING-CAR-01',
      name: 'Pechuga de Pollo',
      category: 'Carnes',
      unit: 'gr',
      current_stock: 25000,
      min_stock: 5000,
      max_stock: 50000,
      cost_per_unit: 0.0075, // $7.50 / kg
      location: 'Cámara Fría Carnes #1',
      expiration_date: '2026-10-15',
      supplier_id: supplierMap['Carnes Premium La Hacienda']
    },
    {
      code: 'ING-CAR-02',
      name: 'Carne Molida Angus',
      category: 'Carnes',
      unit: 'gr',
      current_stock: 30000,
      min_stock: 6000,
      max_stock: 60000,
      cost_per_unit: 0.0110, // $11.00 / kg
      location: 'Cámara Fría Carnes #1',
      expiration_date: '2026-10-12',
      supplier_id: supplierMap['Carnes Premium La Hacienda']
    },
    {
      code: 'ING-CAR-03',
      name: 'Tocino Ahumado',
      category: 'Carnes',
      unit: 'gr',
      current_stock: 12000,
      min_stock: 2500,
      max_stock: 25000,
      cost_per_unit: 0.0140, // $14.00 / kg
      location: 'Cámara Fría Embutidos #2',
      expiration_date: '2026-11-01',
      supplier_id: supplierMap['Carnes Premium La Hacienda']
    },

    // Panadería
    {
      code: 'ING-PAN-01',
      name: 'Pan Brioche',
      category: 'Panadería',
      unit: 'und',
      current_stock: 150,
      min_stock: 30,
      max_stock: 300,
      cost_per_unit: 0.60, // $0.60 / unidad
      location: 'Área de Panadería / Estante A',
      expiration_date: '2026-09-15',
      supplier_id: supplierMap['Panadería Artesanal San Pedro']
    },
    {
      code: 'ING-ABA-01',
      name: 'Harina Especial',
      category: 'Abarrotes',
      unit: 'gr',
      current_stock: 25000,
      min_stock: 5000,
      max_stock: 50000,
      cost_per_unit: 0.0018, // $1.80 / kg
      location: 'Bodega Seca / Estante B2',
      expiration_date: '2027-03-30',
      supplier_id: supplierMap['Panadería Artesanal San Pedro']
    },

    // Lácteos & Huevos
    {
      code: 'ING-LAC-01',
      name: 'Queso Cheddar Americano',
      category: 'Lácteos',
      unit: 'gr',
      current_stock: 15000,
      min_stock: 3000,
      max_stock: 30000,
      cost_per_unit: 0.0120, // $12.00 / kg
      location: 'Refrigerador Línea Cocina #1',
      expiration_date: '2026-11-20',
      supplier_id: supplierMap['Distribuidora Lácteos Los Andes']
    },
    {
      code: 'ING-LAC-02',
      name: 'Queso Mozzarella',
      category: 'Lácteos',
      unit: 'gr',
      current_stock: 12000,
      min_stock: 2500,
      max_stock: 25000,
      cost_per_unit: 0.0095, // $9.50 / kg
      location: 'Refrigerador Línea Cocina #1',
      expiration_date: '2026-11-15',
      supplier_id: supplierMap['Distribuidora Lácteos Los Andes']
    },
    {
      code: 'ING-LAC-03',
      name: 'Mantequilla Sin Sal',
      category: 'Lácteos',
      unit: 'gr',
      current_stock: 8000,
      min_stock: 1500,
      max_stock: 15000,
      cost_per_unit: 0.0090, // $9.00 / kg
      location: 'Refrigerador Pastelería',
      expiration_date: '2026-12-01',
      supplier_id: supplierMap['Distribuidora Lácteos Los Andes']
    },
    {
      code: 'ING-HUE-01',
      name: 'Huevo',
      category: 'Lácteos',
      unit: 'und',
      current_stock: 300,
      min_stock: 60,
      max_stock: 600,
      cost_per_unit: 0.15, // $0.15 / unidad
      location: 'Cámara Fría Lácteos',
      expiration_date: '2026-10-05',
      supplier_id: supplierMap['Distribuidora Lácteos Los Andes']
    },

    // Vegetales
    {
      code: 'ING-VEG-01',
      name: 'Lechuga Romana',
      category: 'Vegetales',
      unit: 'gr',
      current_stock: 10000,
      min_stock: 2000,
      max_stock: 20000,
      cost_per_unit: 0.0030, // $3.00 / kg
      location: 'Cámara de Verduras #3',
      expiration_date: '2026-09-18',
      supplier_id: supplierMap['Agrícola Huerto Verde']
    },
    {
      code: 'ING-VEG-02',
      name: 'Tomate Chonto',
      category: 'Vegetales',
      unit: 'gr',
      current_stock: 12000,
      min_stock: 2500,
      max_stock: 25000,
      cost_per_unit: 0.0035, // $3.50 / kg
      location: 'Cámara de Verduras #3',
      expiration_date: '2026-09-20',
      supplier_id: supplierMap['Agrícola Huerto Verde']
    },
    {
      code: 'ING-VEG-03',
      name: 'Cebolla Morada',
      category: 'Vegetales',
      unit: 'gr',
      current_stock: 18000,
      min_stock: 3500,
      max_stock: 35000,
      cost_per_unit: 0.0025, // $2.50 / kg
      location: 'Bodega de Secos y Hortalizas',
      expiration_date: '2026-10-30',
      supplier_id: supplierMap['Agrícola Huerto Verde']
    },

    // Salsas, Condimentos, Congelados & Abarrotes Gourmet
    {
      code: 'ING-SAL-01',
      name: 'Mayonesa Base',
      category: 'Salsas y Condimentos',
      unit: 'ml',
      current_stock: 15000,
      min_stock: 3000,
      max_stock: 30000,
      cost_per_unit: 0.0045, // $4.50 / lt
      location: 'Almacén de Salsas / Pasillo 1',
      expiration_date: '2027-01-10',
      supplier_id: supplierMap['Importadora & Gourmet Del Pacífico']
    },
    {
      code: 'ING-SAL-02',
      name: 'Mostaza Dijon',
      category: 'Salsas y Condimentos',
      unit: 'ml',
      current_stock: 6000,
      min_stock: 1200,
      max_stock: 12000,
      cost_per_unit: 0.0080, // $8.00 / lt
      location: 'Almacén de Salsas / Pasillo 1',
      expiration_date: '2027-02-15',
      supplier_id: supplierMap['Importadora & Gourmet Del Pacífico']
    },
    {
      code: 'ING-ABA-02',
      name: 'Alcaparras',
      category: 'Abarrotes',
      unit: 'gr',
      current_stock: 4000,
      min_stock: 800,
      max_stock: 8000,
      cost_per_unit: 0.0150, // $15.00 / kg
      location: 'Estante Encurtidos',
      expiration_date: '2027-06-01',
      supplier_id: supplierMap['Importadora & Gourmet Del Pacífico']
    },
    {
      code: 'ING-ABA-03',
      name: 'Pepinillos Agridulces',
      category: 'Abarrotes',
      unit: 'gr',
      current_stock: 10000,
      min_stock: 2000,
      max_stock: 20000,
      cost_per_unit: 0.0060, // $6.00 / kg
      location: 'Estante Encurtidos',
      expiration_date: '2027-05-15',
      supplier_id: supplierMap['Importadora & Gourmet Del Pacífico']
    },
    {
      code: 'ING-CON-01',
      name: 'Papas Congeladas Bastón',
      category: 'Congelados',
      unit: 'gr',
      current_stock: 45000,
      min_stock: 10000,
      max_stock: 100000,
      cost_per_unit: 0.0032, // $3.20 / kg
      location: 'Cámara Congelación -18°C',
      expiration_date: '2027-04-01',
      supplier_id: supplierMap['Importadora & Gourmet Del Pacífico']
    },
    {
      code: 'ING-ACE-01',
      name: 'Aceite para Freír',
      category: 'Aceites y Grasas',
      unit: 'ml',
      current_stock: 60000,
      min_stock: 15000,
      max_stock: 120000,
      cost_per_unit: 0.0028, // $2.80 / lt
      location: 'Bodega de Aceites',
      expiration_date: '2027-08-01',
      supplier_id: supplierMap['Importadora & Gourmet Del Pacífico']
    },
    {
      code: 'ING-ABA-04',
      name: 'Panko Japonés',
      category: 'Abarrotes',
      unit: 'gr',
      current_stock: 12000,
      min_stock: 2500,
      max_stock: 25000,
      cost_per_unit: 0.0065, // $6.50 / kg
      location: 'Bodega Seca / Estante B1',
      expiration_date: '2027-02-28',
      supplier_id: supplierMap['Importadora & Gourmet Del Pacífico']
    }
  ];

  const createdIngredients = await apiRequest('ingredients', {
    method: 'POST',
    body: JSON.stringify(ingredientsPayload)
  });
  console.log(`   ✅ ${createdIngredients.length} Insumos e Ingredientes creados exitosamente.`);

  const ingMap = {};
  for (const ing of createdIngredients) {
    ingMap[ing.name] = ing;
  }

  // --------------------------------------------------------------------------
  // 3. Sub-recetas / Pre-elaboraciones (recipes con type='sub_recipe')
  // --------------------------------------------------------------------------
  console.log('\n🥣 [4/6] Insertando Sub-recetas y Pre-elaboraciones (recipes & recipe_ingredients)...');

  // Cálculos de costo unitario para sub-recetas:
  // 1. Salsa Especial Bites (1000 ml):
  //    - Mayonesa: 700 ml * 0.0045 = 3.15
  //    - Mostaza: 150 ml * 0.0080 = 1.20
  //    - Pepinillos: 120 gr * 0.0060 = 0.72
  //    - Alcaparras: 30 gr * 0.0150 = 0.45
  //    Total lote = 5.52 -> cost_per_unit = 5.52 / 1000 = 0.00552 / ml
  const salsaCostPerUnit = (700 * 0.0045 + 150 * 0.0080 + 120 * 0.0060 + 30 * 0.0150) / 1000;

  // 2. Pollo Crispy Empanizado (1 und):
  //    - Pechuga de Pollo: 180 gr * 0.0075 = 1.35
  //    - Harina Especial: 40 gr * 0.0018 = 0.072
  //    - Panko: 50 gr * 0.0065 = 0.325
  //    - Huevo: 1 und * 0.15 = 0.15
  //    - Aceite: 30 ml * 0.0028 = 0.084
  //    Total lote = 1.981 -> cost_per_unit = 1.981 / 1 = 1.981 / und
  const polloCostPerUnit = (180 * 0.0075 + 40 * 0.0018 + 50 * 0.0065 + 1 * 0.15 + 30 * 0.0028);

  // 3. Cebolla Caramelizada (500 gr):
  //    - Cebolla Morada: 1200 gr * 0.0025 = 3.00
  //    - Mantequilla: 50 gr * 0.0090 = 0.45
  //    - Aceite: 20 ml * 0.0028 = 0.056
  //    Total lote = 3.506 -> cost_per_unit = 3.506 / 500 = 0.007012 / gr
  const cebollaCostPerUnit = (1200 * 0.0025 + 50 * 0.0090 + 20 * 0.0028) / 500;

  const subRecipesPayload = [
    {
      name: 'Salsa Especial Bites',
      description: 'Emulsión secreta de la casa a base de mayonesa base, mostaza dijon suave, pepinillos encurtidos y alcaparras finamente picadas.',
      category: 'Salsas y Bases',
      type: 'sub_recipe',
      yield_quantity: 1000,
      yield_unit: 'ml',
      cost_per_unit: Number(salsaCostPerUnit.toFixed(6)),
      price: 0,
      difficulty: 'Fácil',
      prep_time_minutes: 15,
      cook_time_minutes: 0,
      servings: 25,
      is_published: true
    },
    {
      name: 'Pollo Crispy Empanizado',
      description: 'Pechuga fresca marinada, rebozada en harina especial, huevo de campo y panko japonés crocante, lista para fritura dorada.',
      category: 'Pre-elaboraciones',
      type: 'sub_recipe',
      yield_quantity: 1,
      yield_unit: 'und',
      cost_per_unit: Number(polloCostPerUnit.toFixed(4)),
      price: 0,
      difficulty: 'Media',
      prep_time_minutes: 20,
      cook_time_minutes: 8,
      servings: 1,
      is_published: true
    },
    {
      name: 'Cebolla Caramelizada',
      description: 'Cebollas moradas frescas en julianas confitadas lentamente con mantequilla sin sal y aceite hasta punto meloso.',
      category: 'Pre-elaboraciones',
      type: 'sub_recipe',
      yield_quantity: 500,
      yield_unit: 'gr',
      cost_per_unit: Number(cebollaCostPerUnit.toFixed(6)),
      price: 0,
      difficulty: 'Fácil',
      prep_time_minutes: 10,
      cook_time_minutes: 45,
      servings: 10,
      is_published: true
    }
  ];

  const createdSubRecipes = await apiRequest('recipes', {
    method: 'POST',
    body: JSON.stringify(subRecipesPayload)
  });
  console.log(`   ✅ ${createdSubRecipes.length} Sub-recetas creadas.`);

  const subRecipeMap = {};
  for (const s of createdSubRecipes) {
    subRecipeMap[s.name] = s;
  }

  // Inserción de recipe_ingredients para sub-recetas
  const subRecipeIngredientsPayload = [
    // Salsa Especial Bites (1000 ml)
    {
      recipe_id: subRecipeMap['Salsa Especial Bites'].id,
      ingredient_id: ingMap['Mayonesa Base'].id,
      quantity: 700
    },
    {
      recipe_id: subRecipeMap['Salsa Especial Bites'].id,
      ingredient_id: ingMap['Mostaza Dijon'].id,
      quantity: 150
    },
    {
      recipe_id: subRecipeMap['Salsa Especial Bites'].id,
      ingredient_id: ingMap['Pepinillos Agridulces'].id,
      quantity: 120
    },
    {
      recipe_id: subRecipeMap['Salsa Especial Bites'].id,
      ingredient_id: ingMap['Alcaparras'].id,
      quantity: 30
    },

    // Pollo Crispy Empanizado (1 und)
    {
      recipe_id: subRecipeMap['Pollo Crispy Empanizado'].id,
      ingredient_id: ingMap['Pechuga de Pollo'].id,
      quantity: 180
    },
    {
      recipe_id: subRecipeMap['Pollo Crispy Empanizado'].id,
      ingredient_id: ingMap['Harina Especial'].id,
      quantity: 40
    },
    {
      recipe_id: subRecipeMap['Pollo Crispy Empanizado'].id,
      ingredient_id: ingMap['Panko Japonés'].id,
      quantity: 50
    },
    {
      recipe_id: subRecipeMap['Pollo Crispy Empanizado'].id,
      ingredient_id: ingMap['Huevo'].id,
      quantity: 1
    },
    {
      recipe_id: subRecipeMap['Pollo Crispy Empanizado'].id,
      ingredient_id: ingMap['Aceite para Freír'].id,
      quantity: 30
    },

    // Cebolla Caramelizada (500 gr)
    {
      recipe_id: subRecipeMap['Cebolla Caramelizada'].id,
      ingredient_id: ingMap['Cebolla Morada'].id,
      quantity: 1200
    },
    {
      recipe_id: subRecipeMap['Cebolla Caramelizada'].id,
      ingredient_id: ingMap['Mantequilla Sin Sal'].id,
      quantity: 50
    },
    {
      recipe_id: subRecipeMap['Cebolla Caramelizada'].id,
      ingredient_id: ingMap['Aceite para Freír'].id,
      quantity: 20
    }
  ];

  const createdSubRecIngs = await apiRequest('recipe_ingredients', {
    method: 'POST',
    body: JSON.stringify(subRecipeIngredientsPayload)
  });
  console.log(`   ✅ ${createdSubRecIngs.length} Relaciones de ingredientes para Sub-recetas registradas.`);

  // --------------------------------------------------------------------------
  // 4. Platos Finales a la Venta (recipes con type='final_product')
  // --------------------------------------------------------------------------
  console.log('\n🍔 [5/6] Insertando Platos Finales a la Venta (recipes, recipe_ingredients & recipe_sub_recipes)...');

  // Cálculos de costo para Platos Finales:
  // 1. Hamburguesa Crispy Supreme:
  //    Directos: Pan (0.60) + Cheddar (40 * 0.0120 = 0.48) + Tocino (35 * 0.0140 = 0.49) + Lechuga (25 * 0.0030 = 0.075) = 1.645
  //    Subrecetas: Pollo Crispy (1 * 1.981 = 1.981) + Salsa Especial (40 * 0.00552 = 0.2208) = 2.2018
  //    Costo total = 3.8468 -> Venta $12.50
  const crispyCost = 1.645 + 2.2018;

  // 2. Hamburguesa Doble Angus Clásica:
  //    Directos: Pan (0.60) + Carne Angus (300 * 0.0110 = 3.30) + Cheddar (60 * 0.0120 = 0.72) + Lechuga (20 * 0.0030 = 0.06) + Tomate (40 * 0.0035 = 0.14) = 4.82
  //    Subrecetas: Cebolla Caramelizada (50 * 0.007012 = 0.3506) = 0.3506
  //    Costo total = 5.1706 -> Venta $14.00
  const dobleAngusCost = 4.82 + 0.3506;

  // 3. Papas Fritas Especiales Bites:
  //    Directos: Papas Bastón (250 * 0.0032 = 0.80) + Aceite (25 * 0.0028 = 0.07) + Cheddar (50 * 0.0120 = 0.60) + Tocino (30 * 0.0140 = 0.42) = 1.89
  //    Subrecetas: Salsa Especial (35 * 0.00552 = 0.1932) = 0.1932
  //    Costo total = 2.0832 -> Venta $7.50
  const papasCost = 1.89 + 0.1932;

  const finalDishesPayload = [
    {
      name: 'Hamburguesa Crispy Supreme',
      description: 'Pan brioche tostado con mantequilla, filete de pollo crispy extra crujiente, queso cheddar fundido, tocino ahumado crocante, lechuga romana y abundante Salsa Especial Bites.',
      category: 'Hamburguesas',
      type: 'final_product',
      price: 12.50,
      yield_quantity: 1,
      yield_unit: 'porcion',
      cost_per_unit: Number(crispyCost.toFixed(2)),
      difficulty: 'Media',
      prep_time_minutes: 10,
      cook_time_minutes: 8,
      servings: 1,
      is_published: true
    },
    {
      name: 'Hamburguesa Doble Angus Clásica',
      description: 'Doble carne 100% Angus smash (300g total), doble porción de queso cheddar americano derretido, cebolla morada caramelizada al punto, tomate chonto fresco y lechuga romana en pan brioche.',
      category: 'Hamburguesas',
      type: 'final_product',
      price: 14.00,
      yield_quantity: 1,
      yield_unit: 'porcion',
      cost_per_unit: Number(dobleAngusCost.toFixed(2)),
      difficulty: 'Media',
      prep_time_minutes: 10,
      cook_time_minutes: 10,
      servings: 1,
      is_published: true
    },
    {
      name: 'Papas Fritas Especiales Bites',
      description: 'Porción generosa de papas bastón doradas y crocantes, coronadas con queso cheddar derretido, trozos de tocino crujiente y bañadas con nuestra cremosa Salsa Especial Bites.',
      category: 'Acompañamientos',
      type: 'final_product',
      price: 7.50,
      yield_quantity: 1,
      yield_unit: 'porcion',
      cost_per_unit: Number(papasCost.toFixed(2)),
      difficulty: 'Fácil',
      prep_time_minutes: 5,
      cook_time_minutes: 6,
      servings: 1,
      is_published: true
    }
  ];

  const createdFinalDishes = await apiRequest('recipes', {
    method: 'POST',
    body: JSON.stringify(finalDishesPayload)
  });
  console.log(`   ✅ ${createdFinalDishes.length} Platos Finales a la Venta creados.`);

  const finalDishMap = {};
  for (const d of createdFinalDishes) {
    finalDishMap[d.name] = d;
  }

  // Relaciones directas con insumos para Platos Finales
  const finalDishIngredientsPayload = [
    // Hamburguesa Crispy Supreme (Directos)
    {
      recipe_id: finalDishMap['Hamburguesa Crispy Supreme'].id,
      ingredient_id: ingMap['Pan Brioche'].id,
      quantity: 1
    },
    {
      recipe_id: finalDishMap['Hamburguesa Crispy Supreme'].id,
      ingredient_id: ingMap['Queso Cheddar Americano'].id,
      quantity: 40
    },
    {
      recipe_id: finalDishMap['Hamburguesa Crispy Supreme'].id,
      ingredient_id: ingMap['Tocino Ahumado'].id,
      quantity: 35
    },
    {
      recipe_id: finalDishMap['Hamburguesa Crispy Supreme'].id,
      ingredient_id: ingMap['Lechuga Romana'].id,
      quantity: 25
    },

    // Hamburguesa Doble Angus Clásica (Directos)
    {
      recipe_id: finalDishMap['Hamburguesa Doble Angus Clásica'].id,
      ingredient_id: ingMap['Pan Brioche'].id,
      quantity: 1
    },
    {
      recipe_id: finalDishMap['Hamburguesa Doble Angus Clásica'].id,
      ingredient_id: ingMap['Carne Molida Angus'].id,
      quantity: 300
    },
    {
      recipe_id: finalDishMap['Hamburguesa Doble Angus Clásica'].id,
      ingredient_id: ingMap['Queso Cheddar Americano'].id,
      quantity: 60
    },
    {
      recipe_id: finalDishMap['Hamburguesa Doble Angus Clásica'].id,
      ingredient_id: ingMap['Lechuga Romana'].id,
      quantity: 20
    },
    {
      recipe_id: finalDishMap['Hamburguesa Doble Angus Clásica'].id,
      ingredient_id: ingMap['Tomate Chonto'].id,
      quantity: 40
    },

    // Papas Fritas Especiales Bites (Directos)
    {
      recipe_id: finalDishMap['Papas Fritas Especiales Bites'].id,
      ingredient_id: ingMap['Papas Congeladas Bastón'].id,
      quantity: 250
    },
    {
      recipe_id: finalDishMap['Papas Fritas Especiales Bites'].id,
      ingredient_id: ingMap['Aceite para Freír'].id,
      quantity: 25
    },
    {
      recipe_id: finalDishMap['Papas Fritas Especiales Bites'].id,
      ingredient_id: ingMap['Queso Cheddar Americano'].id,
      quantity: 50
    },
    {
      recipe_id: finalDishMap['Papas Fritas Especiales Bites'].id,
      ingredient_id: ingMap['Tocino Ahumado'].id,
      quantity: 30
    }
  ];

  const createdFinalRecIngs = await apiRequest('recipe_ingredients', {
    method: 'POST',
    body: JSON.stringify(finalDishIngredientsPayload)
  });
  console.log(`   ✅ ${createdFinalRecIngs.length} Relaciones de insumos directos para Platos Finales registradas.`);

  // Relaciones de Sub-recetas para Platos Finales (recipe_sub_recipes)
  const finalDishSubRecipesPayload = [
    // Hamburguesa Crispy Supreme: 1 Pollo Crispy Empanizado + 40ml Salsa Especial Bites
    {
      parent_recipe_id: finalDishMap['Hamburguesa Crispy Supreme'].id,
      child_recipe_id: subRecipeMap['Pollo Crispy Empanizado'].id,
      quantity: 1
    },
    {
      parent_recipe_id: finalDishMap['Hamburguesa Crispy Supreme'].id,
      child_recipe_id: subRecipeMap['Salsa Especial Bites'].id,
      quantity: 40
    },

    // Hamburguesa Doble Angus Clásica: 50gr Cebolla Caramelizada
    {
      parent_recipe_id: finalDishMap['Hamburguesa Doble Angus Clásica'].id,
      child_recipe_id: subRecipeMap['Cebolla Caramelizada'].id,
      quantity: 50
    },

    // Papas Fritas Especiales Bites: 35ml Salsa Especial Bites
    {
      parent_recipe_id: finalDishMap['Papas Fritas Especiales Bites'].id,
      child_recipe_id: subRecipeMap['Salsa Especial Bites'].id,
      quantity: 35
    }
  ];

  const createdFinalRecSubs = await apiRequest('recipe_sub_recipes', {
    method: 'POST',
    body: JSON.stringify(finalDishSubRecipesPayload)
  });
  console.log(`   ✅ ${createdFinalRecSubs.length} Relaciones de Sub-recetas para Platos Finales registradas.`);

  // --------------------------------------------------------------------------
  // 5. Mesas de Salón (restaurant_tables)
  // --------------------------------------------------------------------------
  console.log('\n🪑 [6/6] Insertando Mesas de Salón (restaurant_tables)...');
  const tablesPayload = [
    {
      number: '1',
      name: 'Mesa 1 - Salón Principal',
      capacity: 2,
      status: 'available'
    },
    {
      number: '2',
      name: 'Mesa 2 - Salón Principal',
      capacity: 4,
      status: 'available'
    },
    {
      number: '3',
      name: 'Mesa 3 - Ventanal Jardín',
      capacity: 4,
      status: 'available'
    },
    {
      number: '4',
      name: 'Mesa 4 - Familiar / Centro',
      capacity: 6,
      status: 'available'
    },
    {
      number: '5',
      name: 'Mesa 5 - Terraza Exterior',
      capacity: 2,
      status: 'available'
    },
    {
      number: '6',
      name: 'Mesa 6 - Terraza VIP',
      capacity: 6,
      status: 'available'
    }
  ];

  const createdTables = await apiRequest('restaurant_tables', {
    method: 'POST',
    body: JSON.stringify(tablesPayload)
  });
  console.log(`   ✅ ${createdTables.length} Mesas registradas exitosamente.`);

  // --------------------------------------------------------------------------
  // Extra: Métodos de pago para asegurar operación POS al 100%
  // --------------------------------------------------------------------------
  const currentPayments = await apiRequest('payment_methods?select=*');
  if (!currentPayments || currentPayments.length === 0) {
    console.log('\n💳 Configurando Métodos de Pago estándar...');
    const paymentMethodsPayload = [
      { name: 'Efectivo USD', currency: 'USD', commission_percentage: 0, commission_fixed: 0, is_active: true },
      { name: 'Punto de Venta / Tarjeta', currency: 'USD', commission_percentage: 1.5, commission_fixed: 0, is_active: true },
      { name: 'Zelle', currency: 'USD', commission_percentage: 0, commission_fixed: 0, is_active: true },
      { name: 'Pago Móvil', currency: 'BS', commission_percentage: 0.5, commission_fixed: 0, is_active: true }
    ];
    await apiRequest('payment_methods', {
      method: 'POST',
      body: JSON.stringify(paymentMethodsPayload)
    });
    console.log('   ✅ Métodos de pago creados.');
  }

  // --------------------------------------------------------------------------
  // Resumen Final
  // --------------------------------------------------------------------------
  console.log('\n========================================================');
  console.log('✨ RESUMEN GENERAL DE SEED DATA INSERTADO CON ÉXITO:');
  console.log('========================================================');
  console.log(`🏢 Proveedores:       ${createdSuppliers.length}`);
  console.log(`🥫 Insumos:           ${createdIngredients.length}`);
  console.log(`🥣 Sub-recetas:       ${createdSubRecipes.length}`);
  console.log(`🍔 Platos Finales:    ${createdFinalDishes.length}`);
  console.log(`🔗 Enlaces Rec-Ing:   ${createdSubRecIngs.length + createdFinalRecIngs.length}`);
  console.log(`🔗 Enlaces Rec-Sub:   ${createdFinalRecSubs.length}`);
  console.log(`🪑 Mesas de Salón:    ${createdTables.length}`);
  console.log('========================================================\n');
}

seed().catch((err) => {
  console.error('\n❌ ERROR FATAL EN SEED SCRIPT:', err);
  process.exit(1);
});
