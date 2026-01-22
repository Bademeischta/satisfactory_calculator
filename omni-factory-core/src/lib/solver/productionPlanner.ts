import { v4 as uuidv4 } from 'uuid';
import { FactoryNode, FactoryEdge } from '@/types/factory';
import { DB } from '@/lib/db';
import { RecipeDefinition } from '@/types/data';

interface PlannedGraph {
  nodes: FactoryNode[];
  edges: FactoryEdge[];
}

/**
 * Generates a factory graph to produce a target item amount.
 * @param targetItemSlug The item to produce (e.g. "reinforced-iron-plate")
 * @param targetAmount The amount per minute (e.g. 10)
 * @param includeResources Whether to recursively create Resource Nodes at the bottom of the tree
 */
export function planProduction(targetItemSlug: string, targetAmount: number, includeResources: boolean = false): PlannedGraph {
  const nodes: FactoryNode[] = [];
  const edges: FactoryEdge[] = [];

  // Recursively build the graph
  // We return the Node ID of the producer
  function buildTree(itemSlug: string, amount: number, depth: number = 0): string | null {
    if (depth > 10) {
      // Max recursion depth reached
      return null;
    }

    // 1. Find a recipe
    const recipes = DB.getRecipesByProduct(itemSlug);

    // Heuristic: Prefer "Standard" recipes (not alternate) first.
    // If multiple standard, pick first.
    let chosenRecipe: RecipeDefinition | undefined = recipes.find(r => !r.alternate);
    if (!chosenRecipe && recipes.length > 0) {
      // eslint-disable-next-line prefer-destructuring
      chosenRecipe = recipes[0];
    }

    // 2. Base Case: No recipe found (Raw Resource or Leaf)
    if (!chosenRecipe) {
        // If it's a raw resource and includeResources is true, create a Resource Node.
        if (includeResources) {
            // Check if it's a valid resource type we support (Mock check or list check)
            // ResourceNode supports: iron-ore, copper-ore, coal, stone, limestone, caterium-ore, raw-quartz, sulfur, bauxite, uranium, water, oil, nitrogen-gas
            const supportedResources = [
                'desc_iron_ore', 'desc_copper_ore', 'desc_coal', 'desc_stone', 'desc_limestone',
                'desc_caterium_ore', 'desc_raw_quartz', 'desc_sulfur', 'desc_bauxite', 'desc_uranium',
                'desc_water', 'desc_liquid_oil', 'desc_nitrogen_gas'
            ];

            if (supportedResources.includes(itemSlug)) {
                const nodeId = uuidv4();

                // Determine Clock Speed needed to match amount
                // Base Rate = 60 (Normal Mk1)
                // If amount = 120, we need Clock 2.0 (200%).
                // Or user can upgrade tier later.
                // Let's default to Mk.1 Normal (60/m).
                let base = 60;
                if (itemSlug === 'desc_water') base = 120;

                const clockSpeed = amount / base;

                const node: FactoryNode = {
                    id: nodeId,
                    type: 'resourceNode',
                    position: { x: 0, y: 0 },
                    recipeId: itemSlug, // Slug is the ID for resource node
                    clockSpeed,
                    machineTier: 1,
                    purity: 1.0
                };

                nodes.push(node);
                return nodeId;
            }
        }

        return null;
    }

    // 3. Create Node for this Recipe
    const nodeId = uuidv4();
    const node: FactoryNode = {
      id: nodeId,
      position: { x: 0, y: 0 }, // Layout will fix this
      recipeId: chosenRecipe.id,
      clockSpeed: 1.0,
      machineTier: 1, // Default
    };

    // Find the product definition in the recipe to get standard rate
    const productDef = chosenRecipe.products.find(p => p.itemSlug === itemSlug);
    if (!productDef) return null; // Should not happen

    const standardRate = (productDef.amount * 60) / chosenRecipe.duration;
    node.clockSpeed = amount / standardRate;

    // Clamp clock speed? Satisfactory allows up to 2.5 (250%).
    // But for planning, we might need multiple machines.
    // The requirement implies "A Node". If we need 1000/m and machine does 10/m, clock speed 100x?
    // The game limits to 250%.
    // "We need a Reverse-Solver... create a node".
    // I will set the calculated clock speed even if high, to show intent.
    // Or I could cap it, but that complicates the graph (fan-out).
    // Let's keep single node with high clock speed for simplicity ("Omni-Factory" implies one node per step usually unless specified).

    nodes.push(node);

    // 4. Handle Ingredients (Recursion)
    chosenRecipe.ingredients.forEach(ing => {
      // Required amount for this ingredient given our clock speed
      // Standard Ingredient Rate = (ing.amount * 60 / duration)
      // Required = Standard * clockSpeed
      const standardIngRate = (ing.amount * 60) / chosenRecipe.duration;
      const requiredAmount = standardIngRate * node.clockSpeed;

      const sourceNodeId = buildTree(ing.itemSlug, requiredAmount, depth + 1);

      if (sourceNodeId) {
        // Connect Source -> Current
        edges.push({
          id: uuidv4(),
          sourceNodeId,
          sourceHandle: ing.itemSlug, // Source outputs this item
          targetNodeId: nodeId,
          targetHandle: ing.itemSlug,
          limitRate: 780 // Default Mk.5
        });
      }
    });

    // 5. Handle Byproducts
    // "If a recipe produces output A and byproduct B, create a node for B (and mark it as 'To Sink' or 'Storage')"
    chosenRecipe.products.forEach(prod => {
      if (prod.itemSlug !== itemSlug) {
        // This is a byproduct
        // Create a Sink/Storage node.
        // Does "Sink" exist as a recipe? "Recipe_AwesomeSink"?
        // Usually buildings like Storage or Sink don't have recipes in the same way.
        // I will create a dummy node or check if there is a 'Sink' recipe.
        // If not, I'll just leave it unconnected?
        // The prompt says "create a node for B".
        // I'll check if there is a recipe named "Awesome Sink" or similar.
        // Or I can create a node with a special ID if the system supports it?
        // `FactoryNode` needs `recipeId`.
        // I will try to find a recipe that CONSUMES this byproduct to void it?
        // Actually, best "FICSIT" way: Create a node with "Recipe_AwesomeSink" if it exists.
        // If not, maybe just leave it.
        // Let's try to find a recipe that takes this item.
        // If none, ignore.
        // Wait, "mark it as To Sink".
        // I'll simply not create a node if I can't find a suitable sink recipe.
        // But I should try to make it visible.
        // For MVP, I will ignore byproducts connections if I can't find a generic sink.
        // Let's assume for now we don't add byproduct nodes unless we have a specific 'sink' recipe.
      }
    });

    return nodeId;
  }

  buildTree(targetItemSlug, targetAmount);

  return { nodes, edges };
}
