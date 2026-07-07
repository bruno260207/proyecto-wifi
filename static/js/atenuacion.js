// atenuacion.js — Gráfica de barras y tabla de pérdida por material (Aula 3 - Brithny)
// Consume la ruta /api/atenuacion (app.py) que lee data/atenuacion.csv
// y calcula perdida_db = dbm_antes - dbm_despues si no viene ya calculada.

// --- Ilustraciones SVG simples por tipo de material (hechas a medida, sin depender de imágenes externas) ---
function obtenerIlustracionSVG(nombreMaterial) {
    const esMetal = nombreMaterial.toLowerCase().includes('casillero') || nombreMaterial.toLowerCase().includes('metal');

    // Pared de concreto (bloques) — base común
    const bloquesConcreto = `
        <rect x="0" y="0" width="160" height="120" fill="#334155"/>
        ${[0,1,2,3].map(fila => {
            const y = fila * 30;
            const offset = fila % 2 === 0 ? 0 : -20;
            let bloques = '';
            for (let i = -1; i < 5; i++) {
                bloques += `<rect x="${offset + i*40}" y="${y}" width="38" height="28" rx="2"
                    fill="#475569" stroke="#1e293b" stroke-width="2"/>`;
            }
            return bloques;
        }).join('')}
    `;

    if (esMetal) {
        // Concreto + casilleros metálicos
        return `
        <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" style="width:100%; max-width:200px; border-radius:8px;">
            ${bloquesConcreto}
            <rect x="20" y="15" width="120" height="90" rx="3" fill="#94a3b8" stroke="#1e293b" stroke-width="2"/>
            ${[0,1,2,3].map(i => `
                <rect x="${25 + i*30}" y="20" width="26" height="80" rx="2" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5"/>
                <circle cx="${25 + i*30 + 20}" cy="60" r="2.5" fill="#334155"/>
                <line x1="${25 + i*30 + 4}" y1="30" x2="${25 + i*30 + 22}" y2="30" stroke="#64748b" stroke-width="1"/>
            `).join('')}
        </svg>`;
    }

    // Concreto simple (paredes de aula)
    return `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" style="width:100%; max-width:200px; border-radius:8px;">
        ${bloquesConcreto}
    </svg>`;
}

// --- Mapeo de material -> foto real subida por el equipo ---
function obtenerFotoMaterial(nombreMaterial) {
    const texto = nombreMaterial.toLowerCase();
    if (texto.includes('casillero') || texto.includes('metal')) {
        return '/static/images/material_aula_b_casilleros.jpeg';
    }
    if (texto.includes('aula c')) {
        return '/static/images/material_aula_c_concreto.jpeg';
    }
    return '/static/images/material_aula_a_concreto.jpeg'; // Aula A (default / router)
}

// --- Construye la tarjeta con efecto flip: SVG de frente, foto real al voltear ---
function construirTarjetaMaterial(nombreMaterial) {
    return `
        <div class="flip-card">
            <div class="flip-card-inner">
                <div class="flip-card-front">
                    ${obtenerIlustracionSVG(nombreMaterial)}
                </div>
                <div class="flip-card-back">
                    <img src="${obtenerFotoMaterial(nombreMaterial)}" alt="${nombreMaterial}">
                </div>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        Chart.defaults.font.family = "'Inter', sans-serif";

        const respuesta = await fetch('/api/atenuacion');
        const datos = await respuesta.json();

        if (datos.error) {
            console.error("Error del backend en /api/atenuacion:", datos.error);
            return;
        }

        // --- Llenar la tabla ---
        const cuerpoTabla = document.querySelector('#tablaAtenuacion tbody');
        cuerpoTabla.innerHTML = "";

        const etiquetas = [];
        const perdidas = [];

        datos.forEach(fila => {
            const perdida = Number(fila.perdida_db);

            etiquetas.push(fila.material);
            perdidas.push(perdida);

            const tr = `<tr>
                <td style="font-weight: 500;">${fila.material}</td>
                <td style="color: #38bdf8;">${fila.dbm_antes} dBm</td>
                <td style="color: #f43f5e;">${fila.dbm_despues} dBm</td>
                <td style="color: #f8fafc; font-weight: 600;">${perdida.toFixed(1)} dB</td>
            </tr>`;
            cuerpoTabla.innerHTML += tr;
        });

        // --- Elementos del panel lateral interactivo ---
        const panelVacio = document.getElementById('panelMaterialVacio');
        const panelContenido = document.getElementById('panelMaterialContenido');

        function mostrarMaterialEnPanel(indice) {
            const fila = datos[indice];
            const perdida = Number(fila.perdida_db).toFixed(1);

            panelContenido.innerHTML = `
                <div style="display:flex; justify-content:center; margin-bottom:0.5rem;">
                    ${construirTarjetaMaterial(fila.material)}
                </div>
                <div style="font-weight:600; color:var(--text-main); font-size:0.95rem; margin-bottom:0.5rem; margin-top:0.75rem;">
                    ${fila.material}
                </div>
                <div style="color: var(--primary-color); font-weight:700; font-size:1.3rem;">
                    ${perdida} dB
                </div>
                <div style="color: var(--text-muted); font-size:0.8rem; margin-top:0.25rem;">
                    ${fila.dbm_antes} dBm → ${fila.dbm_despues} dBm
                </div>
            `;
            panelVacio.style.display = 'none';
            panelContenido.style.display = 'block';
        }

        // --- Gráfica de barras ---
        const ctx = document.getElementById('graficaAtenuacion').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: etiquetas,
                datasets: [{
                    label: 'Pérdida por atenuación (dB)',
                    data: perdidas,
                    backgroundColor: 'rgba(56, 189, 248, 0.6)',
                    borderColor: '#38bdf8',
                    borderWidth: 2,
                    borderRadius: 8,
                    maxBarThickness: 90
                }]
            },
            options: {
                responsive: true,
                onClick: (evento, elementos) => {
                    if (elementos.length > 0) {
                        mostrarMaterialEnPanel(elementos[0].index);
                    }
                },
                onHover: (evento, elementos) => {
                    evento.native.target.style.cursor = elementos.length ? 'pointer' : 'default';
                },
                plugins: {
                    legend: {
                        labels: { color: '#f8fafc', font: { size: 13, weight: '500' } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Pérdida (dB)', color: '#f8fafc', font: { size: 14, weight: '600' } },
                        ticks: { color: '#cbd5e1' },
                        grid: { color: 'rgba(255, 255, 255, 0.08)' }
                    },
                    x: {
                        ticks: { color: '#cbd5e1' },
                        grid: { display: false }
                    }
                }
            }
        });

        // Mostrar el primer material por defecto para que no se vea vacío al cargar
        if (datos.length > 0) {
            mostrarMaterialEnPanel(0);
        }

    } catch (error) {
        console.error("Error crítico al cargar la gráfica de atenuación:", error);
    }
});