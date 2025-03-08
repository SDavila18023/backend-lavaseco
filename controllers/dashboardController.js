import supabase from "../config/db.js";

export const getDashboard = async (req, res) => {
  try {
    // 🔹 Obtener ingresos desde la tabla factura
    const { data: ingresosData, error: ingresosError } = await supabase
      .from("factura")
      .select("cod_factura,valor_fact, fecha_final_fact")
      .order("fecha_final_fact", { ascending: false });

    if (ingresosError) throw ingresosError;

    // 🔹 Obtener gastos desde la tabla gastos
    const { data: gastosData, error: gastosError } = await supabase
      .from("gastos")
      .select("total_gastos, concepto_gasto, fecha_compra") // Solo obteniendo la tabla gastos
      .order("fecha_compra", { ascending: false });

    if (gastosError) throw gastosError;

    // 🔹 Formatear ingresos (evita valores nulos en la fecha)
    const ingresos = ingresosData.map((fact) => ({
      codigo: fact.cod_factura || "Desconocido",  
      fecha: fact.fecha_final_fact || "Desconocido",
      ingresos: fact.valor_fact,
    }));

    // 🔹 Formatear gastos (ahora solo usando la tabla gastos)
    const gastos = gastosData.map((gasto) => ({
      concepto: gasto.concepto_gasto,
      costos: gasto.total_gastos,
      fecha: gasto.fecha_compra || "Desconocido", // Evita valores nulos en fecha
    }));

    // 🔹 Estructura de respuesta clara
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
