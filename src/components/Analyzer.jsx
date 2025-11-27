// src/components/Analyzer.jsx
import { useState } from 'react';
import Editor from '@monaco-editor/react';

const defaultCode = `function algoritmo(n) {
  // Ejemplos rápidos:
  // O(1) → return 42;
  // O(n) → let s = 0; for(let i=0; i<n; i++) s += i; return s;
  // O(n²) → let c = 0; const m = Math.min(n, 1500); for(let i=0;i<m;i++)for(let j=0;j<m;j++)c++; return c;
  let suma = 0;
  for (let i = 0; i < n; i++) suma += i;
  return suma;
}`;

// 10 entradas óptimas para máxima precisión
const ENTRADAS = [500, 1000, 2000, 5000, 10000, 20000, 40000, 60000, 80000, 100000];

export default function Analyzer() {
  const [code, setCode] = useState(defaultCode);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const borrarTodo = () => {
    setCode(defaultCode);
    setResult(null);
  };

  const analizar = () => {
    setLoading(true);
    setResult(null);

    let funcion;
    try {
      const wrapper = new Function('n', `
        "use strict";
        ${code}
        return algoritmo(n);
      `);
      funcion = wrapper;
      funcion(10); // prueba rápida
    } catch (err) {
      setResult({ error: "Error en el código: " + err.message });
      setLoading(false);
      return;
    }

    const tiempos = [];

    for (const n of ENTRADAS) {
      let total = 0;
      let validas = 0;

      for (let r = 0; r < 5; r++) {
        const inicio = performance.now();
        try {
          funcion(n);
        } catch (e) {
          break;
        }
        const fin = performance.now();
        const duracion = fin - inicio;

        if (duracion < 2000 && duracion > 0.05) {
          total += duracion;
          validas++;
        }
      }

      tiempos.push(validas > 0 ? total / validas : 9999);
    }

    // Regresión log-log simple y efectiva
    const puntos = tiempos.map((t, i) => ({ n: ENTRADAS[i], t: Math.max(t, 0.1) }));
    const logN = puntos.map(p => Math.log(p.n));
    const logT = puntos.map(p => Math.log(p.t));

    const nLog = logN.length;
    const sumX = logN.reduce((a, b) => a + b, 0);
    const sumY = logT.reduce((a, b) => a + b, 0);
    const sumXY = logN.reduce((a, b, i) => a + b * logT[i], 0);
    const sumX2 = logN.reduce((a, b) => a + b * b, 0);

    const pendiente = (nLog * sumXY - sumX * sumY) / (nLog * sumX2 - sumX * sumX);
    const exponente = Number(pendiente.toFixed(3));

    // R² rápido
    const b = (sumY - pendiente * sumX) / nLog;
    const predicciones = logN.map(x => pendiente * x + b);
    const mediaY = sumY / nLog;
    const ssTot = logT.reduce((s, y) => s + (y - mediaY) ** 2, 0);
    const ssRes = logT.reduce((s, y, i) => s + (y - predicciones[i]) ** 2, 0);
    const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    let bigO = "O(?)";
    if (exponente < 0.2) bigO = "O(1)";
    else if (exponente < 0.7) bigO = "O(log n)";
    else if (exponente < 1.3) bigO = "O(n)";
    else if (exponente < 1.8) bigO = "O(n log n)";
    else if (exponente < 2.4) bigO = "O(n²)";
    else bigO = "O(n³ o mayor)";

    const confianza = r2 > 0.97 ? "Alta" : r2 > 0.85 ? "Media" : "Baja";

    setResult({
      bigO,
      exponente,
      confianza,
      r2: Number(r2.toFixed(4)),
      tiempos: tiempos.map(t => t > 9990 ? ">2000" : Number(t.toFixed(1))),
      nValues: ENTRADAS
    });

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white py-8">
      <header className="text-center py-12">
        <h1 className="text-8xl font-black">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 drop-shadow-2xl">
            BIG O Y T(N) ANALYZER
          </span>
        </h1>
        <p className="mt-4 text-xl text-purple-300">funciona solo con codigo de Java Script (JS)</p>
      </header>

      <div className="max-w-5xl mx-auto px-6 space-y-10">
        <div className="bg-black/60 backdrop-blur-lg rounded-3xl border border-purple-500/40 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-700 to-pink-700 p-6 flex justify-between items-center">
            <h3 className="text-2xl font-bold">Editor de Código</h3>
            <button onClick={borrarTodo} className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold transition hover:scale-105">
              Borrar todo
            </button>
          </div>

          <div className="p-6">
            <Editor
              height="500px"
              defaultLanguage="javascript"
              value={code}
              onChange={setCode}
              theme="vs-dark"
              options={{
                fontSize: 15,
                minimap: { enabled: false },
                wordWrap: "on",
                automaticLayout: true,
                folding: true,
              }}
            />
          </div>

          <div className="p-6 bg-gradient-to-r from-emerald-600 to-cyan-600">
            <button
              onClick={analizar}
              disabled={loading}
              className="w-full py-6 text-3xl font-black rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-2xl disabled:opacity-60"
            >
              {loading ? "ANALIZANDO..." : "ANALIZAR COMPLEJIDAD"}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-black/70 backdrop-blur-xl rounded-3xl border-2 border-purple-500/60 shadow-3xl p-10">
            {result.error ? (
              <div className="bg-red-900/80 border-2 border-red-500 p-10 rounded-2xl text-center text-2xl font-bold text-red-200">
                {result.error}
              </div>
            ) : (
              <>
                <div className="text-center mb-12">
                  <h2 className="text-9xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
                    {result.bigO}
                  </h2>
                  <p className="text-4xl mt-6 text-cyan-300 font-bold">Exponente ≈ {result.exponente}</p>
                  <p className="text-2xl text-purple-300">R² = {result.r2}</p>
                  <div className={`inline-block mt-6 px-10 py-5 rounded-full text-3xl font-bold border-4 ${
                    result.confianza === "Alta" ? "bg-green-500/30 border-green-400 text-green-300" :
                    result.confianza === "Media" ? "bg-yellow-500/30 border-yellow-400 text-yellow-300" :
                    "bg-red-500/30 border-red-400 text-red-300"
                  }`}>
                    Confianza: {result.confianza}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
                  {result.tiempos.map((t, i) => (
                    <div key={i} className="bg-black/50 rounded-xl p-4 text-center border border-purple-500/30">
                      <div className="text-cyan-300 text-xs font-mono">n = {ENTRADAS[i].toLocaleString()}</div>
                      <div className="text-xl font-bold text-emerald-400 mt-1">
                        {typeof t === "string" ? t + " ms" : t + " ms"}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}