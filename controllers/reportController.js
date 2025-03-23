import supabase from "../config/db.js";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export const fetchReport = async (req, res) => {
  try {
    const { type } = req.params;
    let query;

    switch (type) {
      case "informe":
        query = supabase
          .from("informe")
          .select(
            `
                id_informe,
                fecha_generado,
                id_factura,
                id_gastos
              `
          )
          .order("fecha_generado", { ascending: false });
        break;

      case "gastos":
        query = supabase
          .from("gastos")
          .select(
            `
                id_gastos,
                concepto_gasto,
                fecha_compra,
                total_gastos,
                id_insumo,
                id_gasto_emp,
                id_gasto_esp
              `
          )
          .order("fecha_compra", { ascending: false });
        break;

      case "factura":
        query = supabase
          .from("factura")
          .select(
            `
              id_factura,
              cod_factura,
              estado,
              fecha_creacion_fact,
              fecha_final_fact,
              valor_fact,
              id_cliente,
              cliente (
                nombre_cliente,
                tel_cliente,
                sucursal_cliente (
                  sucursal (
                    nom_sucursal,
                    direccion_suc
                  )
                )
              )
            `
          )
          .order("fecha_creacion_fact", { ascending: false });
        break;

      default:
        return res.status(400).json({ error: "Tipo de reporte inválido" });
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchReportByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { term } = req.query;

    if (!term) {
      return res.status(400).json({ error: "Término de búsqueda requerido" });
    }

    let query;

    switch (type) {
      case "informe":
        query = supabase
          .from("informe")
          .select(
            `
                id_informe,
                fecha_generado,
                id_factura,
                id_gastos
              `
          )
          .or(
            `
                id_informe.ilike.%${term}%,
                fecha_generado.ilike.%${term}%,
                id_factura.ilike.%${term}%,
                id_gastos.ilike.%${term}%
              `
          )
          .order("fecha_generado", { ascending: false });
        break;

      case "gastos":
        query = supabase
          .from("gastos")
          .select(
            `
                id_gastos,
                concepto_gasto,
                fecha_compra,
                total_gastos,
                id_insumo,
                id_gasto_emp,
                id_gasto_esp
              `
          )
          .or(
            `
                concepto_gasto.ilike.%${term}%,
                total_gastos.ilike.%${term}%
              `
          )
          .order("fecha_compra", { ascending: false });
        break;

      case "factura":
        query = supabase
          .from("factura")
          .select(
            `
                id_factura,
                cod_factura,
                fecha_creacion_fact,
                fecha_final_fact,
                valor_fact,
                id_factura_detalle,
                cliente (
                  nombre_cliente,
                  tel_cliente,
                  sucursal_cliente (
                    sucursal (
                      nom_sucursal,
                      direccion_suc
                    )
                  )
                )
              `
          )
          .or(
            `
                cod_factura.ilike.%${term}%,
                valor_fact.ilike.%${term}%,
                cliente.nombre_cliente.ilike.%${term}%,
                cliente.tel_cliente.ilike.%${term}%,
                cliente.sucursal_cliente.sucursal.nom_sucursal.ilike.%${term}%,
                cliente.sucursal_cliente.sucursal.direccion_suc.ilike.%${term}%
              `
          )
          .order("fecha_creacion_fact", { ascending: false });
        break;

      default:
        return res.status(400).json({ error: "Tipo de reporte inválido" });
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generatePDF = async (req, res) => {
  try {
    const { type } = req.params;
    const { data } = req.body;

    console.log("Datos recibidos:", data);

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    const doc = new jsPDF();
    const primaryColor = [89, 65, 169];
    const secondaryColor = [50, 50, 90];
    const accentColor = [255, 140, 0];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

    const titles = {
      informe: "REPORTE DE INFORMES",
      gastos: "REPORTE DE GASTOS",
      factura: "REPORTE DE FACTURAS",
    };

    const title = titles[type] || "REPORTE";
    const titleWidth =
      (doc.getStringUnitWidth(title) * 18) / doc.internal.scaleFactor;
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text(title, (pageWidth - titleWidth) / 2, 25);

    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(0.5);
    doc.line(14, 30, pageWidth - 14, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

    const fecha = new Date().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const hora = new Date().toLocaleTimeString("es-ES");

    doc.text(`Fecha de generación: ${fecha}`, 14, 38);
    doc.text(`Hora: ${hora}`, 14, 44);
    doc.text(`Cantidad de registros: ${data.length}`, 14, 50);

    let columns,
      total = 0;
    switch (type) {
      case "informe":
        columns = [
          { header: "ID", dataKey: "id_informe" },
          { header: "Fecha", dataKey: "fecha_generado" },
          { header: "ID Factura", dataKey: "id_factura" },
          { header: "ID Gastos", dataKey: "id_gastos" },
        ];
        break;
      case "gastos":
        columns = [
          { header: "ID", dataKey: "id_gastos" },
          { header: "Concepto", dataKey: "concepto_gasto" },
          { header: "Fecha", dataKey: "fecha_compra" },
          {
            header: "Total",
            dataKey: "total_gastos",
            format: (value) => `$${parseFloat(value).toLocaleString("es-ES")}`,
          },
        ];
        total = data.reduce(
          (sum, item) => sum + parseFloat(item.total_gastos || 0),
          0
        );
        break;
      case "factura":
        columns = [
          { header: "Código", dataKey: "cod_factura" },
          { header: "Cliente", dataKey: "cliente.nombre_cliente" },
          { header: "Teléfono", dataKey: "cliente.tel_cliente" },
          {
            header: "Sucursal",
            dataKey: "cliente.sucursal_cliente.0.sucursal.nom_sucursal",
          },
          { header: "Fecha Creación", dataKey: "fecha_creacion_fact" },
          { header: "Fecha Entrega", dataKey: "fecha_final_fact" },
          { header: "Estado", dataKey: "estado" },
          {
            header: "Valor",
            dataKey: "valor_fact",
            format: (value) => `$${parseFloat(value).toLocaleString("es-ES")}`,
          },
        ];
        total = data.reduce(
          (sum, item) => sum + parseFloat(item.valor_fact || 0),
          0
        );
        break;
      default:
        return res.status(400).json({ error: "Tipo de reporte inválido" });
    }

    const rows = data.map((item) => {
      const row = {};
      columns.forEach((col) => {
        let value;
        if (col.dataKey.includes(".")) {
          const keys = col.dataKey.split(".");
          value = keys.reduce((obj, key) => {
            if (Array.isArray(obj) && !isNaN(key)) {
              return obj[parseInt(key)] || "N/A";
            }
            return obj?.[key] || "N/A";
          }, item);
        } else {
          value = item[col.dataKey] || "N/A";
        }

        row[col.dataKey] = col.format ? col.format(value) : value;
      });
      return row;
    });

    doc.autoTable({
      columns,
      body: rows,
      startY: 60,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        total_gastos: { halign: "right" },
        valor_fact: { halign: "right" },
      },
      alternateRowStyles: { fillColor: [245, 245, 255] },
      margin: { top: 60, left: 14, right: 14 },
      didDrawPage: function (data) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Página ${doc.internal.getNumberOfPages()}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
    });

    if (type === "gastos" || type === "factura") {
      const finalY = doc.autoTable.previous.finalY + 10;

      doc.setFillColor(245, 245, 255);
      doc.rect(pageWidth - 100, finalY - 5, 86, 12, "F");

      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.line(pageWidth - 100, finalY - 5, pageWidth - 14, finalY - 5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("TOTAL:", pageWidth - 100 + 5, finalY + 2);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      const totalFormatted = `$${total.toLocaleString("es-ES")} COP`;
      doc.text(
        totalFormatted,
        pageWidth -
          14 -
          (doc.getStringUnitWidth(totalFormatted) * 11) /
            doc.internal.scaleFactor,
        finalY + 2
      );
    }

    const pdfBuffer = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${type}-report-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`
    );
    return res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("Error al generar el PDF:", error);
    return res.status(500).json({ error: error.message });
  }
};
