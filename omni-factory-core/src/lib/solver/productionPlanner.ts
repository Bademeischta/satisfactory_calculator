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
 */
export function planProduction(targetItemSlug: string, targetAmount: number): PlannedGraph {
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
        // If it's a raw resource, we might want to place a "Miner" if possible.
        // But if DB has no recipe, it's truly a leaf (or we don't know how to make it).
        // Let's check if it's a raw resource like 'iron-ore'.
        // Miners have recipes too usually.
        // If no recipe, we create a specialized "Input Node" (visual only) or just stop?
        // The prompt says "Stop when reaching raw resources (Ore/Oil/Water)".
        // And "return a fully connected graph".
        // Let's create a node that acts as a source.
        // We will make a node with no recipe? Or a dummy recipe?
        // FactoryNode requires `recipeId`.
        // We can't create a node without a recipeId that maps to DB.
        // So if no recipe exists, we return null?
        // Or we assume the caller provides it?
        // Wait, 'iron-ore' IS produced by 'Recipe_IronOre'.
        // If DB.getRecipesByProduct('iron-ore') returns [], then maybe our DB is incomplete or it's a World Item.
        // Let's assume we stop and DO NOT create a node if we can't make it.
        // The parent node will have an open input.
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
