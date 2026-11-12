/*
 * Motor de predicción de resultados de fútbol — GeoMav.
 * Port a JavaScript del prototipo Python (predecir_resultado.py).
 *
 * Reglas:
 * 1) Entrega probabilidad G/E/P y marcador exacto más probable.
 * 2) Ligas y copas se calculan SEPARADAS (las copas se excluyen del cálculo).
 * 3) Peso temporal: partidos más recientes pesan más (decaimiento exponencial).
 *
 * Esquema de la base (normalizado para reducir tamaño de descarga):
 *   paises(id, nombre), competiciones(id, nombre), temporadas(id, nombre), equipos(id, nombre)
 *   partidos(pais_id, competicion_id, temporada_id, fecha, local_id, visita_id, goles_local, goles_visita)
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

  function idDe(db, tabla, nombre) {
    const filas = consultar(db, `SELECT id FROM ${tabla} WHERE nombre = ?`, [nombre]);
    return filas.length ? filas[0][0] : null;
  }

  function calcularEloLiga(db, paisId, compId, fechaReferencia) {
    const filas = consultar(
      db,
      `SELECT p.fecha, el.nombre, ev.nombre, p.goles_local, p.goles_visita
       FROM partidos p
       JOIN equipos el ON el.id = p.local_id
       JOIN equipos ev ON ev.id = p.visita_id
       WHERE p.pais_id = ? AND p.competicion_id = ? AND p.fecha IS NOT NULL AND p.fecha <= ?
       ORDER BY p.fecha`,
      [paisId, compId, fechaReferencia.toISOString().slice(0, 10)]
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

  function estadisticasEquipo(db, equipoId, equipoNombre, paisId, compId, fechaReferencia) {
    const filas = consultar(
      db,
      `SELECT p.fecha, p.local_id, p.goles_local, p.goles_visita
       FROM partidos p
       WHERE p.pais_id = ? AND p.competicion_id = ? AND (p.local_id = ? OR p.visita_id = ?)`,
      [paisId, compId, equipoId, equipoId]
    );

    let gfLocal = 0, gcLocal = 0, pesoLocal = 0;
    let gfVisita = 0, gcVisita = 0, pesoVisita = 0;
    let g = 0, e = 0, p = 0;

    for (const [fecha, localId, gl, gv] of filas) {
      const w = pesoTemporal(fecha, fechaReferencia);
      let resultado;
      if (localId === equipoId) {
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

  function promedioLiga(db, paisId, compId) {
    const filas = consultar(
      db,
      `SELECT AVG(goles_local), AVG(goles_visita) FROM partidos WHERE pais_id = ? AND competicion_id = ?`,
      [paisId, compId]
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

    const paisId = idDe(db, "paises", pais);
    const compId = idDe(db, "competiciones", competicion);
    const localId = idDe(db, "equipos", local);
    const visitaId = idDe(db, "equipos", visita);
    if (paisId === null || compId === null) throw new Error("País o competición no encontrados.");
    if (localId === null || visitaId === null) throw new Error("Equipo no encontrado.");

    const [mediaGl, mediaGv] = promedioLiga(db, paisId, compId);
    const eqL = estadisticasEquipo(db, localId, local, paisId, compId, fechaReferencia);
    const eqV = estadisticasEquipo(db, visitaId, visita, paisId, compId, fechaReferencia);

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
    const elo = calcularEloLiga(db, paisId, compId, fechaReferencia);

    return {
      lamLocal, lamVisita, pLocal, pEmpate, pVisita, top5,
      eloLocal: elo[local] ?? ELO_INICIAL,
      eloVisita: elo[visita] ?? ELO_INICIAL,
      statsLocal: eqL, statsVisita: eqV,
    };
  }

  function listarPaises(db) {
    return consultar(db, `SELECT nombre FROM paises ORDER BY nombre`).map((f) => f[0]);
  }

  function listarCompeticiones(db, pais) {
    const filas = consultar(
      db,
      `SELECT DISTINCT c.nombre
       FROM partidos p
       JOIN paises pa ON pa.id = p.pais_id
       JOIN competiciones c ON c.id = p.competicion_id
       WHERE pa.nombre = ? ORDER BY c.nombre`,
      [pais]
    );
    return filas.map((f) => f[0]).filter((c) => !esCopa(c));
  }

  function listarEquipos(db, pais, competicion) {
    const filas = consultar(
      db,
      `SELECT el.nombre AS e
       FROM partidos p
       JOIN paises pa ON pa.id = p.pais_id
       JOIN competiciones c ON c.id = p.competicion_id
       JOIN equipos el ON el.id = p.local_id
       WHERE pa.nombre = ? AND c.nombre = ?
       UNION
       SELECT ev.nombre AS e
       FROM partidos p
       JOIN paises pa ON pa.id = p.pais_id
       JOIN competiciones c ON c.id = p.competicion_id
       JOIN equipos ev ON ev.id = p.visita_id
       WHERE pa.nombre = ? AND c.nombre = ?
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
