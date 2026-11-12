/*
 * Motor de predicción de resultados de fútbol — GeoMav.
 * Port a JavaScript del prototipo Python (predecir_resultado.py).
 *
 * Reglas:
 * 1) Entrega probabilidad G/E/P y marcador exacto más probable.
 * 2) Ligas y copas se calculan SEPARADAS (las copas se excluyen del cálculo).
 * 3) Peso temporal: partidos más recientes pesan más (decaimiento exponencial).
 *
 * Requiere una instancia de base de datos sql.js (objeto `db` con .prepare()).
 */
(function (global) {
  "use strict";

  const VIDA_MEDIA_DIAS = 730;
  const ELO_K = 20;
  const ELO_VENTAJA_LOCAL = 60;
  const ELO_INICIAL = 1500;
  const MAX_GOLES_MATRIZ = 7;
  const CUP_KEYWORDS = ["Copa", "Libertadores", "Sudamericana", "América"];

  function esCopa(competicion) {
    if (!competicion) return false;
    return CUP_KEYWORDS.some((k) => competicion.includes(k));
  }

  function diasEntre(fechaStr, fechaReferencia) {
    const f = new Date(fechaStr + "T00:00:00Z");
    if (isNaN(f.getTime())) return null;
    const ms = fechaReferencia.getTime() - f.getTime();
    return Math.max(0, Math.round(ms / 86400000));
  }

  function pesoTemporal(fechaStr, fechaReferencia) {
    const dias = diasEntre(fechaStr, fechaReferencia);
    if (dias === null) return 0.3;
    return Math.pow(0.5, dias / VIDA_MEDIA_DIAS);
  }

  function consultar(db, sql, params) {
    const stmt = db.prepare(sql);
    if (params) stmt.bind(params);
    const filas = [];
    while (stmt.step()) filas.push(stmt.get());
    stmt.free();
    return filas;
  }

  function calcularEloLiga(db, pais, competicion, fechaReferencia) {
    const filas = consultar(
      db,
      `SELECT fecha, equipo_local, equipo_visita, goles_local, goles_visita
       FROM partidos
       WHERE pais = ? AND competicion = ? AND fecha IS NOT NULL AND fecha <= ?
       ORDER BY fecha`,
      [pais, competicion, fechaReferencia.toISOString().slice(0, 10)]
    );
    const elo = {};
    for (const [, local, visita, gl, gv] of filas) {
      if (!(local in elo)) elo[local] = ELO_INICIAL;
      if (!(visita in elo)) elo[visita] = ELO_INICIAL;
      const esperadoLocal =
        1 / (1 + Math.pow(10, -((elo[local] + ELO_VENTAJA_LOCAL) - elo[visita]) / 400));
      const resultadoLocal = gl > gv ? 1 : gl < gv ? 0 : 0.5;
      elo[local] += ELO_K * (resultadoLocal - esperadoLocal);
      elo[visita] += ELO_K * (1 - resultadoLocal - (1 - esperadoLocal));
    }
    return elo;
  }

  function estadisticasEquipo(db, equipo, pais, competicion, fechaReferencia) {
    const filas = consultar(
      db,
      `SELECT fecha, equipo_local, equipo_visita, goles_local, goles_visita
       FROM partidos
       WHERE pais = ? AND competicion = ? AND (equipo_local = ? OR equipo_visita = ?)`,
      [pais, competicion, equipo, equipo]
    );

    let gfLocal = 0, gcLocal = 0, pesoLocal = 0;
    let gfVisita = 0, gcVisita = 0, pesoVisita = 0;
    let g = 0, e = 0, p = 0;

    for (const [fecha, local, visita, gl, gv] of filas) {
      const w = pesoTemporal(fecha, fechaReferencia);
      let resultado;
      if (local === equipo) {
        gfLocal += gl * w; gcLocal += gv * w; pesoLocal += w;
        resultado = gl > gv ? "G" : gl === gv ? "E" : "P";
      } else {
        gfVisita += gv * w; gcVisita += gl * w; pesoVisita += w;
        resultado = gv > gl ? "G" : gl === gv ? "E" : "P";
      }
      if (resultado === "G") g++; else if (resultado === "E") e++; else p++;
    }

    return {
      gfLocal: pesoLocal ? gfLocal / pesoLocal : null,
      gcLocal: pesoLocal ? gcLocal / pesoLocal : null,
      gfVisita: pesoVisita ? gfVisita / pesoVisita : null,
      gcVisita: pesoVisita ? gcVisita / pesoVisita : null,
      jugados: filas.length, ganados: g, empatados: e, perdidos: p,
    };
  }

  function promedioLiga(db, pais, competicion) {
    const filas = consultar(
      db,
      `SELECT AVG(goles_local), AVG(goles_visita) FROM partidos WHERE pais = ? AND competicion = ?`,
      [pais, competicion]
    );
    return filas[0];
  }

  function factorial(n) {
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  function poissonPmf(k, lam) {
    return Math.exp(-lam) * Math.pow(lam, k) / factorial(k);
  }

  function predecir(db, local, visita, pais, competicion, fechaReferencia) {
    if (esCopa(competicion)) {
      throw new Error(`"${competicion}" es una copa — este motor solo predice partidos de liga.`);
    }
    fechaReferencia = fechaReferencia || new Date();

    const [mediaGl, mediaGv] = promedioLiga(db, pais, competicion);
    const eqL = estadisticasEquipo(db, local, pais, competicion, fechaReferencia);
    const eqV = estadisticasEquipo(db, visita, pais, competicion, fechaReferencia);

    const fzaAtaqueLocal = eqL.gfLocal ? eqL.gfLocal / mediaGl : 1.0;
    const fzaDefensaVisita = eqV.gcVisita ? eqV.gcVisita / mediaGl : 1.0;
    const lamLocal = mediaGl * fzaAtaqueLocal * fzaDefensaVisita;

    const fzaAtaqueVisita = eqV.gfVisita ? eqV.gfVisita / mediaGv : 1.0;
    const fzaDefensaLocal = eqL.gcLocal ? eqL.gcLocal / mediaGv : 1.0;
    const lamVisita = mediaGv * fzaAtaqueVisita * fzaDefensaLocal;

    const matriz = [];
    for (let gl = 0; gl < MAX_GOLES_MATRIZ; gl++) {
      for (let gv = 0; gv < MAX_GOLES_MATRIZ; gv++) {
        matriz.push({ gl, gv, p: poissonPmf(gl, lamLocal) * poissonPmf(gv, lamVisita) });
      }
    }

    let pLocal = 0, pEmpate = 0, pVisita = 0;
    for (const { gl, gv, p } of matriz) {
      if (gl > gv) pLocal += p;
      else if (gl === gv) pEmpate += p;
      else pVisita += p;
    }

    const top5 = [...matriz].sort((a, b) => b.p - a.p).slice(0, 5);
    const elo = calcularEloLiga(db, pais, competicion, fechaReferencia);

    return {
      lamLocal, lamVisita, pLocal, pEmpate, pVisita, top5,
      eloLocal: elo[local] ?? ELO_INICIAL,
      eloVisita: elo[visita] ?? ELO_INICIAL,
      statsLocal: eqL, statsVisita: eqV,
    };
  }

  function listarPaises(db) {
    return consultar(db, `SELECT DISTINCT pais FROM partidos ORDER BY pais`).map((f) => f[0]);
  }

  function listarCompeticiones(db, pais) {
    const filas = consultar(
      db,
      `SELECT DISTINCT competicion FROM partidos WHERE pais = ? ORDER BY competicion`,
      [pais]
    );
    return filas.map((f) => f[0]).filter((c) => !esCopa(c));
  }

  function listarEquipos(db, pais, competicion) {
    const filas = consultar(
      db,
      `SELECT equipo_local AS e FROM partidos WHERE pais = ? AND competicion = ?
       UNION
       SELECT equipo_visita AS e FROM partidos WHERE pais = ? AND competicion = ?
       ORDER BY e`,
      [pais, competicion, pais, competicion]
    );
    return filas.map((f) => f[0]);
  }

  global.MotorPrediccion = {
    predecir, esCopa, calcularEloLiga, estadisticasEquipo, promedioLiga,
    listarPaises, listarCompeticiones, listarEquipos,
  };
})(window);
