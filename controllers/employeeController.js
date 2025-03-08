import supabase from "../config/db.js";

export const getEmployee = async (req, res) => {
  try {
    const { data, error } = await supabase.from("empleado").select("*");

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    res.status(500).json({ message: "Error al obtener empleados" });
  }
};

export const createEmployee = async (req, res) => {
  const { nom_empleado, tipo_emp, salario, tel_empleado, frecuencia_pago } = req.body;

  const { data, error } = await supabase
    .from("empleado")
    .insert([{ nom_empleado, tipo_emp, salario, tel_empleado, frecuencia_pago }])
    .select()
    .single();

  if (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_pago, monto } = req.body;

    if (!id || !tipo_pago || monto === undefined) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    if (!["prima", "liquidacion"].includes(tipo_pago)) {
      return res.status(400).json({ message: "Tipo de pago no válido" });
    }

    const updateData = { [tipo_pago]: monto };

    console.log("Actualizando empleado con:", updateData);

    const { data, error } = await supabase
      .from("empleado")
      .update(updateData)
      .eq("id_empleado", id);

    if (error) throw error;

    return res.status(200).json({ message: "Empleado actualizado", data });
  } catch (err) {
    return res.status(500).json({
      message: "Error al actualizar el empleado",
      error: err.message,
    });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("empleado")
      .delete()
      .eq("id_empleado", id);

    if (error) {
      throw error;
    }

    res.status(200).json({ message: "Empleado eliminado correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al eliminar el empleado", error: error.message });
  }
};
