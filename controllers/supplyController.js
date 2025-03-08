import supabase from "../config/db.js";

export const getSupplyCost = async (req, res) => {
  try {
    // Obtener los insumos con sus detalles asociados usando la tabla intermedia
    const { data, error } = await supabase.from("insumo").select(
      `
        id_insumo,
        nom_insumo,
        valor_insumo,
        insumo_detalle:insumo_detalle(id_detalle_insumo, detalle:detalle_insumo(*))
      `
    );

    if (error) throw error;

    // Formatear los datos para que `detalle_insumo` sea un array dentro de cada `insumo`
    const formattedData = data.map((insumo) => ({
      ...insumo,
      detalle_insumo: insumo.insumo_detalle.map((detalle) => detalle.detalle), // Extraemos los detalles
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Error en getSupplyCost:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createSupplyCost = async (req, res) => {
  try {
    console.log(req.body);
    const { nom_insumo, valor_insumo, detalle_insumo } = req.body;

    if (
      !detalle_insumo ||
      !Array.isArray(detalle_insumo) ||
      detalle_insumo.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "detalle_insumo es requerido y debe ser un array" });
    }

    // Generar ID aleatorio para insumo
    const id_insumo = Math.floor(Math.random() * 1000000);

    // Insertar insumo
    const { data: insumoData, error: insumoError } = await supabase
      .from("insumo")
      .insert([{ id_insumo, nom_insumo, valor_insumo }])
      .select()
      .single();

    if (insumoError) throw insumoError;

    // Insertar detalle_insumo
    const detalleConIDs = detalle_insumo.map(({ concepto, peso }) => ({
      id_detalle_insumo: Math.floor(Math.random() * 1000000),
      concepto,
      peso,
    }));

    const { data: detalleData, error: detalleError } = await supabase
      .from("detalle_insumo")
      .insert(detalleConIDs)
      .select();

    if (detalleError) throw detalleError;

    // Insertar en tabla intermedia insumo_detalle
    const insumoDetalleData = detalleData.map(({ id_detalle_insumo }) => ({
      id_insumo,
      id_detalle_insumo,
    }));

    const { error: insumoDetalleError } = await supabase
      .from("insumo_detalle")
      .insert(insumoDetalleData);

    if (insumoDetalleError) throw insumoDetalleError;

    res.status(201).json({ insumo: insumoData, detalle: detalleData });
  } catch (error) {
    console.error("Error en createSupplyCost:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateSupplyCost = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_insumo, valor_insumo, detalle_insumo } = req.body;

    // Verificar si el insumo existe
    const { data: insumoExistente, error: errorInsumo } = await supabase
      .from("insumo")
      .select("id_detalle_insumo")
      .eq("id_insumo", id)
      .single();

    if (errorInsumo) throw new Error("El insumo no existe o hubo un error.");

    const id_detalle_insumo = insumoExistente.id_detalle_insumo;
    if (!id_detalle_insumo) throw new Error("El insumo no tiene un id_detalle_insumo válido");

    // Actualizar detalles del insumo
    for (const item of detalle_insumo) {
      const { concepto, peso } = item;

      const { error: errorDetalle } = await supabase
        .from("detalle_insumo")
        .update({ concepto, peso })
        .eq("id_detalle_insumo", id_detalle_insumo);

      if (errorDetalle) throw errorDetalle;
    }

    // Actualizar insumo
    const { data: updatedInsumo, error: errorUpdate } = await supabase
      .from("insumo")
      .update({ nom_insumo, valor_insumo })
      .eq("id_insumo", id)
      .select(`
        id_insumo,
        nom_insumo,
        valor_insumo,
        id_detalle_insumo,
        detalle_insumo:detalle_insumo!insumo_id_detalle_insumo_fkey(*)
      `)
      .single();

    if (errorUpdate) throw errorUpdate;

    res.json(updatedInsumo);
  } catch (error) {
    console.error("Error en updateSupplyCost:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteSupplyCost = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 1. Eliminar los registros en "gastos" que hacen referencia al insumo
    const { error: errorDeleteGastos } = await supabase
      .from("gastos")
      .delete()
      .eq("id_insumo", id);

    if (errorDeleteGastos) throw errorDeleteGastos;

    // 🔹 2. Obtener los id_detalle_insumo asociados a este insumo
    const { data: detalles, error: errorDetalles } = await supabase
      .from("insumo_detalle")
      .select("id_detalle_insumo")
      .eq("id_insumo", id);

    if (errorDetalles) throw errorDetalles;

    const detalleIds = detalles.map((detalle) => detalle.id_detalle_insumo);

    // 🔹 3. Eliminar las relaciones en la tabla intermedia
    const { error: errorDeleteInsumoDetalle } = await supabase
      .from("insumo_detalle")
      .delete()
      .eq("id_insumo", id);

    if (errorDeleteInsumoDetalle) throw errorDeleteInsumoDetalle;

    // 🔹 4. Eliminar los registros en detalle_insumo si ya no están referenciados
    if (detalleIds.length > 0) {
      const { error: errorDeleteDetalles } = await supabase
        .from("detalle_insumo")
        .delete()
        .in("id_detalle_insumo", detalleIds);

      if (errorDeleteDetalles) throw errorDeleteDetalles;
    }

    // 🔹 5. Finalmente, eliminar el insumo
    const { error: errorDeleteInsumo } = await supabase
      .from("insumo")
      .delete()
      .eq("id_insumo", id);

    if (errorDeleteInsumo) throw errorDeleteInsumo;

    res.status(204).send();
  } catch (error) {
    console.error("Error en deleteSupplyCost:", error);
    res.status(500).json({ error: error.message });
  }
};
