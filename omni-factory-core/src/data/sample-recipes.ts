import { Recipe } from '@/types/factory';

export const RECIPE_DB: Record<string, Recipe> = {
  recipe_iron_ingot: {
    id: 'recipe_iron_ingot',
    name: 'Iron Ingot',
    ingredients: [{ itemSlug: 'desc_iron_ore', amount: 30 }],
    products: [{ itemSlug: 'desc_iron_ingot', amount: 30 }],
    duration: 2, // 60/30 = 2 seconds
    producedIn: ['build_smelter'],
  },
  recipe_iron_plate: {
    id: 'recipe_iron_plate',
    name: 'Iron Plate',
    ingredients: [{ itemSlug: 'desc_iron_ingot', amount: 30 }],
    products: [{ itemSlug: 'desc_iron_plate', amount: 20 }],
    duration: 3, // 60/20 = 3 seconds
    producedIn: ['build_constructor'],
  },
};
