import supabase from "../config/db.js";

export const getDashboard = async (req, res) => {
  try {
    const { data: ingresosData, error: ingresosError } = await supabase
      .from("factura")
      .select("cod_factura,valor_fact, fecha_final_fact")
      .order("fecha_final_fact", { ascending: false });

    if (ingresosError) throw ingresosError;

    const { data: gastosData, error: gastosError } = await supabase
      .from("gastos")
      .select("total_gastos, concepto_gasto, fecha_compra")
      .order("fecha_compra", { ascending: false });

    if (gastosError) throw gastosError;

    const ingresos = ingresosData.map((fact) => ({
      codigo: fact.cod_factura || "Desconocido",
      fecha: fact.fecha_final_fact || "Desconocido",
      ingresos: fact.valor_fact,
    }));

    const gastos = gastosData.map((gasto) => ({
      concepto: gasto.concepto_gasto,
      costos: gasto.total_gastos,
      fecha: gasto.fecha_compra || "Desconocido",
    }));

    const dashboardData = {
      ingresos,
      gastos,
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Error obteniendo datos del dashboard:", error.message);
    res.status(500).json({ message: "Error al obtener datos del dashboard" });
  }
};
