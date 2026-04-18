/**
 * App.jsx - Main Application Controller
 * Wires together state, logic, and all sub-components.
 */

const initialState = {
  activeFilter: null,
  heatmapProperty: null,
  temperature: 298,
  selectedElement: null,
  compareList: [],
  searchQuery: '',
  isMolarCalcOpen: false
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_FILTER': return { ...state, activeFilter: action.payload };
    case 'SET_HEATMAP': return { ...state, heatmapProperty: action.payload };
    case 'SET_TEMP': return { ...state, temperature: action.payload };
    case 'SELECT_ELEMENT': return { ...state, selectedElement: action.payload };
    case 'SET_SEARCH': return { ...state, searchQuery: action.payload };
    case 'TOGGLE_MOLAR_CALC': return { ...state, isMolarCalcOpen: !state.isMolarCalcOpen };
    case 'CLEAR_COMPARE': return { ...state, compareList: [] };
    case 'ADD_TO_COMPARE':
      if (state.compareList.length >= 3) return state;
      if (state.compareList.find(el => el.symbol === action.payload.symbol)) return state;
      return { ...state, compareList: [...state.compareList, action.payload] };
    case 'REMOVE_FROM_COMPARE':
      return { ...state, compareList: state.compareList.filter(el => el.symbol !== action.payload.symbol) };
    default: return state;
  }
}

const App = () => {
  const [state, dispatch] = React.useReducer(appReducer, initialState);
  const [elements, setElements] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // 1. Data Loading - CORRECTED PATH
  React.useEffect(() => {
    fetch('./data/elements.json')
      .then(res => res.json())
      .then(data => {
        setElements(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Critical error loading element data:", err);
        setLoading(false);
      });
  }, []);

  // 2. Keyboard Navigation Hook
  // Side-effect hook for arrow key navigation
  useKeyboardNav(elements, state.selectedElement, (el) => 
    dispatch({ type: 'SELECT_ELEMENT', payload: el })
  );

  // 3. Filtering Logic
  const filteredElements = React.useMemo(() => {
    const query = state.searchQuery.toLowerCase();
    return elements.filter(el => 
      el.name.toLowerCase().includes(query) ||
      el.symbol.toLowerCase().includes(query) ||
      el.atomicNumber.toString().includes(query)
    );
  }, [elements, state.searchQuery]);

  // 4. Heatmap Range Calculation
  const heatmapRange = React.useMemo(() => {
    if (!state.heatmapProperty) return null;
    return getPropertyRange(elements, state.heatmapProperty);
  }, [elements, state.heatmapProperty]);

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', 
        justifyContent: 'center', color: '#00e5ff', fontSize: '1.5rem'
      }}>
        Initializing Subatomic Particles...
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: state.compareList.length > 0 ? '350px' : '40px' }}>
      
      {/* App Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#00e5ff', margin: 0, letterSpacing: '3px', fontWeight: '900' }}>NEON TABLE</h1>
        <button 
          onClick={() => dispatch({ type: 'TOGGLE_MOLAR_CALC' })}
          style={{ 
            backgroundColor: state.isMolarCalcOpen ? '#00e5ff' : 'transparent',
            color: state.isMolarCalcOpen ? '#000' : '#00e5ff',
            border: '2px solid #00e5ff',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          {state.isMolarCalcOpen ? 'Close Calc' : 'Molar Mass Calculator'}
        </button>
      </div>

      <ControlPanel 
        elements={elements}
        activeFilter={state.activeFilter}
        temperature={state.temperature}
        onFilterChange={(cat) => dispatch({ type: 'SET_FILTER', payload: cat })}
        onHeatmapChange={(prop) => dispatch({ type: 'SET_HEATMAP', payload: prop })}
        onTemperatureChange={(temp) => dispatch({ type: 'SET_TEMP', payload: temp })}
        onSearch={(query) => dispatch({ type: 'SET_SEARCH', payload: query })}
      />

      {/* Dynamic Heatmap Legend */}
      {state.heatmapProperty && heatmapRange && (
        <div style={{ 
          margin: '25px auto', 
          maxWidth: '500px', 
          textAlign: 'center',
          animation: 'fadeIn 0.4s ease-out'
        }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Visualizing: {state.heatmapProperty}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{heatmapRange.min}</span>
            <div style={{ 
              flex: 1, 
              height: '10px', 
              borderRadius: '5px', 
              background: 'linear-gradient(to right, #313695, #ffffbf, #a50026)',
              boxShadow: '0 0 10px rgba(0,0,0,0.5)'
            }} />
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{heatmapRange.max}</span>
          </div>
        </div>
      )}

      {/* Main Grid View */}
      <TableGrid 
        elements={filteredElements}
        activeFilter={state.activeFilter}
        heatmapProperty={state.heatmapProperty}
        temperature={state.temperature}
        onElementClick={(el) => dispatch({ type: 'SELECT_ELEMENT', payload: el })}
      />

      {/* Molar Mass Calculator Overlay */}
      {state.isMolarCalcOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex',
          alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'
        }} onClick={() => dispatch({ type: 'TOGGLE_MOLAR_CALC' })}>
          <div onClick={e => e.stopPropagation()}>
            <MolarMassCalc elements={elements} />
          </div>
        </div>
      )}

      {/* Detailed Side Panel */}
      <DetailModal 
        element={state.selectedElement} 
        onClose={() => dispatch({ type: 'SELECT_ELEMENT', payload: null })}
        onAddToCompare={(el) => dispatch({ type: 'ADD_TO_COMPARE', payload: el })}
      />

      {/* Comparison Drawer */}
      <ComparePanel 
        compareList={state.compareList}
        onRemove={(el) => dispatch({ type: 'REMOVE_FROM_COMPARE', payload: el })}
        onClearAll={() => dispatch({ type: 'CLEAR_COMPARE' })}
      />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

// CRITICAL FIX: LAUNCH THE APP
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);
