'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeText } from '@/lib/security'

interface RecipeIngredientInput {
  ingredient_id: string
  quantity: number
}

interface RecipeSubRecipeInput {
  child_recipe_id: string
  quantity: number
}

export async function createRecipeAction(data: {
  name: string
  description?: string
  type: 'final_product' | 'sub_recipe'
  price?: number
  prep_time_minutes?: number
  cook_time_minutes?: number
  servings?: number
  yield_quantity?: number
  yield_unit?: string
  category?: string
  ingredients: RecipeIngredientInput[]
  sub_recipes: RecipeSubRecipeInput[]
}) {
  const supabase = await createClient()

  const name = sanitizeText(data.name)
  const description = data.description ? sanitizeText(data.description) : null
  const yield_unit = data.yield_unit ? sanitizeText(data.yield_unit) : 'porción'
  const category = data.category ? sanitizeText(data.category) : 'General'

  if (!name) {
    throw new Error('El nombre de la receta es obligatorio.')
  }

  // 1. Insertar receta base
  const { data: recipe, error: insertErr } = await supabase
    .from('recipes')
    .insert({
      name,
      description,
      type: data.type,
      price: data.type === 'final_product' ? data.price || 0 : null,
      prep_time_minutes: data.prep_time_minutes || 15,
      cook_time_minutes: data.cook_time_minutes || 15,
      servings: data.servings || 1,
      yield_quantity: data.yield_quantity || 1,
      yield_unit,
      category,
      is_published: true,
    })
    .select('id')
    .single()

  if (insertErr || !recipe) {
    throw new Error(`Error al crear receta: ${insertErr?.message}`)
  }

  const recipeId = recipe.id

  // 2. Insertar ingredientes directos en recipe_ingredients
  if (data.ingredients.length > 0) {
    const ingRows = data.ingredients.map((ing) => ({
      recipe_id: recipeId,
      ingredient_id: ing.ingredient_id,
      quantity: ing.quantity,
    }))

    const { error: ingErr } = await supabase
      .from('recipe_ingredients')
      .insert(ingRows)

    if (ingErr) {
      console.error('Error al asociar ingredientes:', ingErr.message)
    }
  }

  // 3. Insertar sub-recetas anidadas en recipe_sub_recipes
  if (data.sub_recipes.length > 0) {
    const subRows = data.sub_recipes.map((sub) => ({
      parent_recipe_id: recipeId,
      child_recipe_id: sub.child_recipe_id,
      quantity: sub.quantity,
    }))

    const { error: subErr } = await supabase
      .from('recipe_sub_recipes')
      .insert(subRows)

    if (subErr) {
      console.error('Error al asociar sub-recetas:', subErr.message)
    }
  }

  revalidatePath('/recipes')
  return { success: true, id: recipeId }
}

export async function deleteRecipeAction(recipeId: string) {
  const supabase = await createClient()

  if (!recipeId) {
    throw new Error('El identificador de la receta es obligatorio.')
  }

  // 1. Obtener la receta para validar existencia y nombre
  const { data: recipe, error: fetchErr } = await supabase
    .from('recipes')
    .select('id, name, type')
    .eq('id', recipeId)
    .single()

  if (fetchErr || !recipe) {
    throw new Error('La receta no existe o ya fue eliminada.')
  }

  // 2. Si es una sub-receta, comprobar si otras recetas la tienen como insumo dependiente
  const { data: childUsages } = await supabase
    .from('recipe_sub_recipes')
    .select('parent_recipe_id')
    .eq('child_recipe_id', recipeId)

  if (childUsages && childUsages.length > 0) {
    throw new Error(
      `No se puede eliminar "${recipe.name}" porque está vinculada como sub-receta en ${childUsages.length} preparación(es). Desvincúlala primero de esas recetas.`
    )
  }

  // 3. Desvincular ingredientes directos asociados
  await supabase
    .from('recipe_ingredients')
    .delete()
    .eq('recipe_id', recipeId)

  // 4. Desvincular sub-recetas que esta receta consumía
  await supabase
    .from('recipe_sub_recipes')
    .delete()
    .eq('parent_recipe_id', recipeId)

  // 5. Intentar eliminar la receta
  const { error: delErr } = await supabase
    .from('recipes')
    .delete()
    .eq('id', recipeId)

  if (delErr) {
    // Si falla por integridad referencial (p. ej. tiene comandas en order_items), se despublica/archiva
    const { error: archiveErr } = await supabase
      .from('recipes')
      .update({ is_published: false })
      .eq('id', recipeId)

    if (archiveErr) {
      throw new Error(`Error al eliminar la receta: ${delErr.message}`)
    }

    revalidatePath('/recipes')
    revalidatePath('/pos')
    revalidatePath('/')
    return {
      success: true,
      archived: true,
      message: `La receta "${recipe.name}" cuenta con ventas históricas registradas, por lo que fue retirada del menú y archivada para proteger los reportes contables.`,
    }
  }

  revalidatePath('/recipes')
  revalidatePath('/pos')
  revalidatePath('/')
  return {
    success: true,
    archived: false,
    message: `La receta "${recipe.name}" fue eliminada exitosamente.`,
  }
}

