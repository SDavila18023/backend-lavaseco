import supabase from "../config/db.js";

export const getBills = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("factura")
      .select(`
        id_factura, 
        cod_factura, 
        fecha_creacion_fact, 
        fecha_final_fact, 
        valor_fact,
        estado, 
        cliente (
          nombre_cliente, 
          tel_cliente,
          sucursal_cliente (
            sucursal (
              nom_sucursal,
              direccion_suc
            )
          )
        ),
        factura_detalle (
          id_factura_detalle, 
          especificacion_prenda, 
          cantidad_prendas, 
          valor_uni_prenda
        )
      `);

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const createBill = async (req, res) => {
  try {
    const {
      cliente,
      sucursal,
      cod_factura,
      fecha_creacion_fact,
      fecha_final_fact,
      valor_fact,
      factura_detalle,
    } = req.body;

    if (
      !cliente ||
      !cliente.nombre_cliente ||
      !cliente.tel_cliente ||
      !sucursal ||
      !sucursal.nom_sucursal ||
      !sucursal.direccion_suc ||
      !cod_factura ||
      !fecha_creacion_fact ||
      !valor_fact ||
      !factura_detalle ||
      factura_detalle.length === 0
    ) {
      return res.status(400).json({
        error:
          "Todos los campos son obligatorios, incluyendo cliente, sucursal y detalles de la factura.",
      });
    }

    const { data: clienteData, error: clienteError } = await supabase
      .from("cliente")
      .insert([
        {
          nombre_cliente: cliente.nombre_cliente,
          tel_cliente: cliente.tel_cliente,
        },
      ])
      .select();

    if (clienteError) throw clienteError;
    const id_cliente = clienteData[0].id_cliente;

    const { data: sucursalData, error: sucursalError } = await supabase
      .from("sucursal")
      .insert([
        {
          nom_sucursal: sucursal.nom_sucursal,
          direccion_suc: sucursal.direccion_suc,
        },
      ])
      .select();

    if (sucursalError) throw sucursalError;
    const id_sucursal = sucursalData[0].id_sucursal;

    const { error: sucursalClienteError } = await supabase
      .from("sucursal_cliente")
      .insert([{ id_cliente, id_sucursal }]);

    if (sucursalClienteError) throw sucursalClienteError;

    const { data: facturaData, error: facturaError } = await supabase
      .from("factura")
      .insert([
        {
          cod_factura,
          fecha_creacion_fact,
          fecha_final_fact,
          valor_fact,
          id_cliente,
        },
      ])
      .select();

    if (facturaError) throw facturaError;
    const id_factura = facturaData[0].id_factura;

    const detalleData = factura_detalle.map((detalle) => ({
      ...detalle,
      id_factura,
    }));

    const { error: detalleError } = await supabase
      .from("factura_detalle")
      .insert(detalleData);

    if (detalleError) throw detalleError;

    res.status(201).json({
      message: "Factura, cliente, sucursal y detalles creados exitosamente",
      cliente: clienteData,
      sucursal: sucursalData,
      factura: facturaData,
      detalles: detalleData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBill = async (req, res) => {
  try {
    console.log("Parámetros recibidos:", req.params);
    console.log("Cuerpo de la solicitud:", req.body);

    const { idFactura } = req.params; 
    const { fecha_final_fact, valor_fact } = req.body;

    if (!idFactura || isNaN(idFactura) || !valor_fact) {
      return res.status(400).json({
        error: "idFactura (número) y valor_fact son obligatorios.",
      });
    }

    const facturaId = parseInt(idFactura, 10); 


    const { data: existingBill, error: fetchError } = await supabase
      .from("factura")
      .select("id_factura, estado")
      .eq("id_factura", facturaId)
      .single();

    if (fetchError) throw fetchError;
    if (!existingBill) {
      return res.status(404).json({ message: "Factura no encontrada" });
    }

  
    const updateData = { valor_fact };
    if (fecha_final_fact) {
      updateData.fecha_final_fact = fecha_final_fact;
      updateData.estado = "Entregado"; 
    }


    const { data, error } = await supabase
      .from("factura")
      .update(updateData)
      .eq("id_factura", facturaId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ message: "Factura actualizada exitosamente", factura: data });
  } catch (error) {
    console.error("Error al actualizar la factura:", error);
    res.status(500).json({ error: error.message });
  }
};





export const changeState = async (req, res) => {
  const { idFactura } = req.params;

  try {
    const { data: factura, error: errorSelect } = await supabase
      .from("factura")
      .select("estado")
      .eq("id_factura", idFactura)
      .single();

    if (errorSelect) throw errorSelect;
    if (!factura)
      return res.status(404).json({ message: "Factura no encontrada" });

    const estadoActual = factura.estado;
    const nuevoEstado =
      estadoActual === "Pendiente" ? "Entregado" : "Pendiente";

    const fechaFinal =
      nuevoEstado === "Entregado"
        ? new Date().toISOString().split("T")[0]
        : null;

    const { data, error: errorUpdate } = await supabase
      .from("factura")
      .update({
        estado: nuevoEstado,
        fecha_final_fact: fechaFinal,
      })
      .eq("id_factura", idFactura)
      .select()
      .single();

    if (errorUpdate) throw errorUpdate;

    res.status(200).json({
      message: "Estado de factura actualizado correctamente",
      factura: data,
    });
  } catch (error) {
    console.error("Error al actualizar el estado de la factura:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteBill = async (req, res) => {
  try {
    console.log("Parámetros recibidos:", req.params);

    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ error: "El id de la factura es requerido" });
    }

    const facturaId = parseInt(id, 10);
    if (isNaN(facturaId)) {
      return res
        .status(400)
        .json({ error: "El id de la factura debe ser un número válido" });
    }

    const { error: informeDeleteError } = await supabase
      .from("informe")
      .delete()
      .eq("id_factura", facturaId);

    if (informeDeleteError) throw informeDeleteError;

    const { error: facturaDeleteError } = await supabase
      .from("factura")
      .delete()
      .eq("id_factura", facturaId);

    if (facturaDeleteError) throw facturaDeleteError;

    res.status(200).json({ message: "Factura eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
