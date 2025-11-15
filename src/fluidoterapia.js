const fs = require('fs');
const path = require('path');

// Cargar datos clínicos desde los archivos JSON
const fluidosData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../assets/fluidos.json')));
const guidelinesData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../assets/guidelines.json')));

/**
 * Calcula el déficit de fluidos.
 * @param {number} peso - Peso del paciente en kg.
 * @param {number} dh - Porcentaje de deshidratación.
 * @returns {number} Volumen de déficit en ml.
 */
function calcularDeficit(peso, dh) {
  if (peso <= 0 || dh < 0) {
    return 0;
  }
  // Fórmula: peso (kg) × %DH × 10
  return peso * dh * 10;
}

/**
 * Calcula el volumen de mantenimiento.
 * @param {string} especie - 'dog' o 'cat'.
 * @param {number} peso - Peso del paciente en kg.
 * @returns {object} Rango de mantenimiento {min, max} en ml/día.
 */
function calcularMantenimiento(especie, peso) {
  const mantenimientoInfo = fluidosData.maintenance[especie];
  if (!mantenimientoInfo || peso <= 0) {
    return { min: 0, max: 0 };
  }
  const min = mantenimientoInfo.min * peso;
  const max = mantenimientoInfo.max * peso;
  return { min, max };
}

/**
 * Calcula las pérdidas gastrointestinales.
 * @param {number} peso - Peso del paciente en kg.
 * @param {boolean} vomito - Si hay vómito.
 * @param {boolean} diarrea - Si hay diarrea.
 * @returns {object} Rango de pérdidas {min, max} en ml.
 */
function calcularPerdidasGI(peso, vomito, diarrea) {
    let minPerdidas = 0;
    let maxPerdidas = 0;
    if (vomito) {
        minPerdidas += fluidosData.gi_losses.vomit.min_ml_per_kg * peso;
        maxPerdidas += fluidosData.gi_losses.vomit.max_ml_per_kg * peso;
    }
    if (diarrea) {
        minPerdidas += fluidosData.gi_losses.diarrhea.min_ml_per_kg * peso;
        maxPerdidas += fluidosData.gi_losses.diarrhea.max_ml_per_kg * peso;
    }
    return { min: minPerdidas, max: maxPerdidas };
}

/**
 * Calcula el volumen necesario para una solución glucosada.
 * C1 * V1 = C2 * V2  => V1 = (C2 * V2) / C1
 * @param {number} c1 - Concentración de la dextrosa de partida (%).
 * @param {number} v2 - Volumen final de la solución deseada (ml).
 * @param {number} c2 - Concentración final de la solución deseada (%).
 * @returns {number} Volumen de la solución de partida a añadir (ml).
 */
function calcularVolumenGlucosado(c1, v2, c2) {
    if (c1 <= 0 || c2 < 0 || v2 < 0) {
        return 0;
    }
    return (c2 * v2) / c1;
}

/**
 * Verifica si la concentración de dextrosa es segura para vía periférica.
 * @param {number} concentracionFinal - Concentración final de dextrosa (%).
 * @returns {object} Objeto con la validación { esSeguro: boolean, mensaje: string }.
 */
function validarDextrosaPeriferica(concentracionFinal) {
    const maxConcentracion = guidelinesData.dextrose?.peripheral_max_concentration_percent || 7.5; // Default si no existe
    const source = guidelinesData.dextrose?.source || 'desconocida';
    if (concentracionFinal > maxConcentracion) {
        return {
            esSeguro: false,
            mensaje: `ALERTA (fuente: ${source}): La concentración de dextrosa (${concentracionFinal}%) supera el máximo recomendado para vía periférica (${maxConcentracion}%).`
        };
    }
    return { esSeguro: true, mensaje: '' };
}


module.exports = {
  calcularDeficit,
  calcularMantenimiento,
  calcularPerdidasGI,
  calcularVolumenGlucosado,
  validarDextrosaPeriferica
};
