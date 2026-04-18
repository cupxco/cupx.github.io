/**
 * HOOK: useKeyboardNav
 * Handles 2D grid navigation using Arrow keys and selection clearing with Escape.
 */
function useKeyboardNav(elements, selectedElement, setSelectedElement) {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Handle Escape regardless of whether an element is focused
      if (e.key === 'Escape') {
        setSelectedElement(null);
        return;
      }

      // 2. If nothing is selected, arrows have no starting point
      if (!selectedElement) return;

      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (!keys.includes(e.key)) return;

      // Prevent page scrolling when navigating the table
      e.preventDefault();

      /**
       * Helper to get normalized grid coordinates.
       * Matches the logic in TableGrid:
       * - Standard: Period (1-7), Group (1-18)
       * - Lanthanides: Row 8, Col (3-17)
       * - Actinides: Row 9, Col (3-17)
       */
      const getCoords = (el) => {
        if (el.category === 'lanthanide') {
          return { row: 8, col: el.atomicNumber - 57 + 3 };
        }
        if (el.category === 'actinide') {
          return { row: 9, col: el.atomicNumber - 89 + 3 };
        }
        return { row: el.period, col: el.group };
      };

      const current = getCoords(selectedElement);
      let targetRow = current.row;
      let targetCol = current.col;

      // 3. Calculate target coordinates
      switch (e.key) {
        case 'ArrowUp':    targetRow--; break;
        case 'ArrowDown':  targetRow++; break;
        case 'ArrowLeft':  targetCol--; break;
        case 'ArrowRight': targetCol++; break;
      }

      // 4. Find the element occupying that specific grid cell
      // Note: This ignores "empty" cells (like the gap in Period 1)
      const found = elements.find(el => {
        const coords = getCoords(el);
        return coords.row === targetRow && coords.col === targetCol;
      });

      if (found) {
        setSelectedElement(found);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup listeners on unmount or when dependencies change
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [elements, selectedElement, setSelectedElement]);
}
