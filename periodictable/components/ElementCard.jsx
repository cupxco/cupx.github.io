/**
 * ElementCard Component
 * /components/ElementCard.jsx
 */

const ElementCard = ({ element, isHighlighted, isDimmed, tintColor, onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  // Helper to convert Hex to RGBA with opacity
  const getBackgroundColor = () => {
    if (tintColor) return tintColor;
    const hex = element.cpkHexColor || '#333333';
    // Add 33 for ~20% alpha in hex (0.2 * 255 = 51, which is 33 in hex)
    return `${hex}33`;
  };

  const cardStyle = {
    width: '54px',
    height: '54px',
    borderRadius: '6px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: getBackgroundColor(),
    border: isHighlighted ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
    color: '#f0f0f0',
    opacity: isDimmed ? 0.12 : 1,
    pointerEvents: isDimmed ? 'none' : 'auto',
    transform: isHovered ? 'scale(1.15)' : 'scale(1)',
    zIndex: isHovered ? 10 : 1,
    boxSizing: 'border-box',
    userSelect: 'none'
  };

  const tooltipStyle = {
    position: 'absolute',
    bottom: '120%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '160px',
    backgroundColor: '#1a1a1a',
    border: `1px solid ${element.cpkHexColor || '#444'}`,
    borderRadius: '8px',
    padding: '10px',
    zIndex: 100,
    fontSize: '10px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    pointerEvents: 'none',
    display: isHovered ? 'block' : 'none',
    lineHeight: '1.4'
  };

  return (
    <div 
      style={{ position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip Card */}
      <div style={tooltipStyle}>
        <div style={{ color: element.cpkHexColor, fontWeight: 'bold', marginBottom: '4px', fontSize: '12px' }}>
          {element.name}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <span>Electroneg:</span> <span style={{ textAlign: 'right' }}>{element.electronegativity || 'N/A'}</span>
          <span>Radius:</span> <span style={{ textAlign: 'right' }}>{element.atomicRadius} pm</span>
          <span>Phase:</span> <span style={{ textAlign: 'right', textTransform: 'capitalize' }}>{element.phase}</span>
          <span>Discovered:</span> <span style={{ textAlign: 'right' }}>{element.yearDiscovered || 'Ancient'}</span>
        </div>
        <div style={{ marginTop: '6px', fontSize: '9px', borderTop: '1px solid #333', paddingTop: '4px', color: '#888' }}>
          {element.electronConfiguration}
        </div>
      </div>

      {/* Main Card */}
      <div style={cardStyle} onClick={() => onClick(element)}>
        {/* Top-left: Atomic Number */}
        <span style={{ position: 'absolute', top: '3px', left: '4px', fontSize: '10px', fontWeight: 'bold' }}>
          {element.atomicNumber}
        </span>

        {/* Center: Symbol */}
        <span style={{ fontSize: '20px', fontWeight: '900', color: element.cpkHexColor || '#fff' }}>
          {element.symbol}
        </span>

        {/* Bottom: Name */}
        <span style={{ position: 'absolute', bottom: '3px', width: '100%', textAlign: 'center', fontSize: '8px', whiteSpace: 'nowrap', overflow: 'hidden', padding: '0 2px' }}>
          {element.name}
        </span>

        {/* Bottom-right: Atomic Mass */}
        <span style={{ position: 'absolute', bottom: '3px', right: '4px', fontSize: '8px', opacity: 0.7 }}>
          {Math.round(element.atomicMass * 10) / 10}
        </span>
      </div>
    </div>
  );
};

export default ElementCard;
