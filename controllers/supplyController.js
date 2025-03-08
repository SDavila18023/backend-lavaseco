import supabase from "../config/db.js";

export const getSupplyCost = async (req, res) => {
  try {
    const { data, error } = await supabase.from("insumo").select(
      `
        id_insumo,
        nom_insumo,
        valor_insumo,
        insumo_detalle:insumo_detalle(id_detalle_insumo, detalle:detalle_insumo(*))
      `
    );

    if (error) throw error;

    const formattedData = data.map((insumo) => ({
      ...insumo,
      detalle_insumo: insumo.insumo_detalle.map((detalle) => detalle.detalle),
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

    const id_insumo = Math.floor(Math.random() * 1000000);

    const { data: insumoData, error: insumoError } = await supabase
      .from("insumo")
      .insert([{ id_insumo, nom_insumo, valor_insumo }])
      .select()
      .single();

    if (insumoError) throw insumoError;

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
    console.log(req.body);

    const { data: insumoExistente, error: errorInsumo } = await supabase
      .from("insumo")
      .select("id_insumo")
      .eq("id_insumo", id)
      .single();

    if (errorInsumo || !insumoExistente) throw new Error("El insumo no existe o hubo un error.");

    const { data: detallesActuales, error: errorDetalles } = await supabase
      .from("insumo_detalle")
      .select("id_detalle_insumo")
      .eq("id_insumo", id);

    if (errorDetalles) throw new Error("Error al obtener los detalles del insumo.");

    const detallesIdsActuales = detallesActuales.map(d => d.id_detalle_insumo);
    const detallesIdsNuevos = detalle_insumo.map(d => d.id_detalle_insumo);

    const detallesAEliminar = detallesIdsActuales.filter(id => !detallesIdsNuevos.includes(id));

    if (detallesAEliminar.length > 0) {
      await supabase.from("insumo_detalle").delete().in("id_detalle_insumo", detallesAEliminar);
      await supabase.from("detalle_insumo").delete().in("id_detalle_insumo", detallesAEliminar);
    }

    for (const item of detalle_insumo) {
      const { id_detalle_insumo, concepto, peso } = item;

      if (id_detalle_insumo) {
        await supabase
          .from("detalle_insumo")
          .update({ concepto, peso })
          .eq("id_detalle_insumo", id_detalle_insumo);
      } else {
        const { data: newDetalle, error: errorInsert } = await supabase
          .from("detalle_insumo")
          .insert([{ concepto, peso }])
          .select("id_detalle_insumo")
          .single();

        if (errorInsert) throw errorInsert;
        await supabase.from("insumo_detalle").insert([
          { id_insumo: id, id_detalle_insumo: newDetalle.id_detalle_insumo },
        ]);
      }
    }

    const { data: updatedInsumo, error: errorUpdate } = await supabase
      .from("insumo")
      .update({ nom_insumo, valor_insumo })
      .eq("id_insumo", id)
      .select(`
        id_insumo,
        nom_insumo,
        valor_insumo,
        detalle_insumo:insumo_detalle(id_detalle_insumo, detalle_insumo:detalle_insumo(*))
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

    const { error: errorDeleteGastos } = await supabase
      .from("gastos")
      .delete()
      .eq("id_insumo", id);

    if (errorDeleteGastos) throw errorDeleteGastos;

    const { data: detalles, error: errorDetalles } = await supabase
      .from("insumo_detalle")
      .select("id_detalle_insumo")
      .eq("id_insumo", id);

    if (errorDetalles) throw errorDetalles;

    const detalleIds = detalles.map((detalle) => detalle.id_detalle_insumo);

    const { error: errorDeleteInsumoDetalle } = await supabase
      .from("insumo_detalle")
      .delete()
      .eq("id_insumo", id);

    if (errorDeleteInsumoDetalle) throw errorDeleteInsumoDetalle;

    if (detalleIds.length > 0) {
      const { error: errorDeleteDetalles } = await supabase
        .from("detalle_insumo")
        .delete()
        .in("id_detalle_insumo", detalleIds);

      if (errorDeleteDetalles) throw errorDeleteDetalles;
    }

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
