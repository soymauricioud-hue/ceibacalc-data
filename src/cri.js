const fs = require('fs');
const path = require('path');

// Cargar datos de fármacos
const farmacosData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../assets/farmacos.json')));

/**
 * Parsea una cadena de concentración (ej: "50 mcg/ml") a un objeto.
 * @param {string} concentracionStr - La cadena de concentración.
 * @returns {{valor: number, unidad: string, unidadVolumen: string}}
 */
function parseConcentracion(concentracionStr) {
    const [valor, unidades] = concentracionStr.split(' ');
    const [unidadMasa, unidadVolumen] = unidades.split('/');
    return {
        valor: parseFloat(valor),
        unidad: unidadMasa,
        unidadVolumen: unidadVolumen
    };
}

/**
 * Parsea una cadena de dosis (ej: "2 mcg/kg" o "2-10 mcg/kg/hr") a un objeto.
 * @param {string} dosisStr - La cadena de la dosis.
 * @returns {{min: number, max: number, unidad: string}}
 */
function parseDosis(dosisStr) {
    const [range, unidad] = dosisStr.split(' ');
    const rangeParts = range.split('-');
    const min = parseFloat(rangeParts[0]);
    const max = parseFloat(rangeParts[1] || rangeParts[0]); // Si no hay rango, max = min
    return { min, max, unidad };
}

/**
 * Calcula el volumen para un bolo.
 * @param {string} nombreFarmaco - Nombre del fármaco.
 * @param {number} peso - Peso del paciente en kg.
 * @returns {{boloMl: number, boloDosis: number, unidad: string, advertencia: string}}
 */
function calcularBolo(nombreFarmaco, peso) {
    const farmaco = farmacosData.find(f => f.nombre.toLowerCase() === nombreFarmaco.toLowerCase());
    if (!farmaco || !farmaco.bolo || peso <= 0) {
        return { boloMl: 0, boloDosis: 0, unidad: '', advertencia: 'Fármaco o bolo no encontrado.' };
    }

    const concentracion = parseConcentracion(farmaco.concentracion);
    const dosis = parseDosis(farmaco.bolo);

    // Dosis total en la unidad del fármaco (mcg o mg)
    const dosisTotal = dosis.min * peso;

    // Volumen en ml
    const boloMl = dosisTotal / concentracion.valor;

    return {
        boloMl: boloMl.toFixed(2),
        boloDosis: dosisTotal,
        unidad: dosis.unidad,
        advertencia: farmaco.advertencias || ''
    };
}

/**
 * Calcula la tasa de infusión para un CRI.
 * @param {string} nombreFarmaco - Nombre del fármaco.
 * @param {number} peso - Peso del paciente en kg.
 * @param {number} dosisSeleccionada - La dosis específica seleccionada por el usuario (ej: 5 mcg/kg/min).
 * @returns {{criMlHr: number, criDosisMcgKgMin: number, advertencia: string}}
 */
function calcularCRI(nombreFarmaco, peso, dosisSeleccionada) {
    const farmaco = farmacosData.find(f => f.nombre.toLowerCase() === nombreFarmaco.toLowerCase());
    if (!farmaco || !farmaco.cri || peso <= 0 || dosisSeleccionada <= 0) {
        return { criMlHr: 0, criDosisMcgKgMin: 0, advertencia: 'Fármaco o CRI no encontrado.' };
    }

    const concentracion = parseConcentracion(farmaco.concentracion); // ej: { valor: 50, unidad: 'mcg', unidadVolumen: 'ml' }
    const dosisRange = parseDosis(farmaco.cri); // ej: { min: 2, max: 10, unidad: 'mcg/kg/hr' }

    // Estandarizar todo a mcg/kg/min para el cálculo
    let dosisMcgKgMin = dosisSeleccionada;
    if (dosisRange.unidad.includes('/hr')) {
        dosisMcgKgMin = dosisSeleccionada / 60;
    }

    // 1. Dosis total por minuto (mcg/min)
    const mcgPorMin = peso * dosisMcgKgMin;

    // 2. Dosis total por hora (mcg/h)
    const mcgPorHora = mcgPorMin * 60;

    // 3. Volumen por hora (ml/h)
    const mlPorHora = mcgPorHora / concentracion.valor; // Suponiendo que la concentración está en mcg/ml

    // Advertencia especial para lidocaína en gatos
    let advertencia = farmaco.advertencias || '';
    if (nombreFarmaco.toLowerCase() === 'lidocaina' && farmaco.especie_sensible === 'gato') {
         advertencia = `ALERTA: ${advertencia}`;
    }

    return {
        criMlHr: mlPorHora.toFixed(2),
        criDosisMcgKgMin: dosisMcgKgMin,
        advertencia
    };
}

module.exports = {
    calcularBolo,
    calcularCRI,
    parseDosis,
    farmacosData // Exportar para la UI
};
