/**
 * MolarMassCalc Component
 * /components/MolarMassCalc.jsx
 */

const MolarMassCalc = ({ elements }) => {
  const [formula, setFormula] = React.useState('');

  // Create a quick lookup map for atomic masses
  const massMap = React.useMemo(() => {
    return elements.reduce((acc, el) => {
      acc[el.symbol] = parseFloat(el.atomicMass);
      return acc;
    }, {});
  }, [elements]);

  /**
   * Logic to parse formula: H2SO4, Ca(OH)2, Fe2(SO4)3
   * Returns a map of { symbol: count }
   */
  const parseFormula = (str) => {
    const stack = [{}];
    const regex = /([A-Z][a-z]*)(\d*)|(\()|(\))(\d*)/g;
    let match;

    while ((match = regex.exec(str)) !== null) {
      const [full, symbol, count, openParen, closeParen, multiplier] = match;

      if (symbol) {
        const n = parseInt(count || '1', 10);
        const currentScope = stack[stack.length - 1];
        currentScope[symbol] = (currentScope[symbol] || 0) + n;
      } else if (openParen) {
        stack.push({});
      } else if (closeParen) {
        const subScope = stack.pop();
        const mult = parseInt(multiplier || '1', 10);
        const parentScope = stack[stack.length - 1];

        Object.keys(subScope).forEach((s) => {
          parentScope[s] = (parentScope[s] || 0) + subScope[s] * mult;
        });
      }
    }
    return stack[0];
  };

  const calculation = React.useMemo(() => {
    if (!formula) return null;
    try {
      const counts = parseFormula(formula);
      let total = 0;
      const breakdown = [];
      let hasError = false;

      Object.entries(counts).forEach(([symbol, count]) => {
        const mass = massMap[symbol];
        if (mass === undefined) hasError = true;
        const subtotal = (mass || 0) * count;
        total += subtotal;
        breakdown.push({ symbol, count, mass, subtotal, error: mass === undefined });
      });

      return { total, breakdown, hasError };
    } catch (e) {
      return { error: "Invalid formula syntax" };
    }
  }, [formula, massMap]);

  // Helper to convert numbers in string to Unicode subscripts for display
  const toSubscript = (str) => {
    const subs = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
    return str.replace(/\d/g, m => subs[m]);
  };

  const styles = {
    card: {
      backgroundColor: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '20px',
      maxWidth: '450px',
      margin: '20px auto',
      color: '#fff',
      fontFamily: 'inherit'
    },
    input: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#000',
      border: '1px solid #00e5ff',
      borderRadius: '4px',
      color: '#00e5ff',
      fontSize: '18px',
      fontFamily: 'monospace',
      outline: 'none',
      boxSizing: 'border-box',
      marginBottom: '15px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '12px',
      marginTop: '10px'
    },
    th: {
      textAlign: 'left',
      color: '#888',
      borderBottom: '1px solid #333',
      padding: '8px'
    },
    td: {
      padding: '8px',
      borderBottom: '1px solid #222'
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={{ marginTop: 0, fontSize: '14px', color: '#00e5ff', textTransform: 'uppercase' }}>
        Molar Mass Calculator
      </h3>
      
      <input 
        style={styles.input}
        placeholder="e.g. Mg(HCO3)2"
        value={formula}
        onChange={(e) => setFormula(e.target.value)}
      />

      {calculation && !calculation.error && formula && (
        <>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>
            Molar mass of {toSubscript(formula)} = 
            <span style={{ color: calculation.hasError ? '#ff4d4d' : '#00e5ff', marginLeft: '8px' }}>
              {calculation.total.toFixed(3)} g/mol
            </span>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Elem</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>Mass</th>
                <th style={styles.th}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {calculation.breakdown.map((row, i) => (
                <tr key={i}>
                  <td style={{ ...styles.td, color: row.error ? '#ff4d4d' : '#fff', fontWeight: 'bold' }}>
                    {row.symbol} {row.error && '(?)'}
                  </td>
                  <td style={styles.td}>{row.count}</td>
                  <td style={styles.td}>{row.mass ? row.mass.toFixed(2) : '--'}</td>
                  <td style={styles.td}>{row.subtotal ? row.subtotal.toFixed(2) : '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {calculation.hasError && (
            <div style={{ color: '#ff4d4d', fontSize: '11px', marginTop: '10px' }}>
              * Unknown element symbol detected. Check capitalization.
            </div>
          )}
        </>
      )}

      {calculation?.error && formula && (
        <div style={{ color: '#ff4d4d', fontSize: '12px' }}>{calculation.error}</div>
      )}
    </div>
  );
};

export default MolarMassCalc;
