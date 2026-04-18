/**
 * ComparePanel Component
 * /components/ComparePanel.jsx
 */

const ComparePanel = ({ compareList, onRemove, onClearAll }) => {
  const [isOpen, setIsOpen] = React.useState(true);

  if (!compareList || compareList.length === 0) return null;

  const numericProperties = [
    { label: "Atomic Mass", key: "atomicMass" },
    { label: "Electronegativity", key: "electronegativity" },
    { label: "Atomic Radius (pm)", key: "atomicRadius" },
    { label: "Melting Point (K)", key: "meltingPoint" },
    { label: "Boiling Point (K)", key: "boilingPoint" },
    { label: "Density (g/cm³)", key: "density" },
    { label: "Discovery Year", key: "yearDiscovered" }
  ];

  const stringProperties = [
    { label: "Category", key: "category" },
    { label: "Configuration", key: "electronConfiguration" }
  ];

  // Helper to determine the color coding for numeric comparisons
  const getComparisonColor = (propKey, value) => {
    if (compareList.length < 2 || value === null || value === undefined) return 'inherit';
    
    const values = compareList
      .map(el => parseFloat(el[propKey]))
      .filter(val => !isNaN(val));

    if (values.length < 2) return 'inherit';

    const max = Math.max(...values);
    const min = Math.min(...values);

    if (parseFloat(value) === max && max !== min) return 'rgba(76, 175, 80, 0.2)'; // Green tint
    if (parseFloat(value) === min && max !== min) return 'rgba(244, 67, 54, 0.2)'; // Red tint
    return 'inherit';
  };

  const styles = {
    panel: {
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '95%',
      maxWidth: '1000px',
      backgroundColor: '#111',
      border: '1px solid #333',
      borderBottom: 'none',
      borderRadius: '12px 12px 0 0',
      boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
      zIndex: 1000,
      maxHeight: isOpen ? '70vh' : '40px',
      transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      color: '#fff'
    },
    header: {
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer',
      backgroundColor: '#1a1a1a',
      borderBottom: '1px solid #333'
    },
    content: {
      padding: '20px',
      overflowY: 'auto',
      flex: 1
    },
    elementGrid: {
      display: 'grid',
      gridTemplateColumns: `repeat(${compareList.length}, 1fr)`,
      gap: '15px',
      marginBottom: '20px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '13px'
    },
    th: {
      textAlign: 'left',
      padding: '12px 8px',
      color: '#888',
      borderBottom: '1px solid #222',
      width: '150px',
      textTransform: 'uppercase',
      fontSize: '11px'
    },
    td: (bgColor) => ({
      padding: '12px 8px',
      borderBottom: '1px solid #222',
      textAlign: 'center',
      backgroundColor: bgColor,
      transition: 'background-color 0.3s ease'
    }),
    removeBtn: {
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid #444',
      color: '#ff4d4d',
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '10px',
      cursor: 'pointer',
      marginTop: '8px'
    }
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <span style={{ fontWeight: 'bold', color: '#00e5ff', fontSize: '14px' }}>
          COMPARISON DRAWER ({compareList.length}/3)
        </span>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); onClearAll(); }}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px' }}
          >
            Clear All
          </button>
          <span>{isOpen ? '▼' : '▲'}</span>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.elementGrid}>
          {compareList.map(el => (
            <div key={el.atomicNumber} style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '900', 
                color: el.cpkHexColor,
                textShadow: `0 0 10px ${el.cpkHexColor}44` 
              }}>
                {el.symbol}
              </div>
              <div style={{ fontSize: '11px', color: '#aaa' }}>{el.name}</div>
              <button style={styles.removeBtn} onClick={() => onRemove(el)}>Remove</button>
            </div>
          ))}
        </div>

        <table style={styles.table}>
          <tbody>
            {numericProperties.map(prop => (
              <tr key={prop.key}>
                <th style={styles.th}>{prop.label}</th>
                {compareList.map(el => (
                  <td key={el.atomicNumber} style={styles.td(getComparisonColor(prop.key, el[prop.key]))}>
                    {el[prop.key] !== null ? el[prop.key] : '--'}
                  </td>
                ))}
              </tr>
            ))}
            {stringProperties.map(prop => (
              <tr key={prop.key}>
                <th style={styles.th}>{prop.label}</th>
                {compareList.map(el => (
                  <td key={el.atomicNumber} style={styles.td('inherit')}>
                    <span style={{ fontSize: '11px', textTransform: prop.key === 'category' ? 'capitalize' : 'none' }}>
                      {el[prop.key]}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacking Logic via Style Media Query (Injected) */}
      <style>{`
        @media (max-width: 600px) {
          .element-grid { grid-template-columns: 1fr !important; }
          th { width: 100px !important; font-size: 9px !important; }
          td { font-size: 11px !important; }
        }
      `}</style>
    </div>
  );
};

export default ComparePanel;
