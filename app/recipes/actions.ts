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
