const { calcularDeficit, calcularMantenimiento, calcularPerdidasGI, calcularVolumenGlucosado, validarDextrosaPeriferica } = require('./fluidoterapia.js');
const { calcularBolo, calcularCRI, parseDosis, farmacosData } = require('./cri.js');
const { saveData, loadData } = require('./database.js');

window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service worker registered.', reg))
            .catch(err => console.error('Service worker registration failed:', err));
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    // Load last saved data
    const lastData = await loadData();
    if (lastData) {
        document.getElementById('patient-id').value = lastData.patientId || '';
        document.getElementById('patient-weight').value = lastData.patientWeight || '';
        document.getElementById('patient-species').value = lastData.patientSpecies || 'dog';
        document.getElementById('dehydration-percent').value = lastData.dehydrationPercent || '';
        document.getElementById('vomito-check').checked = lastData.vomitoCheck || false;
        document.getElementById('diarrea-check').checked = lastData.diarreaCheck || false;
    }

    // Populate drug selector
    const drugSelect = document.getElementById('drug-select');
    farmacosData.forEach(farmaco => {
        const option = document.createElement('option');
        option.value = farmaco.nombre;
        option.textContent = farmaco.nombre;
        drugSelect.appendChild(option);
    });

    // Update CRI unit label on drug change
    drugSelect.addEventListener('change', () => {
        const selectedDrug = farmacosData.find(f => f.nombre === drugSelect.value);
        const criUnitLabel = document.getElementById('cri-unit-label');
        if (selectedDrug && selectedDrug.cri) {
            criUnitLabel.textContent = parseDosis(selectedDrug.cri).unidad;
        } else {
            criUnitLabel.textContent = '';
        }
    });
    // Trigger change to set initial unit
    drugSelect.dispatchEvent(new Event('change'));

    // --- Event Listeners ---
    document.getElementById('calculate-fluids-btn').addEventListener('click', displayFluidResults);
    document.getElementById('calculate-dextrose-btn').addEventListener('click', displayDextroseResults);
    document.getElementById('calculate-cri-btn').addEventListener('click', displayCriResults);
});

function getPatientData() {
    const peso = parseFloat(document.getElementById('patient-weight').value);
    const especie = document.getElementById('patient-species').value;
    if (isNaN(peso) || peso <= 0) {
        alert('Por favor, ingrese un peso válido.');
        return null;
    }
    return { peso, especie };
}

function displayFluidResults() {
    const patient = getPatientData();
    if (!patient) return;

    const dh = parseFloat(document.getElementById('dehydration-percent').value);
    const vomito = document.getElementById('vomito-check').checked;
    const diarrea = document.getElementById('diarrea-check').checked;

    const deficit = calcularDeficit(patient.peso, dh);
    const mantenimiento = calcularMantenimiento(patient.especie, patient.peso);
    const perdidas = calcularPerdidasGI(patient.peso, vomito, diarrea);

    const totalMin = deficit + mantenimiento.min + perdidas.min;
    const totalMax = deficit + mantenimiento.max + perdidas.max;

    const ritmoMinMlH = totalMin / 24;
    const ritmoMaxMlH = totalMax / 24;

    const ritmoMinMlKgH = ritmoMinMlH / patient.peso;
    const ritmoMaxMlKgH = ritmoMaxMlH / patient.peso;

    saveCurrentData(); // Guardar datos después de un cálculo exitoso

    const resultsDiv = document.getElementById('fluid-results');
    resultsDiv.innerHTML = `
        --- CÁLCULO DE FLUIDOTERAPIA ---
        - Déficit a corregir: ${deficit.toFixed(2)} ml
        - Mantenimiento (24h): ${mantenimiento.min.toFixed(2)} - ${mantenimiento.max.toFixed(2)} ml
        - Pérdidas GI estimadas (24h): ${perdidas.min.toFixed(2)} - ${perdidas.max.toFixed(2)} ml

        --- VOLUMEN TOTAL (24h) ---
        - Rango Total: ${totalMin.toFixed(2)} - ${totalMax.toFixed(2)} ml

        --- RITMO DE INFUSIÓN (24h) ---
        - Ritmo (ml/h): ${ritmoMinMlH.toFixed(2)} - ${ritmoMaxMlH.toFixed(2)} ml/h
        - Ritmo (ml/kg/h): ${ritmoMinMlKgH.toFixed(2)} - ${ritmoMaxMlKgH.toFixed(2)} ml/kg/h
    `;
}

function displayDextroseResults() {
    const c1 = parseFloat(document.getElementById('dextrose-start-conc').value);
    const v2 = parseFloat(document.getElementById('dextrose-final-volume').value);
    const c2 = parseFloat(document.getElementById('dextrose-final-conc').value);

    if (isNaN(c1) || isNaN(v2) || isNaN(c2)) {
        alert('Por favor, ingrese todos los valores para el cálculo de dextrosa.');
        return;
    }

    const v1 = calcularVolumenGlucosado(c1, v2, c2);
    const volumenBase = v2 - v1;
    const validacion = validarDextrosaPeriferica(c2);

    saveCurrentData(); // Guardar datos después de un cálculo exitoso

    const resultsDiv = document.getElementById('dextrose-results');
    resultsDiv.innerHTML = `
        --- PREPARACIÓN DE SOLUCIÓN GLUCOSADA ---
        - Para obtener ${v2} ml al ${c2}%, necesita:
        - Dextrosa al ${c1}%: ${v1.toFixed(2)} ml
        - Fluido base (ej. LRS): ${volumenBase.toFixed(2)} ml

        ${validacion.esSeguro ? '' : `<div class="alert">${validacion.mensaje}</div>`}
    `;
}


function displayCriResults() {
    const patient = getPatientData();
    if (!patient) return;

    const farmacoNombre = document.getElementById('drug-select').value;
    const dosis = parseFloat(document.getElementById('cri-dose').value);

    if (isNaN(dosis) || dosis <= 0) {
        alert('Por favor, ingrese una dosis de CRI válida.');
        return;
    }

    const boloResult = calcularBolo(farmacoNombre, patient.peso);
    const criResult = calcularCRI(farmacoNombre, patient.peso, dosis);

    saveCurrentData(); // Guardar datos después de un cálculo exitoso

    const resultsDiv = document.getElementById('cri-results');
    resultsDiv.innerHTML = `
        --- CÁLCULO DE BOLO ---
        - Dosis Total: ${boloResult.boloDosis.toFixed(2)} ${boloResult.unidad}
        - Volumen a administrar: ${boloResult.boloMl} ml
        ${boloResult.advertencia ? `<div class="alert">${boloResult.advertencia}</div>` : ''}

        --- CÁLCULO DE CRI ---
        - Ritmo de infusión: ${criResult.criMlHr} ml/h
        ${criResult.advertencia ? `<div class="alert">${criResult.advertencia}</div>` : ''}
    `;
}

const { generatePdf } = require('./pdfGenerator.js');

// --- PDF Generation ---
document.getElementById('generate-pdf-btn').addEventListener('click', () => {
    const patientId = document.getElementById('patient-id').value;
    const patient = getPatientData();
    if (!patient) return;

    const patientData = {
        id: patientId,
        peso: patient.peso,
        especie: patient.especie,
    };

    const fluidResults = document.getElementById('fluid-results').innerText;
    const dextroseResults = document.getElementById('dextrose-results').innerText;
    const criResultsText = document.getElementById('cri-results').innerText;
    const farmacoNombre = document.getElementById('drug-select').value;

    const criData = criResultsText ? { texto: criResultsText, farmacoNombre: farmacoNombre } : null;

    generatePdf(patientData, fluidResults, dextroseResults, criData);
});

function saveCurrentData() {
    const dataToSave = {
        patientId: document.getElementById('patient-id').value,
        patientWeight: document.getElementById('patient-weight').value,
        patientSpecies: document.getElementById('patient-species').value,
        dehydrationPercent: document.getElementById('dehydration-percent').value,
        vomitoCheck: document.getElementById('vomito-check').checked,
        diarreaCheck: document.getElementById('diarrea-check').checked,
        // Nota: No guardamos los campos de CRI o Dextrosa ya que son más transaccionales
    };
    saveData(dataToSave);
}
