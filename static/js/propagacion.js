// Constantes físicas del experimento en el pabellón FISI
const FRECUENCIA_MHZ = 2400; 
const POTENCIA_ROUTER_DBM = 20; 

function calcularSenalTeorica(distanciaMetros) {
    if (distanciaMetros <= 0.2) distanciaMetros = 0.2;
    let distanciaKm = distanciaMetros / 1000;
    let fspl = (20 * Math.log10(distanciaKm)) + (20 * Math.log10(FRECUENCIA_MHZ)) + 32.44;
    return POTENCIA_ROUTER_DBM - fspl;
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Definir fuente global
        Chart.defaults.font.family = "'Inter', sans-serif";

        const respuesta = await fetch('/api/datos');
        const datosBackend = await respuesta.json();

        if (datosBackend.error) {
            console.error("Error del backend en mediciones:", datosBackend.error);
            return;
        }

        // 1. Mapeo y procesamiento de coordenadas del CSV
        const datosProcesados = datosBackend.map(punto => {
            let rssiReal = punto.dbm_medido !== undefined ? punto.dbm_medido : punto.dbm_promedio;
            let distancia = 0;

            if (punto.distancia_router_m !== undefined) {
                distancia = punto.distancia_router_m;
            } else if (punto.x !== undefined && punto.y !== undefined) {
                // Distancia euclidiana al punto de origen del Access Point (0, 10)
                distancia = Math.sqrt(Math.pow(punto.x - 0, 2) + Math.pow(punto.y - 10, 2));
                distancia = Math.round(distancia * 100) / 100;
            }

            return {
                distancia: distancia,
                rssiReal: Number(rssiReal) // Forzado a número puro
            };
        });

        // 2. Ordenar de menor a mayor distancia para que la línea no se cruce caóticamente
        datosProcesados.sort((a, b) => a.distancia - b.distancia);

        const etiquetasEjeX = [];
        const serieRealRSSI = [];
        const serieTeoricaFSPL = [];
        const cuerpoTablaHTML = document.querySelector('#tablaPropagacion tbody');
        
        cuerpoTablaHTML.innerHTML = ""; // Limpiar residuos antes de llenar

        // 3. Llenado de arreglos numéricos y filas de la tabla
        datosProcesados.forEach(punto => {
            let rssiTeorico = calcularSenalTeorica(punto.distancia);
            let pérdidaExtra = Math.abs(punto.rssiReal - rssiTeorico);

            etiquetasEjeX.push(`${punto.distancia} m`);
            serieRealRSSI.push(punto.rssiReal);
            
            // CRUCIAL: Guardar como número puro usando Number() para que Chart.js pueda leerlo
            serieTeoricaFSPL.push(Number(rssiTeorico.toFixed(2)));

            let fila = `<tr>
                            <td style="font-weight: 500; color: #cbd5e1;">${punto.distancia} metros</td>
                            <td style="color: #f43f5e; font-weight: 600;">${punto.rssiReal} dBm</td>
                            <td style="color: #38bdf8; font-weight: 500;">${rssiTeorico.toFixed(2)} dBm</td>
                            <td style="color: #e2e8f0;">${pérdidaExtra.toFixed(2)} dB</td>
                        </tr>`;
            cuerpoTablaHTML.innerHTML += fila;
        });

        // 4. Renderizado seguro de la gráfica con auto-escala
        const ctx = document.getElementById('graficaPropagacion').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: etiquetasEjeX,
                datasets: [
                    {
                        label: 'Señal Real Medida (Pasillo FISI)',
                        data: serieRealRSSI,
                        borderColor: '#f43f5e', 
                        backgroundColor: 'rgba(244, 63, 94, 0.06)',
                        borderWidth: 3,
                        pointBackgroundColor: '#f43f5e',
                        fill: true,
                        tension: 0.2 
                    },
                    {
                        label: 'Señal Teórica Ideal (Modelo FSPL)',
                        data: serieTeoricaFSPL,
                        borderColor: '#38bdf8', 
                        borderDash: [6, 4], 
                        borderWidth: 2.5,
                        pointBackgroundColor: '#38bdf8',
                        fill: false,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#f8fafc', font: { size: 13, weight: '500' } }
                    }
                },
                scales: {
                    y: {
                        title: { display: true, text: 'Intensidad de Señal Potencia (dBm)', color: '#f8fafc', font: { size: 14, weight: '600' } },
                        ticks: { color: '#cbd5e1' },
                        grid: { color: 'rgba(255, 255, 255, 0.08)' }
                        // Dejamos que auto-escale para evitar colisiones por desbordamiento
                    },
                    x: {
                        title: { display: true, text: 'Distancia al AP (Metros)', color: '#f8fafc', font: { size: 14, weight: '600' } },
                        ticks: { color: '#cbd5e1' },
                        grid: { color: 'rgba(255, 255, 255, 0.08)' }
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error crítico en la inicialización del gráfico:", error);
    }
});