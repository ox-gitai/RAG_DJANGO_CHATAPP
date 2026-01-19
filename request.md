# PixelBlast Component Refinement Request

## Objective
Refine the `PixelBlast` background component to improve visual aesthetics and configurability, specifically focusing on dot density gradients and text customization.

## Detailed Requirements

### 1. Vertical Gradient Density
- **Goal:** Create a visual effect where the density of the background dots is highest at the top of the screen and gradually decreases towards the bottom.
- **Implementation:** 
  - Modify the fragment shader (`FRAGMENT_SRC`) to calculate a gradient based on the Y-coordinate (`gl_FragCoord.y`).
  - Use this gradient to modulate the `uDensity` or `feed` value.
  - The contrast should be significant (e.g., density factor ~1.5 at the top decreasing to ~0.2 at the bottom).

### 2. Text Configuration Props
- **Goal:** Allow the parent component to control the text displayed in the background.
- **New Props:**
  - `showText` (boolean): Controls whether the text is rendered. Default: `true`.
  - `displayText` (string): The actual text string to display. Default: `"DART"`.
  - `textFillDensity` (number): Controls the density of the dots *inside* the text characters (0.0 to 1.0). Default: `0.75`.

### 3. Text Rendering Logic
- **Goal:** Ensure the text appears "carved out" of dots rather than a solid block, respecting the requested density.
- **Implementation:**
  - **Texture Generation:** `createTextTexture` should render the text string based on the props. It should use the correct device pixel ratio (DPR) for sharp rendering (revert any previous low-res hacks).
  - **Shader Integration:** 
    - Pass `textFillDensity` as a uniform (`uTextFillDensity`) to the shader.
    - Inside the shader, use the text texture's value to modulate the grid. 
    - The logic should ensure that even if the background density is low (e.g., at the bottom of the screen), the text area uses the specified `textFillDensity`.
    - It should interact correctly with the Bayer dithering matrix to produce a clean, grid-aligned dot pattern for the letters.

### 4. Default Values
- **showText:** `true`
- **displayText:** `"DART"`
- **textFillDensity:** `0.75` (This creates a semi-sparse, stylish look for the text).

## Desired Outcome
The background should feature a dense field of digital particles at the top that fades out downwards. The word "DART" (or custom text) should appear at the bottom, formed by a grid of dots that are denser than the surrounding empty space but not completely solid, giving it a stylized, "matrix-like" appearance.
