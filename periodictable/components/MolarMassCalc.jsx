function MolarCalc({ onClose }) {
  const [activeTab, setActiveTab] = React.useState('molar');
  const [formula, setFormula] = React.useState('');
  const [givenMass, setGivenMass] = React.useState('');
  const [volume, setVolume] = React.useState('');
  const [solventMass, setSolventMass] = React.useState('');
  const [medium, setMedium] = React.useState('Acidic');
  const [manualN, setManualN] = React.useState('1');

  // Lookup map for ELEMENTS (assumed global)
  const elMap = React.useMemo(() => {
    const map = {};
    if (typeof ELEMENTS !== 'undefined') {
      ELEMENTS.forEach(e => map[e.s] = e);
    }
    return map;
  }, []);

  // Robust Formula Parser
  const parseFormula = (str) => {
    let i = 0;
    const readNum = () => {
      let s = '';
      while (i < str.length && /[0-9]/.test(str[i])) s += str[i++];
      return s ? parseInt(s) : 1;
    };
    const parse = () => {
      const counts = {};
      while (i < str.length) {
        if (str[i] === '(') {
          i++;
          const inner = parse();
          const num = readNum();
          for (const k in inner) counts[k] = (counts[k] || 0) + inner[k] * num;
        } else if (str[i] === ')') {
          i++;
          return counts;
        } else if (/[A-Z]/.test(str[i])) {
          let sym = str[i++];
          while (i < str.length && /[a-z]/.test(str[i])) sym += str[i++];
          const num = readNum();
          counts[sym] = (counts[sym] || 0) + num;
        } else i++;
      }
      return counts;
    };
    return parse();
  };

  const calc = React.useMemo(() => {
    if (!formula.trim()) return null;
    try {
      const counts = parseFormula(formula);
      let totalMass = 0;
      const rows = [];
      
      for (const sym in counts) {
        const el = elMap[sym];
        if (!el) throw new Error(`Unknown element: ${sym}`);
        const sub = el.mass * counts[sym];
        totalMass += sub;
        rows.push({ sym, name: el.name, count: counts[sym], mass: el.mass, sub: sub.toFixed(4) });
      }

      // n-factor Tier Logic
      let nFactor = 1;
      let tier = 'manual';
      const cleanF = formula.replace(/\s/g, '');
      
      // TIER 2: Transition Metals
      const transitions = ['Fe', 'Mn', 'Cr', 'V', 'Cu', 'Co'];
      const foundTransition = transitions.find(t => cleanF.includes(t));

      if (foundTransition) {
        tier = 'guided';
        if (cleanF.includes('KMnO4')) {
          nFactor = medium === 'Acidic' ? 5 : medium === 'Basic' ? 3 : 1;
        } else if (cleanF.includes('Cr2O7') || cleanF.includes('CrO4')) {
          nFactor = 6;
        } else if (cleanF.includes('Fe')) {
          nFactor = medium === 'Acidic' ? 3 : 1;
        } else if (cleanF.includes('Cu')) {
          nFactor = 2;
        } else {
          nFactor = parseFloat(manualN) || 1;
          tier = 'manual';
        }
      } 
      // TIER 1: Auto Acid/Base/Salt
      else if (cleanF.startsWith('H')) {
        nFactor = counts['H'] || 1;
        tier = 'auto';
      } else if (cleanF.includes('OH')) {
        // Base detection: check for OH groups
        const ohCount = (formula.match(/OH/g) || []).length || counts['O'] || 1;
        nFactor = ohCount;
        tier = 'auto';
      } else {
        const firstSym = formula.match(/[A-Z][a-z]*/)?.[0];
        const firstEl = elMap[firstSym];
        if (firstEl && firstEl.ox) {
          nFactor = Math.abs(firstEl.ox[0]);
          tier = 'auto';
        } else {
          nFactor = parseFloat(manualN) || 1;
          tier = 'manual';
        }
      }

      return { totalMass, rows, nFactor, tier };
    } catch (e) {
      return { error: e.message };
    }
  }, [formula, elMap, medium, manualN]);

  const results = React.useMemo(() => {
    if (!calc || calc.error) return null;
    const M = calc.totalMass;
    const n = calc.nFactor;
    const m = parseFloat(givenMass) || 0;
    const vL = (parseFloat(volume) || 0) / 1000;
    const wKg = (parseFloat(solventMass) || 0) / 1000;

    const fmt = (val) => (val && isFinite(val) && val > 0 ? val.toFixed(4) : "—");

    const eqWt = M / n;
    const moles = m / M;
    const grEq = m / eqWt;

    return {
      eqWt: fmt(eqWt),
      moles: fmt(moles),
      grEq: fmt(grEq),
      molarity: fmt(moles / vL),
      normality: fmt(grEq / vL),
      molality: fmt(moles / wKg)
    };
  }, [calc, givenMass, volume, solventMass]);

  const toSub = (s) => s.replace(/\d/g, m => ({'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'})[m]);

  return (
    <div className="molar-overlay" onClick={onClose}>
      <div className="molar-box" onClick={e => e.stopPropagation()} style={{ fontFamily: '"Exo 2", sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={`btn ${activeTab === 'molar' ? 'active' : ''}`} onClick={() => setActiveTab('molar')}>Molar Mass</button>
            <button className={`btn ${activeTab === 'solution' ? 'active' : ''}`} onClick={() => setActiveTab('solution')}>Solution</button>
          </div>
          <button className="btn" onClick={onClose}>✕</button>
        </div>

        <div className="prop-label">Formula Entry</div>
        <input className="molar-input" placeholder="H2SO4, KMnO4..." value={formula} onChange={e => setFormula(e.target.value)} style={{ fontFamily: '"Share Tech Mono", monospace' }} />

        {activeTab === 'molar' ? (
          <div style={{ animation: 'fadeIn 0.2s' }}>
            {calc && !calc.error && (
              <>
                <div className="molar-result" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                   {toSub(formula)} = <span style={{ color: 'var(--accent)' }}>{calc.totalMass.toFixed(4)} u</span>
                </div>
                <table className="molar-breakdown">
                  <thead><tr><th>Symbol</th><th>Qty</th><th>Unit Mass</th><th>Subtotal</th></tr></thead>
                  <tbody>
                    {calc.rows.map(r => (
                      <tr key={r.sym}>
                        <td style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{r.sym}</td>
                        <td>{r.count}</td>
                        <td>{r.mass.toFixed(2)}</td>
                        <td style={{ color: 'var(--accent2)' }}>{r.sub}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', animation: 'fadeIn 0.2s' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><div className="prop-label">Mass (g)</div><input type="number" className="molar-input" style={{ margin: 0, fontSize: '14px' }} value={givenMass} onChange={e => setGivenMass(e.target.value)} /></div>
              <div><div className="prop-label">Volume (mL)</div><input type="number" className="molar-input" style={{ margin: 0, fontSize: '14px' }} value={volume} onChange={e => setVolume(e.target.value)} /></div>
            </div>
            <div><div className="prop-label">Solvent (g)</div><input type="number" className="molar-input" style={{ margin: 0, fontSize: '14px' }} value={solventMass} onChange={e => setSolventMass(e.target.value)} /></div>

            <div style={{ background: 'var(--bg3)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="prop-label" style={{ margin: 0 }}>n-factor Logic</span>
                {calc && !calc.error && (
                  <span style={{ 
                    fontSize: '9px', padding: '2px 8px', borderRadius: '3px', textTransform: 'uppercase',
                    background: calc.tier === 'auto' ? '#4caf50' : calc.tier === 'guided' ? '#ff9800' : '#607d8b', color: '#000', fontWeight: 'bold'
                  }}>
                    {calc.tier}: n={calc.nFactor}
                  </span>
                )}
              </div>

              {calc?.tier === 'guided' && (
                <select className="molar-input" style={{ margin: 0, fontSize: '12px', height: '34px' }} value={medium} onChange={e => setMedium(e.target.value)}>
                  <option>Acidic</option><option>Basic</option><option>Neutral</option>
                </select>
              )}
              {calc?.tier === 'manual' && (
                <input type="number" className="molar-input" style={{ margin: 0, fontSize: '12px', height: '34px' }} value={manualN} onChange={e => setManualN(e.target.value)} placeholder="Manual n-factor" />
              )}
            </div>

            {results && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { l: 'Eq. Weight', v: results.eqWt }, { l: 'Moles', v: results.moles }, { l: 'Gram Eq.', v: results.grEq },
                  { l: 'Molarity (M)', v: results.molarity, a: true }, { l: 'Normality (N)', v: results.normality, a: true }, { l: 'Molality (m)', v: results.molality, a: true }
                ].map(item => (
                  <div key={item.l} style={{ background: 'var(--bg)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                    <div className="prop-label" style={{ fontSize: '8px' }}>{item.l}</div>
                    <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '15px', color: item.a ? 'var(--accent)' : 'var(--text)', fontWeight: 'bold' }}>{item.v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {calc?.error && formula && <div className="molar-error" style={{ marginTop: '12px' }}>⚠ {calc.error}</div>}
      </div>
    </div>
  );
}
