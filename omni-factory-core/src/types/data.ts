export interface ItemDefinition {
  slug: string; // e.g., 'desc_iron_plate'
  name: string;
  description: string;
  stackSize: number;
  sinkPoints: number;
  energyValue: number; // MJ
  radioactiveDecay: number;
  liquid: boolean;
  iconPath: string; // /icons/desc_iron_plate.png
}

export interface BuildingDefinition {
  slug: string; // e.g., 'build_constructor'
  name: string;
  description: string;
  powerConsumption: number; // MW
  powerProduction: number; // MW (for generators)
  manufacturingSpeed: number; // multiplier (usually 1.0)
  dimensions: {
    x: number;
    y: number;
    z: number;
  };
  iconPath: string;
}

export interface RecipeItem {
  itemSlug: string;
  amount: number; // Items per minute (calculated from duration)
  originalAmount?: number; // Raw amount from Docs.json
}

export interface RecipeDefinition {
  id: string; // e.g., 'recipe_iron_plate'
  name: string;
  ingredients: RecipeItem[];
  products: RecipeItem[];
  duration: number; // seconds
  producedIn: string[]; // Building slugs
  alternate: boolean;
  inMachine: boolean; // True if it's a machine process, False if handbook/buildgun
}

export interface DataRegistry {
  items: Record<string, ItemDefinition>;
  buildings: Record<string, BuildingDefinition>;
  recipes: Record<string, RecipeDefinition>;
}
