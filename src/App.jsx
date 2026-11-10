import { useMemo, useState } from "react";
import "./App.css";

const G = 9.81;
const fmt = (n, digits = 2) => Number.isFinite(n)
  ? n.toLocaleString("es-MX", { maximumFractionDigits: digits, minimumFractionDigits: digits })
  : "—";

function calculate({ L, b, h, rho, E, mass }) {
  const volume = b * h * L;
  const selfMass = rho * volume;
  const selfWeight = selfMass * G;
  const w = rho * b * h * G;
  const P = mass * G;
  const I = (b * Math.pow(h, 3)) / 12;
  const reactions = (w * L + P) / 2;
  const Mmax = (w * L ** 2) / 8 + (P * L) / 4;
  const deflection = (5 * w * L ** 4) / (384 * E * I) + (P * L ** 3) / (48 * E * I);
  const points = Array.from({ length: 41 }, (_, i) => {
    const x = (L * i) / 40;
    const left = x <= L / 2;
    const xp = left ? x : L - x;
    const moment = (w * x * (L - x)) / 2 + (P * xp) / 2;
    const yUniform = (w * x * (L ** 3 - 2 * L * x ** 2 + x ** 3)) / (24 * E * I);
    const yPoint = (P * xp * (3 * L ** 2 - 4 * xp ** 2)) / (48 * E * I);
    return { x, moment, deflection: yUniform + yPoint };
  });
  return { volume, selfMass, selfWeight, w, P, I, reactions, Mmax, deflection, points };
}

function LineChart({ points, field, color, title, unit, invert = false }) {
  const width = 620, height = 190, pad = 34;
  const values = points.map(p => p[field]);
  const max = Math.max(...values, 1e-12);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1e-12);
  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (width - 2 * pad);
    const normalized = (p[field] - min) / range;
    const y = invert ? pad + normalized * (height - 2 * pad) : height - pad - normalized * (height - 2 * pad);
    return `${x},${y}`;
  }).join(" ");
  return <div className="chart-card">
    <div className="chart-heading"><div><h3>{title}</h3><span>{unit}</span></div><span className="chart-max">Máx. {fmt(max, field === "deflection" ? 4 : 1)}</span></div>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
      <line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} className="axis"/>
      <line x1={pad} y1={pad} x2={pad} y2={height-pad} className="axis"/>
      {[0, .25, .5, .75, 1].map(v => <line key={v} x1={pad} y1={pad+v*(height-2*pad)} x2={width-pad} y2={pad+v*(height-2*pad)} className="gridline"/>)}
      <polyline points={coords} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      <text x={pad} y={height-8} className="axis-label">0 m</text>
      <text x={width-pad} y={height-8} textAnchor="end" className="axis-label">L = extremo</text>
    </svg>
  </div>;
}

function BeamDiagram({ L, P, w }) {
  return <div className="beam-wrap">
    <svg viewBox="0 0 640 190" role="img" aria-label="Viga simplemente apoyada con carga distribuida y carga puntual central">
      <defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#e58b36"/></marker></defs>
      <line x1="74" y1="110" x2="566" y2="110" stroke="#315c83" strokeWidth="12" strokeLinecap="round"/>
      <path d="M74 122 L58 147 L90 147 Z M566 122 L550 147 L582 147 Z" fill="#d8e6f3" stroke="#315c83" strokeWidth="2"/>
      <line x1="74" y1="151" x2="566" y2="151" stroke="#8ca0b3" strokeWidth="1.5"/>
      <line x1="74" y1="157" x2="74" y2="145" stroke="#8ca0b3"/><line x1="566" y1="157" x2="566" y2="145" stroke="#8ca0b3"/>
      <text x="320" y="174" textAnchor="middle" fill="#52677c" fontSize="12">Longitud L = {fmt(L,2)} m</text>
      {Array.from({length:13},(_,i)=>{const x=82+i*40; return <g key={i}><line x1={x} y1="40" x2={x} y2="92" stroke="#e58b36" strokeWidth="1.8" markerEnd="url(#arrow)"/></g>})}
      <line x1="320" y1="18" x2="320" y2="91" stroke="#d45b53" strokeWidth="3" markerEnd="url(#arrow)"/>
      <text x="320" y="12" textAnchor="middle" fill="#b94d47" fontSize="12" fontWeight="700">P = {fmt(P/1000,2)} kN</text>
      <text x="320" y="31" textAnchor="middle" fill="#b8792e" fontSize="11">w = {fmt(w/1000,2)} kN/m</text>
      <text x="74" y="137" textAnchor="middle" fill="#52677c" fontSize="10">A</text><text x="566" y="137" textAnchor="middle" fill="#52677c" fontSize="10">B</text>
    </svg>
  </div>;
}

export default function App() {
  const [L,setL] = useState(4);
  const [b,setB] = useState(0.20);
  const [h,setH] = useState(0.40);
  const [rho,setRho] = useState(2400);
  const [E,setE] = useState(25);
  const [mass,setMass] = useState(500);
  const result = useMemo(() => calculate({L,b,h,rho,E:E*1e9,mass}),[L,b,h,rho,E,mass]);
  const valid = L>0 && b>0 && h>0 && rho>0 && E>0 && mass>=0;
  const benchmark = useMemo(() => calculate({L:4,b:.2,h:.4,rho:2400,E:25e9,mass:500}),[]);
  const [showEquations,setShowEquations] = useState(false);
  const [showValidation,setShowValidation] = useState(false);
  const reset = () => {setL(4);setB(.2);setH(.4);setRho(2400);setE(25);setMass(500);};
  return <main className="app-shell">
    <header className="topbar"><div className="brand-mark">V</div><div><div className="eyebrow">FÍSICA PARA EL DESARROLLO DE SOFTWARE</div><h1>Simulador de vigas</h1>
    <h2>¿Cómo afectan las cargas a una viga?</h2>
    <h1>PROYECTO INTEGRADOR FINAL </h1>
    <h2>Alumnos:</h2>
    <h3>Cancino Ramos Pablo Eduardo</h3>
    <h3>Beltran Mariscal Santos Steven</h3>
    <h3>Pérez Angulo Daniel Alberto</h3>
    <h3>Yoshio Felix Mercado</h3>
     </div><span className="version">MODELO 1D · ELÁSTICO</span></header>
    <section className="intro"><div><span className="kicker">LABORATORIO INTERACTIVO</span><h2>¿Cómo afectan las cargas a una viga?</h2><p>Modifica la geometría, el material y la carga externa. Observa cómo cambian las reacciones, el momento flector y la deformación estimada.</p></div><div className="intro-stat"><span>Gravedad</span><strong>9.81 <small>m/s²</small></strong></div></section>
    <div className="layout">
      <aside className="controls panel">
        <div className="section-title"><div><span className="step">01</span><h2>Parámetros de entrada</h2></div><button className="text-button" onClick={reset}>Restablecer</button></div>
        <h3 className="group-label">Geometría de la viga</h3>
        <NumberControl label="Longitud (L)" value={L} set={setL} min=".5" max="12" step=".1" unit="m"/>
        <NumberControl label="Ancho (b)" value={b} set={setB} min=".05" max="1" step=".01" unit="m"/>
        <NumberControl label="Altura (h)" value={h} set={setH} min=".05" max="1.5" step=".01" unit="m"/>
        <h3 className="group-label">Material</h3>
        <NumberControl label="Densidad (ρ)" value={rho} set={setRho} min="500" max="8000" step="50" unit="kg/m³"/>
        <NumberControl label="Módulo elástico (E)" value={E} set={setE} min="1" max="300" step="1" unit="GPa"/>
        <h3 className="group-label">Carga externa centrada</h3>
        <NumberControl label="Masa aplicada" value={mass} set={setMass} min="0" max="10000" step="25" unit="kg"/>
        <div className="assumption"><strong>Condiciones del modelo</strong><span>Apoyos simples · sección rectangular · carga puntual al centro · carga propia uniforme.</span></div>
      </aside>
      <section className="main-content">
        <div className="panel diagram-panel"><div className="section-title"><div><span className="step">02</span><h2>Modelo físico</h2></div><span className="live"><i/> Actualización en tiempo real</span></div><BeamDiagram L={L} P={result.P} w={result.w}/><div className="legend"><span><i className="legend-uniform"/>Peso propio distribuido</span><span><i className="legend-point"/>Carga puntual central</span><span><i className="legend-beam"/>Viga y apoyos</span></div></div>
        <div className="section-title results-title"><div><span className="step">03</span><h2>Resultados calculados</h2></div><span className="unit-note">Valores en unidades SI</span></div>
        {!valid ? <div className="warning">Introduce valores positivos para las dimensiones, densidad y módulo elástico.</div> : <div className="metrics-grid">
          <Metric label="Peso propio" value={fmt(result.selfWeight/1000,2)} unit="kN" detail={`${fmt(result.selfMass,1)} kg de masa`}/>
          <Metric label="Carga externa" value={fmt(result.P/1000,2)} unit="kN" detail={`${fmt(mass,1)} kg aplicados`}/>
          <Metric label="Momento máximo" value={fmt(result.Mmax/1000,2)} unit="kN·m" detail="En el centro del claro"/>
          <Metric label="Deflexión máxima" value={fmt(result.deflection*1000,3)} unit="mm" detail="Hacia abajo, en el centro"/>
        </div>}
        {valid && <div className="panel reactions"><div><span className="mini-label">REACCIÓN EN APOYO A</span><strong>{fmt(result.reactions/1000,2)} <small>kN</small></strong></div><div><span className="mini-label">REACCIÓN EN APOYO B</span><strong>{fmt(result.reactions/1000,2)} <small>kN</small></strong></div><div><span className="mini-label">INERCIA (I)</span><strong>{result.I.toExponential(3)} <small>m⁴</small></strong></div></div>}
        {valid && <><div className="section-title graph-title"><div><span className="step">04</span><h2>Diagramas de comportamiento</h2></div></div><div className="charts"><LineChart points={result.points} field="moment" color="#d88b3d" title="Momento flector" unit="M(x) · N·m"/><LineChart points={result.points} field="deflection" color="#397f9e" title="Deflexión estimada" unit="δ(x) · m" invert/></div></>}
        <div className="panel expandable"><button onClick={()=>setShowEquations(!showEquations)}><span><span className="step">05</span><b>Modelo matemático y ecuaciones</b></span><span>{showEquations?"−":"+"}</span></button>{showEquations && <div className="equations">
          <p><b>Peso propio por unidad de longitud:</b> w = ρ · b · h · g</p><p><b>Carga puntual:</b> P = m · g</p><p><b>Inercia de sección rectangular:</b> I = b · h³ / 12</p><p><b>Momento máximo:</b> Mmáx = wL²/8 + PL/4</p><p><b>Deflexión máxima:</b> δmáx = 5wL⁴/(384EI) + PL³/(48EI)</p><p><b>Reacciones:</b> RA = RB = (wL + P)/2</p>
          <p className="equation-note">E se convierte de GPa a Pa antes del cálculo. Las cargas se expresan en N y las longitudes en m.</p>
        </div>}</div>
        <div className="panel expandable"><button onClick={()=>setShowValidation(!showValidation)}><span><span className="step">06</span><b>Validación con cálculo teórico</b></span><span>{showValidation?"−":"+"}</span></button>{showValidation && <div className="validation-content"><p>Para comprobar el algoritmo se usa un caso de referencia: L=4 m, b=0.20 m, h=0.40 m, ρ=2400 kg/m³, E=25 GPa y masa externa=500 kg.</p><div className="validation-table"><div><b>Magnitud</b><b>Resultado teórico</b><b>Simulador</b></div><div><span>Peso propio</span><span>{fmt(benchmark.selfWeight/1000,2)} kN</span><span>{fmt(benchmark.selfWeight/1000,2)} kN</span></div><div><span>Momento máximo</span><span>{fmt(benchmark.Mmax/1000,2)} kN·m</span><span>{fmt(benchmark.Mmax/1000,2)} kN·m</span></div><div><span>Deflexión máxima</span><span>{fmt(benchmark.deflection*1000,4)} mm</span><span>{fmt(benchmark.deflection*1000,4)} mm</span></div></div><p className="equation-note">El resultado del programa coincide con el cálculo manual porque ambos aplican las mismas ecuaciones analíticas. Para el informe, documenten al menos una sustitución numérica paso a paso.</p></div>}</div>
      </section>
    </div>
    <footer><span>SIMULADOR EDUCATIVO · VIGAS SIMPLEMENTE APOYADAS</span><span>No sustituye un análisis ni un diseño estructural profesional.</span></footer>
  </main>;
}

function NumberControl({label,value,set,min,max,step,unit}) {
  return <label className="number-control"><span>{label}</span><div><input type="number" value={value} min={min} max={max} step={step} onChange={e=>set(Math.max(0,Number(e.target.value)))}/><small>{unit}</small></div></label>;
}
function Metric({label,value,unit,detail}) {
  return <article className="metric-card"><span>{label}</span><strong>{value}<small>{unit}</small></strong><p>{detail}</p></article>;
}
