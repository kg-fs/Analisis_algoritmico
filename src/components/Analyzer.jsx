// src/components/Analyzer.jsx
import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const defaultCode = `function algoritmo(n) {
  // Escribe tu código aquí...
  return 0;
}`;

function estimarBigO(ratios) {
  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length || 1;
  if (avg < 2.5) return { text: "O(1)", color: "from-emerald-400 to-teal-600" };
  if (avg < 12) return { text: "O(log n)", color: "from-cyan-400 to-blue-600" };
  if (avg < 100) return { text: "O(n)", color: "from-lime-400 to-green-600" };
  if (avg < 1000) return { text: "O(n log n)", color: "from-yellow-400 to-orange-600" };
  return { text: "O(n²) o mayor", color: "from-red-500 to-rose-700" };
}

export default function Analyzer() {
  const [code, setCode] = useState(defaultCode);
  const [result, setResult] = useState(null);

  const analizar = () => {
    try {
      let cuerpo = code;
      const match = code.match(/function\s+algoritmo\s*\([^)]*\)\s*{([\s\S]*)}/);
      if (match) cuerpo = match[1];

      const fnCode = `
        try {
          function algoritmo(n) { ${cuerpo} }
          const start = performance.now();
          algoritmo(n);
          return performance.now() - start;
        } catch(e) { return -1; }
      `;

      const medir = new Function('n', fnCode);
      const forCount = (code.match(/for\s*\(/g) || []).length;

      let ns;
      if (forCount >= 3) ns = [800, 1200, 1600, 2000];
      else if (forCount >= 2) ns = [3000, 6000, 10000, 14000];
      else ns = [50000, 200000, 500000, 1000000];

      const tiempos = [];
      const MAX_TIME = 800;

      for (const n of ns) {
        let mejor = Infinity;
        let intento = 0;
        while (intento < 10) {
          const start = performance.now();
          const t = medir(n);
          const elapsed = performance.now() - start;
          if (elapsed > MAX_TIME) {
            setResult({
              bigO: "O(n³) o peor",
              tiempos: tiempos.length > 0 ? tiempos : [{ n, tiempo: 999 }],
              ratios: ["∞", "∞", "∞"],
              explosion: true
            });
            return;
          }
          if (t >= 0 && t < mejor) mejor = t;
          intento++;
        }
        if (mejor === Infinity) mejor = 0.001;
        tiempos.push({ n, tiempo: Number(mejor.toFixed(3)) });
      }

      const ratios = [];
      for (let i = 1; i < tiempos.length; i++) {
        const ratio = tiempos[i].tiempo / tiempos[i - 1].tiempo;
        ratios.push(isFinite(ratio) ? ratio : 999);
      }

      const bigO = estimarBigO(ratios);

      setResult({
        tiempos,
        bigO: bigO.text,
        color: bigO.color,
        ratios: ratios.map(r => r.toFixed(2))
      });

    } catch (err) {
      setResult({ error: "Error: " + err.message });
    }
  };

  const borrarTodo = () => {
    setCode(defaultCode);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white py-8">

      {/* TÍTULO PRINCIPAL */}
      <header className="text-center py-10">
        <h1 className="text-6xl md:text-7xl font-black tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 drop-shadow-xl">
            BIG O
          </span>
          <span className="block text-4xl md:text-5xl mt-2 text-white/90 font-bold">
            ANALYZER
          </span>
        </h1>
        <p className="mt-4 text-lg md:text-xl text-purple-300">
          Complejidad algorítmica al instante
        </p>
      </header>

      <div className="max-w-5xl mx-auto px-6 space-y-8">

        {/* EDITOR */}
        <div className="bg-black/60 rounded-2xl border border-purple-500/40 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 p-4 flex justify-between items-center">
            <h3 className="text-xl font-bold">Editor JavaScript</h3>
            <button onClick={borrarTodo} className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg text-sm font-bold transition hover:scale-105">
              Borrar todo
            </button>
          </div>

          <Editor
            height="400px"
            defaultLanguage="javascript"
            value={code}
            onChange={setCode}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
            }}
          />

          <div className="p-5 bg-gradient-to-r from-emerald-600 to-cyan-600">
            <button
              onClick={analizar}
              className="w-full py-4 text-2xl font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg"
            >
              ANALIZAR COMPLEJIDAD
            </button>
          </div>
        </div>

        {/* RESULTADOS - CON ETIQUETA MEJORADA */}
        {result && (
          <div className="bg-black/60 rounded-2xl border border-purple-500/40 shadow-2xl p-8">
            
            {/* ETIQUETA "Resultado" ÉPICA */}
            <div className="text-center mb-10">
              <h2 className="inline-block px-10 py-4 bg-gradient-to-r from-purple-600/80 to-pink-600/80 rounded-full text-3xl font-black tracking-wider border-2 border-purple-400/50 shadow-2xl">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-300">
                  RESULTADO
                </span>
              </h2>
            </div>

            {result.error ? (
              <div className="bg-red-900/70 border border-red-500 text-red-200 p-8 rounded-xl text-center text-lg font-medium">
                {result.error}
              </div>
            ) : (
              <>
                {/* Big O */}
                <div className="text-center mb-8">
                  <h3 className={`text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r ${result.color} drop-shadow-lg`}>
                    {result.bigO}
                  </h3>
                  {result.explosion && (
                    <p className="text-2xl mt-4 text-red-400 font-bold">Demasiado lento → O(n³)+</p>
                  )}
                </div>

                {/* GRÁFICO */}
                <div className="bg-black/40 rounded-xl p-6 border border-purple-500/30">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={result.tiempos}>
                      <XAxis dataKey="n" stroke="#ccc" fontSize={14} />
                      <YAxis stroke="#ccc" fontSize={14} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f0f1e',
                          border: '2px solid #a855f7',
                          borderRadius: '12px',
                          padding: '10px'
                        }}
                        labelStyle={{ color: '#a855f7', fontWeight: 'bold', marginBottom: '6px' }}
                        itemStyle={{ color: '#ffffff' }}
                        formatter={(value) => [`${Number(value).toFixed(3)} ms`, 'Tiempo']}
                        labelFormatter={(label) => `n = ${label.toLocaleString()}`}
                      />
                      <Bar dataKey="tiempo" radius={[12, 12, 0, 0]}>
                        {result.tiempos.map((_, i) => (
                          <Cell key={i} fill={i === result.tiempos.length - 1 ? '#ef4444' : '#10b981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* RATIOS */}
                <div className="mt-6 p-6 bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl text-center border border-purple-500/30">
                  <p className="text-lg text-purple-300 mb-2">Ratios de crecimiento:</p>
                  <p className="text-4xl font-mono font-bold text-orange-400">
                    {result.ratios.join(" → ")}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {!result && (
          <div className="text-center py-20 text-purple-400 text-2xl italic opacity-70">
            Pega tu algoritmo y analiza
          </div>
        )}
      </div>

      <footer className="text-center py-8 text-purple-400 text-sm">
        Esta web solo admite codigo de JS ( Java Script )
      </footer>
    </div>
  );
}