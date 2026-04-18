/**
 * DetailModal Component
 * /components/DetailModal.jsx
 */

const DetailModal = ({ element, onClose, onAddToCompare }) => {
  const [activeTab, setActiveTab] = React.useState('Overview');

  // Handle Escape key
  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!element) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end',
      backdropFilter: 'blur(4px)'
    },
    panel: {
      width: '380px',
      height: '100%',
      backgroundColor: '#111',
      borderLeft: `2px solid ${element.cpkHexColor || '#333'}`,
      boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideIn 0.3s ease-out',
      overflowY: 'auto',
      color: '#fff'
    },
    header: {
      padding: '30px 20px',
      textAlign: 'center',
      borderBottom: '1px solid #222',
      position: 'relative'
    },
    tabBar: {
      display: 'flex',
      borderBottom: '1px solid #222'
    },
    tab: (active) => ({
      flex: 1,
      padding: '15px 0',
      textAlign: 'center',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 'bold',
      color: active ? '#00e5ff' : '#666',
      borderBottom: active ? '2px solid #00e5ff' : 'none',
      backgroundColor: active ? 'rgba(0, 229, 255, 0.05)' : 'transparent',
      transition: 'all 0.2s'
    }),
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '15px',
      padding: '20px'
    },
    prop: {
      display: 'flex',
      flexDirection: 'column',
      fontSize: '12px'
    },
    label: { color: '#666', marginBottom: '4px', textTransform: 'uppercase' },
    value: { color: '#eee', fontWeight: '500' }
  };

  const isotopeData = {
    H: ["Protium (¹H)", "Deuterium (²H)", "Tritium (³H)"],
    C: ["Carbon-12", "Carbon-13", "Carbon-14 (Radioactive)"],
    O: ["Oxygen-16", "Oxygen-17", "Oxygen-18"],
    U: ["Uranium-235", "Uranium-238", "Uranium-234"],
    Fe: ["Iron-54", "Iron-56", "Iron-57", "Iron-58"]
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .electron { fill: #00e5ff; filter: drop-shadow(0 0 2px #00e5ff); }
        .shell-ring { stroke: rgba(255,255,255,0.1); stroke-width: 1; fill: none; }
      `}</style>
      
      <div style={styles.panel} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={{ fontSize: '64px', fontWeight: '900', color: element.cpkHexColor }}>{element.symbol}</div>
          <div style={{ fontSize: '18px', margin: '5px 0' }}>{element.name}</div>
          <span style={{ 
            fontSize: '10px', 
            padding: '4px 10px', 
            borderRadius: '20px', 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            textTransform: 'uppercase' 
          }}>{element.category}</span>
          
          <button 
            onClick={() => onAddToCompare(element)}
            style={{
              position: 'absolute', top: '10px', left: '10px',
              background: '#00e5ff', color: '#000', border: 'none',
              padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px'
            }}
          >
            Compare +
          </button>
        </div>

        <div style={styles.tabBar}>
          {['Overview', 'Nucleus', 'History'].map(tab => (
            <div key={tab} style={styles.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>{tab}</div>
          ))}
        </div>

        <div style={{ padding: '20px' }}>
          {activeTab === 'Overview' && (
            <>
              {/* Bohr Model SVG */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="10" fill={element.cpkHexColor || '#fff'} />
                  {element.electronsPerShell.map((count, i) => {
                    const radius = 30 + (i * 18);
                    const speed = 5 + (i * 2);
                    return (
                      <g key={i}>
                        <circle cx="100" cy="100" r={radius} className="shell-ring" />
                        <g style={{ 
                          transformOrigin: '100px 100px', 
                          animation: `rotate ${speed}s linear infinite` 
                        }}>
                          {Array.from({ length: count }).map((_, j) => {
                            const angle = (j / count) * 2 * Math.PI;
                            return (
                              <circle 
                                key={j}
                                cx={100 + radius * Math.cos(angle)}
                                cy={100 + radius * Math.sin(angle)}
                                r="2.5"
                                className="electron"
                              />
                            );
                          })}
                        </g>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div style={styles.grid}>
                {[
                  { l: "Atomic Mass", v: element.atomicMass },
                  { l: "Density", v: `${element.density} g/cm³` },
                  { l: "Phase (298K)", v: element.phase },
                  { l: "Melting Pt", v: `${element.meltingPoint} K` },
                  { l: "Boiling Pt", v: `${element.boilingPoint} K` },
                  { l: "Electronegativity", v: element.electronegativity },
                  { l: "Oxidation States", v: element.oxidationStates?.join(', ') }
                ].map((p, idx) => (
                  <div key={idx} style={styles.prop}>
                    <span style={styles.label}>{p.l}</span>
                    <span style={styles.value}>{p.v || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'Nucleus' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={styles.grid}>
                <div style={styles.prop}><span style={styles.label}>Protons</span><span style={{...styles.value, color:'#00e5ff', fontSize: '20px'}}>{element.atomicNumber}</span></div>
                <div style={styles.prop}><span style={styles.label}>Neutrons</span><span style={{...styles.value, fontSize: '20px'}}>{Math.round(element.atomicMass) - element.atomicNumber}</span></div>
                <div style={styles.prop}><span style={styles.label}>Mass Number</span><span style={styles.value}>{Math.round(element.atomicMass)}</span></div>
              </div>
              
              <div style={{ padding: '0 20px' }}>
                <div style={styles.label}>Common Isotopes</div>
                <ul style={{ fontSize: '13px', color: '#ccc', lineHeight: '2' }}>
                  {(isotopeData[element.symbol] || ["No stable isotopes listed for this element in quick-view."]).map((iso, i) => (
                    <li key={i}>{iso}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'History' && (
            <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{...styles.prop, background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px'}}>
                <span style={styles.label}>Etymology</span>
                <p style={{fontSize: '14px', lineHeight: '1.5', margin: '5px 0'}}>{element.etymology}</p>
              </div>
              
              <div style={styles.grid}>
                <div style={styles.prop}><span style={styles.label}>Discovered By</span><span style={styles.value}>{element.discoveredBy}</span></div>
                <div style={styles.prop}><span style={styles.label}>Year</span><span style={styles.value}>{element.yearDiscovered || 'Ancient'}</span></div>
                <div style={styles.prop}>
                  <span style={styles.label}>Occurrence</span>
                  <span style={{
                    backgroundColor: element.naturalOccurrence === 'synthetic' ? '#ff4d4d' : '#4CAF50',
                    color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', width: 'fit-content'
                  }}>{element.naturalOccurrence}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
