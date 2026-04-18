/**
 * ControlPanel Component
 * /components/ControlPanel.jsx
 */

const ControlPanel = ({ 
  elements = [], 
  onFilterChange, 
  onHeatmapChange, 
  onTemperatureChange, 
  onSearch, 
  temperature,
  activeFilter 
}) => {
  
  const categories = [
    "noble gas", "alkali metal", "alkaline earth metal", "transition metal", 
    "post-transition metal", "metalloid", "nonmetal", "halogen", 
    "lanthanide", "actinide"
  ];

  const heatmapOptions = [
    { label: "None", value: null },
    { label: "Electronegativity", value: "electronegativity" },
    { label: "Atomic Radius", value: "atomicRadius" },
    { label: "Melting Point", value: "meltingPoint" },
    { label: "Boiling Point", value: "boilingPoint" },
    { label: "Crustal Abundance", value: "crustalAbundancePpm" },
    { label: "Density", value: "density" }
  ];

  // Calculate element states based on current temperature
  const stateCounts = React.useMemo(() => {
    const counts = { solid: 0, liquid: 0, gas: 0, unknown: 0 };
    elements.forEach(el => {
      if (el.meltingPoint === null || el.boilingPoint === null) {
        counts.unknown++;
      } else if (temperature <= el.meltingPoint) {
        counts.solid++;
      } else if (temperature >= el.boilingPoint) {
        counts.gas++;
      } else {
        counts.liquid++;
      }
    });
    return counts;
  }, [elements, temperature]);

  const panelStyle = {
    backgroundColor: '#1a1a1a',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    border: '1px solid #333',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    color: '#fff'
  };

  const sectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap'
  };

  const buttonRowStyle = {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '5px',
    scrollbarWidth: 'none', // Hide scrollbar for clean look
    WebkitOverflowScrolling: 'touch'
  };

  const inputStyle = {
    backgroundColor: '#000',
    border: '1px solid #444',
    color: '#fff',
    padding: '10px 15px',
    borderRadius: '6px',
    outline: 'none',
    width: '250px',
    fontSize: '14px'
  };

  const selectStyle = {
    ...inputStyle,
    width: '180px',
    cursor: 'pointer'
  };

  const getButtonStyle = (category) => ({
    padding: '8px 14px',
    borderRadius: '20px',
    border: `1px solid ${activeFilter === category ? '#00e5ff' : '#444'}`,
    backgroundColor: activeFilter === category ? 'rgba(0, 229, 255, 0.1)' : '#252525',
    color: activeFilter === category ? '#00e5ff' : '#ccc',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textTransform: 'capitalize'
  });

  return (
    <div style={panelStyle}>
      {/* Search and Heatmap Row */}
      <div style={sectionStyle}>
        <input 
          style={inputStyle}
          type="text" 
          placeholder="Search by name, symbol, or #..." 
          onChange={(e) => onSearch(e.target.value)}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', color: '#888' }}>Heatmap:</span>
          <select 
            style={selectStyle}
            onChange={(e) => onHeatmapChange(e.target.value === "null" ? null : e.target.value)}
          >
            {heatmapOptions.map(opt => (
              <option key={opt.label} value={String(opt.value)}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Filter Buttons Row */}
      <div style={buttonRowStyle}>
        <button 
          style={getButtonStyle(null)}
          onClick={() => onFilterChange(null)}
        >
          All Categories
        </button>
        {categories.map(cat => (
          <button 
            key={cat}
            style={getButtonStyle(cat)}
            onClick={() => onFilterChange(cat === activeFilter ? null : cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Temperature Control Row */}
      <div style={{ ...sectionStyle, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
          <span style={{ fontSize: '14px', minWidth: '60px' }}>{temperature} K</span>
          <input 
            type="range" 
            min="0" 
            max="6000" 
            step="10" 
            value={temperature}
            onChange={(e) => onTemperatureChange(parseInt(e.target.value))}
            style={{ 
              flex: 1, 
              accentColor: '#00e5ff',
              cursor: 'pointer'
            }}
          />
        </div>
        
        <div style={{ 
          fontSize: '13px', 
          color: '#aaa', 
          backgroundColor: '#252525', 
          padding: '8px 15px', 
          borderRadius: '6px' 
        }}>
          At this temperature: 
          <strong style={{ color: '#fff' }}> {stateCounts.solid}</strong> solid, 
          <strong style={{ color: '#00e5ff' }}> {stateCounts.liquid}</strong> liquid, 
          <strong style={{ color: '#ffa500' }}> {stateCounts.gas}</strong> gas
          {stateCounts.unknown > 0 && <span style={{fontSize: '11px'}}> ({stateCounts.unknown} unknown)</span>}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
