document.addEventListener("DOMContentLoaded", () => {
    mostrarCuentas();
    mostrarAsiento();
    mostrarFacturas();

    // Eventos para los botones
    document.getElementById("btnAddCuenta").addEventListener("click", () => {
        window.location.href = "/addcuentas";
    });

    document.getElementById("btnAsientoInicial").addEventListener("click", () => {
        window.location.href = "/asiento";
    });

    document.getElementById("btnNuevaFactura").addEventListener("click", () => {
        window.location.href = "/factura";
    });
});

async function mostrarCuentas() {
    try {
        const res = await fetch("/catalogo/cuentas");
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

        const { categorias, subcategorias, cuentas } = await res.json();

        const container = document.getElementById("Cuentas");
        if (!container) {
            console.error("No se encontró el contenedor con id 'Cuentas'");
            return;
        }

        // Crear mapas para agrupar subcategorías y cuentas
        const subcategoriasPorCategoria = {};
        subcategorias.forEach(sub => {
            if (!subcategoriasPorCategoria[sub.parent_id]) subcategoriasPorCategoria[sub.parent_id] = [];
            subcategoriasPorCategoria[sub.parent_id].push(sub);
        });

        const cuentasPorSubcategoria = {};
        cuentas.forEach(cuenta => {
            if (!cuentasPorSubcategoria[cuenta.parent_id]) cuentasPorSubcategoria[cuenta.parent_id] = [];
            cuentasPorSubcategoria[cuenta.parent_id].push(cuenta);
        });

        // Ordenar categorías según palabra clave en el nombre
        categorias.sort((a, b) => {
            function getIndex(categoriaNombre) {
                categoriaNombre = categoriaNombre.toLowerCase();

                if (categoriaNombre.includes("activo")) return 0;
                if (categoriaNombre.includes("pasivo")) return 1;
                if (categoriaNombre.includes("capital")) return 2;
                return 99; // Categorías no esperadas al final
            }

            const idxA = getIndex(a.Cuenta);
            const idxB = getIndex(b.Cuenta);

            return idxA - idxB;
        });

        // Crear tabla
        const table = document.createElement("table");
        table.border = "1";
        table.style.borderCollapse = "collapse";
        table.style.width = "100%";

        // Header
        const thead = document.createElement("thead");
        thead.innerHTML = `
            <tr>
                <th>Número</th>
                <th>Cuenta</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        // Recorrer categorías en orden
        categorias.forEach(cat => {
            // Fila categoría (negrita)
            const trCat = document.createElement("tr");
            trCat.innerHTML = `
                <td>${cat.id}</td>
                <td><strong>${cat.Cuenta}</strong></td>
            `;
            tbody.appendChild(trCat);

            // Subcategorías de esta categoría
            const subcats = subcategoriasPorCategoria[cat.id] || [];
            subcats.forEach(sub => {
                // Fila subcategoría (sin guiones)
                const trSub = document.createElement("tr");
                trSub.innerHTML = `
                    <td>${sub.id}</td>
                    <td>${sub.Cuenta}</td>
                `;
                tbody.appendChild(trSub);

                // Cuentas de esta subcategoría
                const cuentasDeSub = cuentasPorSubcategoria[sub.id] || [];
                cuentasDeSub.forEach(cuenta => {
                    // Fila cuenta (sin guiones)
                    const trCuenta = document.createElement("tr");
                    trCuenta.innerHTML = `
                        <td>${cuenta.id}</td>
                        <td>${cuenta.Cuenta}</td>
                    `;
                    tbody.appendChild(trCuenta);
                });
            });
        });

        table.appendChild(tbody);
        container.innerHTML = "";
        container.appendChild(table);

    } catch (error) {
        console.error("Error al obtener cuentas:", error);
    }
}

window.onload = mostrarCuentas;

async function mostrarAsiento() {
    const div = document.getElementById("Asiento");

    try {
        const res = await fetch("/apertura/asiento");
        const data = await res.json();

        if (!data.success) {
            div.innerHTML = "<p>Error al cargar asiento</p>";
            return;
        }

        let html = `
            <table border="1" cellpadding="5" cellspacing="0">
                <tr>
                    <th>LO QUE LA EMPRESA TIENE</th>
                    <th>MONTO</th>
                    <th>POR QUÉ LO TIENE</th>
                    <th>MONTO</th>
                </tr>
        `;

        data.data.forEach(item => {
            html += `
                <tr>
                    <td>${item.Cuenta}</td>
                    <td>$${Number(item.Monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                    <td></td>
                    <td></td>
                </tr>
            `;
        });

        html += `
                <tr>
                    <td></td>
                    <td></td>
                    <td>CAPITAL SOCIAL</td>
                    <td>$${Number(data.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                    <td>TOTAL ACTIVO</td>
                    <td>$${Number(data.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                    <td>TOTAL CAPITAL</td>
                    <td>$${Number(data.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                </tr>
            </table>
        `;

        div.innerHTML = html;
    } catch (err) {
        console.error(err);
        div.innerHTML = "<p>Error de conexión con el servidor</p>";
    }
}

async function mostrarFacturas() {
    const div = document.getElementById("Facturas");
    if (!div) return;

    try {
        const res = await fetch("/facturas/saldos");
        const data = await res.json();

        if (!data.success || data.data.length === 0) {
            div.innerHTML = "<p>No hay facturas registradas.</p>";
            return;
        }

        div.innerHTML = "";

        const facturasMap = new Map();
        data.data.forEach(row => {
            if (!facturasMap.has(row.id_factura)) {
                facturasMap.set(row.id_factura, {
                    info: {
                        id_factura: row.id_factura,
                        tipo: row.tipo,
                        fecha: row.fecha,
                        subtotal: row.subtotal,
                        iva: row.iva,
                        total: row.total,
                        descripcion: row.descripcion || ""
                    },
                    cuentas: []
                });
            }
            facturasMap.get(row.id_factura).cuentas.push(row);
        });

        for (const [id, factura] of facturasMap.entries()) {
            const activos = factura.cuentas.filter(c => c.id_categoria === 1);
            const pasivos = factura.cuentas.filter(c => c.id_categoria === 2);

            const sumaSaldos = arr => arr.reduce((acc, cur) => acc + Number(cur.saldo), 0);

            const totalActivos = sumaSaldos(activos);
            const totalPasivos = pasivos.reduce((acc, cur) => acc + Math.abs(Number(cur.saldo)), 0);
            const totalCapital = totalActivos - totalPasivos;
            const totalPasivoCapital = totalPasivos + totalCapital;

            let html = `
                <h3>Factura ID: ${factura.info.id_factura} - Tipo: ${factura.info.tipo}</h3>
                <table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse: collapse; margin-bottom: 10px;">
                    <thead>
                        <tr>
                            <th colspan="2" style="text-align: center; font-style: italic;">${factura.info.descripcion || "Sin descripción"}</th>
                        </tr>
                        <tr>
                            <th colspan="2" style="text-align: center; font-style: italic;">Fecha: ${factura.info.fecha}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="vertical-align: top; width: 50%;">
                                <strong>ACTIVO</strong>
                                <table border="0" cellpadding="3" cellspacing="0" style="width: 100%;">
                                    <tbody>
            `;

            activos.forEach(c => {
                html += `<tr><td>${c.Cuenta}</td><td style="text-align:right;">$${Number(c.saldo).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td></tr>`;
            });

            html += `
                                    <tr style="border-top: 1px solid black; font-weight: bold;">
                                        <td>TOTAL ACTIVO</td>
                                        <td style="text-align:right;">$${totalActivos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    </tbody>
                                </table>
                            </td>
                            <td style="vertical-align: top; width: 50%;">
                                <table border="0" cellpadding="3" cellspacing="0" style="width: 100%;">
                                    <tr>
                                        <td style="width: 50%; vertical-align: top;">
                                            <strong>PASIVO</strong>
                                            <table border="0" cellpadding="3" cellspacing="0" style="width: 100%;">
                                                <tbody>
                `;

            pasivos.forEach(c => {
                html += `<tr><td>${c.Cuenta}</td><td style="text-align:right;">$${Math.abs(Number(c.saldo)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td></tr>`;
            });

            html += `
                                                <tr style="border-top: 1px solid black; font-weight: bold;">
                                                    <td>TOTAL PASIVO</td>
                                                    <td style="text-align:right;">$${totalPasivos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                        <td style="width: 50%; vertical-align: top;">
                                            <strong>CAPITAL SOCIAL</strong>
                                            <table border="0" cellpadding="3" cellspacing="0" style="width: 100%;">
                                                <tbody>
                                                    <tr>
                                                        <td>Capital Social</td>
                                                        <td style="text-align:right;">$${totalCapital.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                    <tr style="border-top: 1px solid black; font-weight: bold;">
                                                        <td>Total Capital</td>
                                                        <td style="text-align:right;">$${totalCapital.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold; text-align: right;">TOTAL ACTIVO</td>
                            <td style="font-weight: bold; text-align: right;">TOTAL PASIVO + CAPITAL</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold; text-align: right;">$${totalActivos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                            <td style="font-weight: bold; text-align: right;">$${totalPasivoCapital.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tbody>
                </table>

                <button onclick="toggleDetalles(${factura.info.id_factura})" style="margin-bottom: 10px;">Mostrar/Ocultar Detalles Completos</button>
                <div id="detalles-${factura.info.id_factura}" style="display:none; padding: 10px; margin-bottom: 30px;">
                    <em>Cargando detalles...</em>
                </div>
            `;

            div.innerHTML += html;
        }

    } catch (error) {
        console.error("Error al mostrar facturas con balance:", error);
        div.innerHTML = "<p>Error al cargar facturas con balance.</p>";
    }
}

// Función para mostrar/ocultar detalles completos y cargarlos si es necesario
async function toggleDetalles(id_factura) {
    const contenedor = document.getElementById(`detalles-${id_factura}`);
    if (!contenedor) return;

    if (contenedor.style.display === "none") {
        // Mostrar contenedor
        contenedor.style.display = "block";

        // Si ya tiene contenido distinto a "Cargando detalles...", no recargar
        if (!contenedor.dataset.cargado) {
            contenedor.innerHTML = "<em>Cargando detalles...</em>";
            try {
                const res = await fetch(`/facturas/${id_factura}/detalles`);
                const data = await res.json();

                if (data.success && data.data.length > 0) {
                    let detallesHtml = `<table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th>Cuenta</th>
                                <th>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                    `;

                    data.data.forEach(det => {
                        detallesHtml += `
                            <tr>
                                <td>${det.Cuenta}</td>
                                <td style="text-align:right;">$${Number(det.monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                            </tr>
                        `;
                    });

                    detallesHtml += "</tbody></table>";
                    contenedor.innerHTML = detallesHtml;
                    contenedor.dataset.cargado = "true";
                } else {
                    contenedor.innerHTML = "<p>No hay detalles para esta factura.</p>";
                }
            } catch (err) {
                console.error("Error al cargar detalles:", err);
                contenedor.innerHTML = "<p>Error al cargar detalles.</p>";
            }
        }
    } else {
        // Ocultar contenedor
        contenedor.style.display = "none";
    }
}
