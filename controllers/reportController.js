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
                tel_cliente
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
                  tel_cliente
                )
              `
          )
          .or(
            `
                cod_factura.ilike.%${term}%,
                valor_fact.ilike.%${term}%,
                cliente.nombre_cliente.ilike.%${term}%,
                cliente.tel_cliente.ilike.%${term}%
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

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(89, 65, 169);

    const titles = {
      informe: "Reporte de Informes",
      gastos: "Reporte de Gastos",
      factura: "Reporte de Facturas",
    };

    doc.text(titles[type] || "Reporte", 14, 20);

    let columns;
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
          { header: "Total", dataKey: "total_gastos" },
        ];
        break;
      case "factura":
        columns = [
          { header: "Código", dataKey: "cod_factura" },
          { header: "Estado", dataKey: "estado" },
          { header: "Fecha Creación", dataKey: "fecha_creacion_fact" },
          { header: "Fecha Entrega", dataKey: "fecha_final_fact" },
          { header: "Valor", dataKey: "valor_fact" },
          { header: "Cliente", dataKey: "cliente.nombre_cliente" },
          { header: "Teléfono", dataKey: "cliente.tel_cliente" },
        ];
        break;
      default:
        return res.status(400).json({ error: "Tipo de reporte inválido" });
    }

    const rows = data.map((item) => {
      const row = {};
      columns.forEach((col) => {
        if (col.dataKey.includes(".")) {
          const [obj, key] = col.dataKey.split(".");
          row[col.dataKey] = item[obj]?.[key] || "N/A";
        } else {
          row[col.dataKey] = item[col.dataKey] || "N/A";
        }
      });
      return row;
    });

    doc.autoTable({
      columns,
      body: rows,
      startY: 30,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: [89, 65, 169],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 255] },
      margin: { top: 25 },
    });

    const fecha = new Date().toLocaleDateString("es-ES");
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Fecha de generación: ${fecha}`,
      14,
      doc.internal.pageSize.height - 10
    );

    const pdfBuffer = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${type}-report.pdf`
    );
    return res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("Error al generar el PDF:", error);
    return res.status(500).json({ error: error.message });
  }
};
