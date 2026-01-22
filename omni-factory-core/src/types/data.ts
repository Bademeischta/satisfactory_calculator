/**
 * CORE DATA ARCHITECTURE
 * Strict schemas for Satisfactory 1.0 Data.
 */

export type ItemForm = 'SOLID' | 'LIQUID' | 'GAS';

export interface EnergyAttributes {
  energyValue: number; // MJ
  fuelConsumptionRate?: number; // Calculated or standard curve
}

export interface ItemDefinition {
  slug: string;
  name: string;
  description: string;
  stackSize: number;
  sinkPoints: number;
  form: ItemForm;
  energy?: EnergyAttributes;
  radioactiveDecay: number;
  iconPath: string;
}

export interface BuildingMetaData {
  slug: string;
  name: string;
  description: string;
  dimensions: {
    x: number; // width
    y: number; // depth
    z: number; // height
  };
  powerConsumption: {
    baseMW: number;
    // Exponent for overclocking: usually 1.321928 for production machines
    exponent: number;
    variable?: {
      minMW: number;
      maxMW: number;
      cycleTime: number; // For particle accelerator
    };
  };
  powerProduction: number; // MW (for generators)
  manufacturingSpeed: number; // Standard multiplier (usually 1.0)
  iconPath: string;
}

export interface RecipeItem {
  itemSlug: string;
  amount: number; // Items per minute (Standardized to 60s cycle)
  originalAmount?: number; // Raw amount from source
}

export interface RecipeDefinition {
  id: string;
  name: string;
  ingredients: RecipeItem[];
  products: RecipeItem[];
  duration: number; // Seconds
  producedIn: string[]; // Building slugs
  alternate: boolean;
  inMachine: boolean;
  variablePower?: boolean;
}
