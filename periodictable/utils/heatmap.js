/**
 * UTILS: Periodic Table Helper Functions
 * Includes property range calculation and RdYlBu color interpolation.
 */

/**
 * Calculates the min and max values for a specific numeric property across the element set.
 * Ignores null, undefined, and non-numeric values.
 * * @param {Array<Object>} elements - The array of chemical element objects.
 * @param {string} propertyKey - The JSON key to analyze (e.g., 'density').
 * @returns {Object} { min: number, max: number }
 */
function getPropertyRange(elements, propertyKey) {
  const values = elements
    .map(el => parseFloat(el[propertyKey]))
    .filter(val => !isNaN(val) && val !== null && val !== undefined);

  if (values.length === 0) return { min: 0, max: 0 };

  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

/**
 * Interpolates a value on a diverging RdYlBu (Red-Yellow-Blue) scale.
 * 0% = #313695 (Blue) | 50% = #ffffbf (Yellow) | 100% = #a50026 (Red)
 * * @param {number|null} value - The property value of the element.
 * @param {number} min - The minimum value in the dataset.
 * @param {number} max - The maximum value in the dataset.
 * @returns {string} CSS Hex color string.
 */
function getHeatmapColor(value, min, max) {
  if (value === null || value === undefined || isNaN(parseFloat(value))) {
    return '#444444';
  }

  const val = parseFloat(value);
  // Normalize value between 0 and 1
  let t = (max === min) ? 0.5 : (val - min) / (max - min);
  t = Math.max(0, Math.min(1, t)); // Clamp between 0 and 1

  // Color Points (RGB)
  const blue = [49, 54, 149];    // #313695
  const yellow = [255, 255, 191]; // #ffffbf
  const red = [165, 0, 38];       // #a50026

  let r, g, b;

  if (t <= 0.5) {
    // Interpolate Blue to Yellow (first 50%)
    const factor = t * 2;
    r = Math.round(blue[0] + (yellow[0] - blue[0]) * factor);
    g = Math.round(blue[1] + (yellow[1] - blue[1]) * factor);
    b = Math.round(blue[2] + (yellow[2] - blue[2]) * factor);
  } else {
    // Interpolate Yellow to Red (last 50%)
    const factor = (t - 0.5) * 2;
    r = Math.round(yellow[0] + (red[0] - yellow[0]) * factor);
    g = Math.round(yellow[1] + (red[1] - yellow[1]) * factor);
    b = Math.round(yellow[2] + (red[2] - yellow[2]) * factor);
  }

  // Convert RGB to Hex
  const toHex = (c) => c.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
