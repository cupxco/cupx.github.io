/**
 * TableGrid Component
 * /components/TableGrid.jsx
 */

const TableGrid = ({ 
  elements, 
  activeFilter, 
  heatmapProperty, 
  temperature, 
  onElementClick 
}) => {

  // 1. Heatmap Calculation: Find min/max for the selected property
  const heatmapRange = React.useMemo(() => {
    if (!heatmapProperty) return null;
    const values = elements
      .map(el => parseFloat(el[heatmapProperty]))
      .filter(val => !isNaN(val) && val !== null);
    
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }, [elements, heatmapProperty]);

  // 2. Helper: Interpolate color for heatmap (Blue to Red)
  const getHeatmapColor = (val) => {
    if (!heatmapRange || val === null || isNaN(parseFloat(val))) return 'rgba(60, 60, 60, 0.8)';
    const { min, max } = heatmapRange;
    const ratio = (parseFloat(val) - min) / (max - min);
    // RGB interpolation: Blue (0, 100, 255) to Red (255, 50, 50)
    const r = Math.floor(ratio * 255);
    const g = Math.floor((1 - ratio) * 100 + 50);
    const b = Math.floor((1 - ratio) * 255);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // 3. Helper: Determine phase-based tinting
  const getPhaseStyles = (el) => {
    if (el.meltingPoint === null || el.boilingPoint === null) {
      return { border: '1px dashed #555' };
    }
    
    // Solid
    if (temperature <= el.meltingPoint) {
      return { border: '1px solid rgba(255, 255, 255, 0.3)' };
    } 
    // Gas
    else if (temperature >= el.boilingPoint) {
      return { 
        background: 'rgba(255, 165, 0, 0.2)', // Orange tint
        border: '1px solid #ffa500' 
      };
    } 
    // Liquid
    else {
      return { 
        background: 'rgba(0, 229, 255, 0.2)', // Cyan tint
        border: '1px solid #00e5ff' 
      };
    }
  };

  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(18, minmax(65px, 1fr))',
    gridTemplateRows: 'repeat(9, minmax(75px, 1fr))',
    gap: '6px',
    padding: '20px',
    background: '#080808',
    borderRadius: '12px',
    maxWidth: '1300px',
    margin: '0 auto'
  };

  return (
    <div style={gridStyles}>
      {elements.map((el) => {
        // Positioning Logic
        let gridColumn = el.group;
        let gridRow = el.period;

        // Handle Lanthanides (57-71)
        if (el.category === 'lanthanide') {
          gridRow = 8;
          gridColumn = el.atomicNumber - 57 + 3;
        } 
        // Handle Actinides (89-103)
        else if (el.category === 'actinide') {
          gridRow = 9;
          gridColumn = el.atomicNumber - 89 + 3;
        }

        // Filtering & Dimming
        const isFilteredOut = activeFilter && el.category !== activeFilter;
        
        // Heatmap Logic
        const cellBackground = heatmapProperty 
          ? getHeatmapColor(el[heatmapProperty]) 
          : 'rgba(30, 30, 30, 0.9)';

        const cellStyles = {
          gridColumn,
          gridRow,
          background: cellBackground,
          opacity: isFilteredOut ? 0.15 : 1,
          filter: isFilteredOut ? 'grayscale(100%)' : 'none',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          borderRadius: '4px',
          position: 'relative',
          fontSize: '0.8rem',
          ...getPhaseStyles(el)
        };

        return (
          <div 
            key={el.symbol} 
            style={cellStyles}
            onClick={() => onElementClick(el)}
            onMouseEnter={(e) => {
                if(!isFilteredOut) {
                    e.currentTarget.style.transform = 'scale(1.15)';
                    e.currentTarget.style.zIndex = '10';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.4)';
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.zIndex = '1';
                e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={{ 
              position: 'absolute', 
              top: '4px', 
              left: '4px', 
              fontSize: '0.6rem', 
              color: '#888' 
            }}>
              {el.atomicNumber}
            </span>
            
            <strong style={{ 
              fontSize: '1.3rem', 
              color: heatmapProperty ? '#fff' : el.cpkHexColor 
            }}>
              {el.symbol}
            </strong>
            
            <span style={{ 
              fontSize: '0.55rem', 
              textAlign: 'center', 
              marginTop: '2px', 
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {el.name}
            </span>

            {heatmapProperty && (
               <span style={{ fontSize: '0.5rem', color: '#ccc', marginTop: '2px' }}>
                 {el[heatmapProperty]}
               </span>
            )}
          </div>
        );
      })}

      {/* Series Labels (Positioned manually in grid) */}
      <div style={{ gridRow: 8, gridColumn: '1/3', display: 'flex', alignItems: 'center', fontSize: '0.7rem', color: '#666' }}>
        LANTHANIDES
      </div>
      <div style={{ gridRow: 9, gridColumn: '1/3', display: 'flex', alignItems: 'center', fontSize: '0.7rem', color: '#666' }}>
        ACTINIDES
      </div>
    </div>
  );
};

export default TableGrid;
