import itemsData from '@/data/items.json';
import buildingsData from '@/data/buildings.json';
import recipesData from '@/data/recipes.json';
import { ItemDefinition, BuildingMetaData, RecipeDefinition } from '@/types/data';

// Cast to typed dictionaries
const ITEMS = itemsData as unknown as Record<string, ItemDefinition>;
const BUILDINGS = buildingsData as unknown as Record<string, BuildingMetaData>;
const RECIPES = recipesData as unknown as Record<string, RecipeDefinition>;

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

  static getBuilding(slug: string): BuildingMetaData {
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

  static getBuildCost(buildingSlug: string): { itemSlug: string; amount: number }[] {
    // Mock Data for standard buildings
    const costs: Record<string, { itemSlug: string; amount: number }[]> = {
      'build_smelter': [{ itemSlug: 'desc_iron_rod', amount: 5 }, { itemSlug: 'desc_wire', amount: 8 }],
      'build_constructor': [{ itemSlug: 'desc_reinforced_iron_plate', amount: 2 }, { itemSlug: 'desc_cable', amount: 2 }],
      'build_assembler': [{ itemSlug: 'desc_rotor', amount: 3 }, { itemSlug: 'desc_reinforced_iron_plate', amount: 4 }],
      'build_foundry': [{ itemSlug: 'desc_rotor', amount: 10 }, { itemSlug: 'desc_modular_frame', amount: 10 }],
      'build_refinery': [{ itemSlug: 'desc_motor', amount: 10 }, { itemSlug: 'desc_encased_industrial_beam', amount: 10 }],
      'build_manufacturer': [{ itemSlug: 'desc_heavy_modular_frame', amount: 10 }, { itemSlug: 'desc_computer', amount: 10 }, { itemSlug: 'desc_motor', amount: 10 }],
      'build_miner_mk1': [{ itemSlug: 'desc_iron_plate', amount: 10 }, { itemSlug: 'desc_concrete', amount: 10 }], // Assumes portable miner is handled or ignored
      'build_water_extractor': [{ itemSlug: 'desc_copper_sheet', amount: 20 }, { itemSlug: 'desc_reinforced_iron_plate', amount: 10 }, { itemSlug: 'desc_rotor', amount: 10 }],
      'build_oil_extractor': [{ itemSlug: 'desc_motor', amount: 15 }, { itemSlug: 'desc_encased_industrial_beam', amount: 20 }, { itemSlug: 'desc_cable', amount: 60 }],
      'build_storage_container_mk1': [{ itemSlug: 'desc_iron_plate', amount: 10 }, { itemSlug: 'desc_iron_rod', amount: 10 }],
      'build_conveyor_pole': [{ itemSlug: 'desc_concrete', amount: 1 }],
      // Belts (per segment approx?)
      'build_conveyor_belt_mk1': [{ itemSlug: 'desc_iron_plate', amount: 1 }],
      'build_conveyor_belt_mk2': [{ itemSlug: 'desc_reinforced_iron_plate', amount: 1 }],
      'build_conveyor_belt_mk3': [{ itemSlug: 'desc_steel_beam', amount: 1 }],
      'build_conveyor_belt_mk4': [{ itemSlug: 'desc_encased_industrial_beam', amount: 1 }],
      'build_conveyor_belt_mk5': [{ itemSlug: 'desc_alclad_aluminum_sheet', amount: 1 }],
    };

    return costs[buildingSlug] || [{ itemSlug: 'desc_iron_plate', amount: 10 }, { itemSlug: 'desc_wire', amount: 10 }];
  }
}
