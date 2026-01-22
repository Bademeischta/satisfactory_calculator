import itemsData from '@/data/items.json';
import buildingsData from '@/data/buildings.json';
import recipesData from '@/data/recipes.json';
import { ItemDefinition, BuildingDefinition, RecipeDefinition } from '@/types/data';

// Cast to typed dictionaries
const ITEMS = itemsData as Record<string, ItemDefinition>;
const BUILDINGS = buildingsData as Record<string, BuildingDefinition>;
const RECIPES = recipesData as Record<string, RecipeDefinition>;

export class DB {
  static getRecipe(id: string): RecipeDefinition {
    const recipe = RECIPES[id];
    if (!recipe) {
      throw new Error(`[DB CRITICAL] Recipe ID not found: ${id}`);
    }
    return recipe;
  }

  static getItem(slug: string): ItemDefinition {
    const item = ITEMS[slug];
    if (!item) {
      // Don't crash immediately for icons, but warn? No, prompt said "LOUD ERRORS".
      throw new Error(`[DB CRITICAL] Item Slug not found: ${slug}`);
    }
    return item;
  }

  static getBuilding(slug: string): BuildingDefinition {
    const building = BUILDINGS[slug];
    if (!building) {
      throw new Error(`[DB CRITICAL] Building Slug not found: ${slug}`);
    }
    return building;
  }

  static getAllRecipes(): RecipeDefinition[] {
    return Object.values(RECIPES);
  }

  static getRecipesByProduct(itemSlug: string): RecipeDefinition[] {
    return Object.values(RECIPES).filter(r =>
      r.products.some(p => p.itemSlug === itemSlug)
    );
  }
}
