const { jsPDF } = require("jspdf");

function generatePdf(patientData, fluidResults, dextroseResults, criResults) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20; // Posición vertical inicial

    // --- Encabezado ---
    doc.setFontSize(20);
    doc.text("Informe Clínico - CeibaCalc", pageWidth / 2, y, { align: "center" });
    y += 10;
    doc.setFontSize(10);
    doc.text(`Fecha y Hora: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: "center" });
    y += 15;

    // --- Datos del Paciente ---
    doc.setFontSize(14);
    doc.text("1. Datos del Paciente", 15, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`- ID Paciente: ${patientData.id || 'N/A'}`, 20, y);
    y += 7;
    doc.text(`- Especie: ${patientData.especie}`, 20, y);
    y += 7;
    doc.text(`- Peso: ${patientData.peso} kg`, 20, y);
    y += 15;

    // --- Resultados de Fluidoterapia ---
    if (fluidResults) {
        doc.setFontSize(14);
        doc.text("2. Plan de Fluidoterapia (Cálculos para 24h)", 15, y);
        y += 8;
        doc.setFontSize(12);
        doc.text(fluidResults.replace(/---/g, '').replace(/[ ]{2,}/g, ' '), 20, y, { maxWidth: 170 });
        y += 40; // Ajustar espacio
    }

    // --- Resultados de Solución Glucosada ---
    if (dextroseResults) {
        doc.setFontSize(14);
        doc.text("3. Preparación de Solución Glucosada", 15, y);
        y += 8;
        doc.setFontSize(12);
        // Limpiar el texto para el PDF
        const cleanDextroseText = dextroseResults
            .replace(/---/g, '')
            .replace(/[ ]{2,}/g, ' ')
            .replace(/ALERTA.*?:/g, '\nALERTA:');
        doc.text(cleanDextroseText, 20, y, { maxWidth: 170 });
        y += 30;
    }


    // --- Resultados de CRI y Analgesia ---
    if (criResults) {
        doc.setFontSize(14);
        doc.text(`4. Plan de Analgesia - ${criResults.farmacoNombre}`, 15, y);
        y += 8;
        doc.setFontSize(12);
        // Limpiar y formatear el texto para el PDF
        const cleanCriText = criResults.texto
            .replace(/---/g, '')
            .replace(/[ ]{2,}/g, ' ')
            .replace(/ALERTA.*?:/g, '\nALERTA:');
        doc.text(cleanCriText, 20, y, { maxWidth: 170 });
        y += 40;
    }

    // --- Pie de Página ---
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 40, pageWidth - 15, pageHeight - 40);
    y = pageHeight - 30;
    doc.setFontSize(12);
    doc.text("Firma del Técnico Responsable:", 15, y);

    // Guardar el PDF
    doc.save(`CeibaCalc_Reporte_${patientData.id || 'paciente'}_${new Date().toISOString().slice(0,10)}.pdf`);
}

module.exports = { generatePdf };
