-- ==============================================================================
-- BITES APP — SEED DATA GASTRONÓMICO COMPLETO
-- Archivo: supabase/seed_data.sql
-- Stack: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- 1. PROVEEDORES (suppliers)
INSERT INTO public.suppliers (id, name, contact_name, phone, email, tax_id, credit_days, notes)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Carnes Premium La Hacienda', 'Carlos Mendoza (Gerente Comercial)', '+58 414-555-1234', 'ventas@carneslahacienda.com', 'J-30495821-4', 15, 'Proveedor exclusivo de cortes vacunos Angus y pechugas de pollo frescas certificadas.'),
  ('11111111-1111-1111-1111-111111111102', 'Distribuidora Lácteos Los Andes', 'Valentina Rivas (Ejecutiva de Cuentas)', '+58 424-678-4321', 'pedidos@lacteoslosandes.com', 'J-40192837-1', 21, 'Distribuidor mayorista de quesos cheddar en bloque, mozzarella hilada y mantequilla.'),
  ('11111111-1111-1111-1111-111111111103', 'Panadería Artesanal San Pedro', 'Mateo Bianchi (Maestro Panadero)', '+58 412-987-6543', 'contacto@panaderiasanpedro.com', 'J-29384756-0', 7, 'Pan brioche artesanal horneado diariamente y harinas especiales.'),
  ('11111111-1111-1111-1111-111111111104', 'Agrícola Huerto Verde', 'Sofía Cardona (Directora de Producción)', '+58 416-234-8765', 'pedidos@huertoverde.com', 'J-50987612-8', 15, 'Hortalizas hidropónicas: lechuga romana, tomate chonto y cebolla morada.'),
  ('11111111-1111-1111-1111-111111111105', 'Importadora & Gourmet Del Pacífico', 'Andrés Velázquez (Importaciones)', '+58 414-111-9988', 'ventas@pacificogourmet.com', 'J-31234567-9', 30, 'Abarrotes: panko japonés, mostaza dijon, pepinillos encurtidos, alcaparras y aceite para freír.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  contact_name = EXCLUDED.contact_name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  tax_id = EXCLUDED.tax_id,
  credit_days = EXCLUDED.credit_days,
  notes = EXCLUDED.notes;

-- 2. INSUMOS E INGREDIENTES (ingredients)
INSERT INTO public.ingredients (id, code, name, category, unit, current_stock, min_stock, max_stock, cost_per_unit, location, expiration_date, supplier_id)
VALUES
  ('22222222-2222-2222-2222-222222222201', 'ING-CAR-01', 'Pechuga de Pollo', 'Carnes', 'gr', 25000, 5000, 50000, 0.0075, 'Cámara Fría Carnes #1', '2026-10-15', '11111111-1111-1111-1111-111111111101'),
  ('22222222-2222-2222-2222-222222222202', 'ING-CAR-02', 'Carne Molida Angus', 'Carnes', 'gr', 30000, 6000, 60000, 0.0110, 'Cámara Fría Carnes #1', '2026-10-12', '11111111-1111-1111-1111-111111111101'),
  ('22222222-2222-2222-2222-222222222203', 'ING-CAR-03', 'Tocino Ahumado', 'Carnes', 'gr', 12000, 2500, 25000, 0.0140, 'Cámara Fría Embutidos #2', '2026-11-01', '11111111-1111-1111-1111-111111111101'),
  ('22222222-2222-2222-2222-222222222204', 'ING-PAN-01', 'Pan Brioche', 'Panadería', 'und', 150, 30, 300, 0.60, 'Área de Panadería / Estante A', '2026-09-15', '11111111-1111-1111-1111-111111111103'),
  ('22222222-2222-2222-2222-222222222205', 'ING-ABA-01', 'Harina Especial', 'Abarrotes', 'gr', 25000, 5000, 50000, 0.0018, 'Bodega Seca / Estante B2', '2027-03-30', '11111111-1111-1111-1111-111111111103'),
  ('22222222-2222-2222-2222-222222222206', 'ING-LAC-01', 'Queso Cheddar Americano', 'Lácteos', 'gr', 15000, 3000, 30000, 0.0120, 'Refrigerador Línea Cocina #1', '2026-11-20', '11111111-1111-1111-1111-111111111102'),
  ('22222222-2222-2222-2222-222222222207', 'ING-LAC-02', 'Queso Mozzarella', 'Lácteos', 'gr', 12000, 2500, 25000, 0.0095, 'Refrigerador Línea Cocina #1', '2026-11-15', '11111111-1111-1111-1111-111111111102'),
  ('22222222-2222-2222-2222-222222222208', 'ING-LAC-03', 'Mantequilla Sin Sal', 'Lácteos', 'gr', 8000, 1500, 15000, 0.0090, 'Refrigerador Pastelería', '2026-12-01', '11111111-1111-1111-1111-111111111102'),
  ('22222222-2222-2222-2222-222222222209', 'ING-HUE-01', 'Huevo', 'Lácteos', 'und', 300, 60, 600, 0.15, 'Cámara Fría Lácteos', '2026-10-05', '11111111-1111-1111-1111-111111111102'),
  ('22222222-2222-2222-2222-222222222210', 'ING-VEG-01', 'Lechuga Romana', 'Vegetales', 'gr', 10000, 2000, 20000, 0.0030, 'Cámara de Verduras #3', '2026-09-18', '11111111-1111-1111-1111-111111111104'),
  ('22222222-2222-2222-2222-222222222211', 'ING-VEG-02', 'Tomate Chonto', 'Vegetales', 'gr', 12000, 2500, 25000, 0.0035, 'Cámara de Verduras #3', '2026-09-20', '11111111-1111-1111-1111-111111111104'),
  ('22222222-2222-2222-2222-222222222212', 'ING-VEG-03', 'Cebolla Morada', 'Vegetales', 'gr', 18000, 3500, 35000, 0.0025, 'Bodega de Secos y Hortalizas', '2026-10-30', '11111111-1111-1111-1111-111111111104'),
  ('22222222-2222-2222-2222-222222222213', 'ING-SAL-01', 'Mayonesa Base', 'Salsas y Condimentos', 'ml', 15000, 3000, 30000, 0.0045, 'Almacén de Salsas / Pasillo 1', '2027-01-10', '11111111-1111-1111-1111-111111111105'),
  ('22222222-2222-2222-2222-222222222214', 'ING-SAL-02', 'Mostaza Dijon', 'Salsas y Condimentos', 'ml', 6000, 1200, 12000, 0.0080, 'Almacén de Salsas / Pasillo 1', '2027-02-15', '11111111-1111-1111-1111-111111111105'),
  ('22222222-2222-2222-2222-222222222215', 'ING-ABA-02', 'Alcaparras', 'Abarrotes', 'gr', 4000, 800, 8000, 0.0150, 'Estante Encurtidos', '2027-06-01', '11111111-1111-1111-1111-111111111105'),
  ('22222222-2222-2222-2222-222222222216', 'ING-ABA-03', 'Pepinillos Agridulces', 'Abarrotes', 'gr', 10000, 2000, 20000, 0.0060, 'Estante Encurtidos', '2027-05-15', '11111111-1111-1111-1111-111111111105'),
  ('22222222-2222-2222-2222-222222222217', 'ING-CON-01', 'Papas Congeladas Bastón', 'Congelados', 'gr', 45000, 10000, 100000, 0.0032, 'Cámara Congelación -18°C', '2027-04-01', '11111111-1111-1111-1111-111111111105'),
  ('22222222-2222-2222-2222-222222222218', 'ING-ACE-01', 'Aceite para Freír', 'Aceites y Grasas', 'ml', 60000, 15000, 120000, 0.0028, 'Bodega de Aceites', '2027-08-01', '11111111-1111-1111-1111-111111111105'),
  ('22222222-2222-2222-2222-222222222219', 'ING-ABA-04', 'Panko Japonés', 'Abarrotes', 'gr', 12000, 2500, 25000, 0.0065, 'Bodega Seca / Estante B1', '2027-02-28', '11111111-1111-1111-1111-111111111105')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  unit = EXCLUDED.unit,
  current_stock = EXCLUDED.current_stock,
  min_stock = EXCLUDED.min_stock,
  max_stock = EXCLUDED.max_stock,
  cost_per_unit = EXCLUDED.cost_per_unit,
  location = EXCLUDED.location,
  expiration_date = EXCLUDED.expiration_date,
  supplier_id = EXCLUDED.supplier_id;

-- 3. SUB-RECETAS Y PLATOS FINALES (recipes)
INSERT INTO public.recipes (id, name, description, category, type, price, yield_quantity, yield_unit, cost_per_unit, difficulty, prep_time_minutes, cook_time_minutes, servings, is_published)
VALUES
  -- Sub-recetas
  ('33333333-3333-3333-3333-333333333301', 'Salsa Especial Bites', 'Emulsión secreta a base de mayonesa base, mostaza dijon suave, pepinillos encurtidos y alcaparras finamente picadas.', 'Salsas y Bases', 'sub_recipe', 0, 1000, 'ml', 0.00552, 'Fácil', 15, 0, 25, true),
  ('33333333-3333-3333-3333-333333333302', 'Pollo Crispy Empanizado', 'Pechuga fresca marinada, rebozada en harina especial, huevo de campo y panko japonés crocante.', 'Pre-elaboraciones', 'sub_recipe', 0, 1, 'und', 1.98, 'Media', 20, 8, 1, true),
  ('33333333-3333-3333-3333-333333333303', 'Cebolla Caramelizada', 'Cebollas moradas frescas en julianas confitadas lentamente con mantequilla sin sal y aceite.', 'Pre-elaboraciones', 'sub_recipe', 0, 500, 'gr', 0.007012, 'Fácil', 10, 45, 10, true),
  
  -- Platos Finales
  ('33333333-3333-3333-3333-333333333304', 'Hamburguesa Crispy Supreme', 'Pan brioche tostado, filete de pollo crispy extra crujiente, queso cheddar fundido, tocino ahumado crocante, lechuga romana y Salsa Especial Bites.', 'Hamburguesas', 'final_product', 12.50, 1, 'porcion', 3.85, 'Media', 10, 8, 1, true),
  ('33333333-3333-3333-3333-333333333305', 'Hamburguesa Doble Angus Clásica', 'Doble carne 100% Angus smash (300g total), doble porción de queso cheddar americano derretido, cebolla morada caramelizada, tomate chonto y lechuga romana en pan brioche.', 'Hamburguesas', 'final_product', 14.00, 1, 'porcion', 5.17, 'Media', 10, 10, 1, true),
  ('33333333-3333-3333-3333-333333333306', 'Papas Fritas Especiales Bites', 'Porción de papas bastón doradas y crocantes, queso cheddar derretido, trozos de tocino crujiente y Salsa Especial Bites.', 'Acompañamientos', 'final_product', 7.50, 1, 'porcion', 2.08, 'Fácil', 5, 6, 1, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  price = EXCLUDED.price,
  yield_quantity = EXCLUDED.yield_quantity,
  yield_unit = EXCLUDED.yield_unit,
  cost_per_unit = EXCLUDED.cost_per_unit,
  difficulty = EXCLUDED.difficulty,
  prep_time_minutes = EXCLUDED.prep_time_minutes,
  cook_time_minutes = EXCLUDED.cook_time_minutes,
  servings = EXCLUDED.servings,
  is_published = EXCLUDED.is_published;

-- 4. INSUMOS POR RECETA (recipe_ingredients)
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity)
VALUES
  -- Salsa Especial Bites
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222213', 700), -- Mayonesa Base (ml)
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222214', 150), -- Mostaza Dijon (ml)
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222216', 120), -- Pepinillos Agridulces (gr)
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222215', 30),  -- Alcaparras (gr)

  -- Pollo Crispy Empanizado
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201', 180), -- Pechuga de Pollo (gr)
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222205', 40),  -- Harina Especial (gr)
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222219', 50),  -- Panko Japonés (gr)
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222209', 1),   -- Huevo (und)
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222218', 30),  -- Aceite para Freír (ml)

  -- Cebolla Caramelizada
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222212', 1200), -- Cebolla Morada (gr)
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222208', 50),   -- Mantequilla Sin Sal (gr)
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222218', 20),   -- Aceite para Freír (ml)

  -- Hamburguesa Crispy Supreme (Directos)
  ('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222204', 1),   -- Pan Brioche (und)
  ('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222206', 40),  -- Queso Cheddar Americano (gr)
  ('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222203', 35),  -- Tocino Ahumado (gr)
  ('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222210', 25),  -- Lechuga Romana (gr)

  -- Hamburguesa Doble Angus Clásica (Directos)
  ('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222204', 1),   -- Pan Brioche (und)
  ('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222202', 300), -- Carne Molida Angus (gr)
  ('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222206', 60),  -- Queso Cheddar Americano (gr)
  ('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222210', 20),  -- Lechuga Romana (gr)
  ('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222211', 40),  -- Tomate Chonto (gr)

  -- Papas Fritas Especiales Bites (Directos)
  ('33333333-3333-3333-3333-333333333306', '22222222-2222-2222-2222-222222222217', 250), -- Papas Congeladas Bastón (gr)
  ('33333333-3333-3333-3333-333333333306', '22222222-2222-2222-2222-222222222218', 25),  -- Aceite para Freír (ml)
  ('33333333-3333-3333-3333-333333333306', '22222222-2222-2222-2222-222222222206', 50),  -- Queso Cheddar Americano (gr)
  ('33333333-3333-3333-3333-333333333306', '22222222-2222-2222-2222-222222222203', 30)   -- Tocino Ahumado (gr)
ON CONFLICT DO NOTHING;

-- 5. SUB-RECETAS ANIDADAS (recipe_sub_recipes)
INSERT INTO public.recipe_sub_recipes (parent_recipe_id, child_recipe_id, quantity)
VALUES
  -- Hamburguesa Crispy Supreme: 1 Pollo Crispy + 40ml Salsa Especial
  ('33333333-3333-3333-3333-333333333304', '33333333-3333-3333-3333-333333333302', 1),
  ('33333333-3333-3333-3333-333333333304', '33333333-3333-3333-3333-333333333301', 40),

  -- Hamburguesa Doble Angus Clásica: 50gr Cebolla Caramelizada
  ('33333333-3333-3333-3333-333333333305', '33333333-3333-3333-3333-333333333303', 50),

  -- Papas Fritas Especiales Bites: 35ml Salsa Especial
  ('33333333-3333-3333-3333-333333333306', '33333333-3333-3333-3333-333333333301', 35)
ON CONFLICT DO NOTHING;

-- 6. MESAS DE SALÓN (restaurant_tables)
INSERT INTO public.restaurant_tables (id, number, name, capacity, status)
VALUES
  ('44444444-4444-4444-4444-444444444401', '1', 'Mesa 1 - Salón Principal', 2, 'available'),
  ('44444444-4444-4444-4444-444444444402', '2', 'Mesa 2 - Salón Principal', 4, 'available'),
  ('44444444-4444-4444-4444-444444444403', '3', 'Mesa 3 - Ventanal Jardín', 4, 'available'),
  ('44444444-4444-4444-4444-444444444404', '4', 'Mesa 4 - Familiar / Centro', 6, 'available'),
  ('44444444-4444-4444-4444-444444444405', '5', 'Mesa 5 - Terraza Exterior', 2, 'available'),
  ('44444444-4444-4444-4444-444444444406', '6', 'Mesa 6 - Terraza VIP', 6, 'available')
ON CONFLICT (id) DO UPDATE SET
  number = EXCLUDED.number,
  name = EXCLUDED.name,
  capacity = EXCLUDED.capacity,
  status = EXCLUDED.status;

-- 7. MÉTODOS DE PAGO (payment_methods)
INSERT INTO public.payment_methods (id, name, currency, commission_percentage, commission_fixed, is_active)
VALUES
  ('55555555-5555-5555-5555-555555555501', 'Efectivo USD', 'USD', 0.0, 0.0, true),
  ('55555555-5555-5555-5555-555555555502', 'Punto de Venta / Tarjeta', 'USD', 1.5, 0.0, true),
  ('55555555-5555-5555-5555-555555555503', 'Zelle', 'USD', 0.0, 0.0, true),
  ('55555555-5555-5555-5555-555555555504', 'Pago Móvil', 'BS', 0.5, 0.0, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  currency = EXCLUDED.currency,
  commission_percentage = EXCLUDED.commission_percentage,
  commission_fixed = EXCLUDED.commission_fixed,
  is_active = EXCLUDED.is_active;
