/**
 * Utility function to modify user prompts based on selected style
 * This enhances the AI's ability to generate images in the specified style
 */

// Interface for style definition
interface StyleDefinition {
  id: string;
  name: string;
  modifier: string;
}

// Base style modifiers
const styleModifiers: Record<string, string> = {
  anime: "in anime style, vibrant colors, exaggerated features, anime aesthetic",
  meme: "humorous, bold text overlay, simplistic art, meme format, internet culture",
  a24: "dramatic lighting, cinematic composition, indie film aesthetic, A24 movie poster style",
  cyberpunk: "cyberpunk style, neon lights, dystopian future, technological, high contrast",
  vaporwave: "vaporwave aesthetic, retro, pastel colors, 80s and 90s nostalgia, digital surrealism"
};

/**
 * Enhances a user prompt with style-specific modifiers
 * @param styleId - The ID of the style to apply
 * @param userPrompt - The original user prompt
 * @returns A modified prompt with style-specific terms
 */
function promptModifier(styleId: string, userPrompt: string): string {
  const modifier = styleModifiers[styleId] || "";
  
  // Clean up user prompt and ensure there's no trailing comma or period
  const cleanedPrompt = userPrompt.trim().replace(/[,.]+$/, "");
  
  // If no modifier is available, return the original prompt
  if (!modifier) {
    return cleanedPrompt;
  }
  
  // Combine the user prompt with the style modifier
  return `${cleanedPrompt}, ${modifier}`;
}

/**
 * Creates a complete instruction for image generation
 * Combines the user prompt with style modifiers and additional instructions
 */
function createGenerationInstruction(
  styleId: string, 
  userPrompt: string, 
  additionalInstructions?: string
): string {
  // Get the modified prompt with style
  const styledPrompt = promptModifier(styleId, userPrompt);
  
  // Add any additional instructions (like quality boosters, etc.)
  const qualityInstructions = "high quality, detailed, 4K";
  const instructions = additionalInstructions 
    ? `${qualityInstructions}, ${additionalInstructions}` 
    : qualityInstructions;
  
  return `${styledPrompt}, ${instructions}`;
}

export { promptModifier, createGenerationInstruction, styleModifiers };