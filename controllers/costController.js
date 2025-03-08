import supabase from "../config/db.js";

export const getCost = async (req, res) => {
  try {
    const { data, error } = await supabase.from("gastos").select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getCostSpecific = async (req, res) => {
  const { data, error } = await supabase.from("gasto_especifico").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const getCostSpecificById = async (req, res) => {
    
    
    const { id } = req.params;
    const { data, error } = await supabase.from("gasto_especifico").select("*").eq("id_gasto_esp", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
    }

export const createSpecificCost = async (req, res) => {
        console.log(req.body);
        
        // Generar un ID aleatorio (ajustar el rango si es necesario)
        const id_gasto_esp = Math.floor(Math.random() * 1000000);
    
        const { nom_gasto, valor_gasto_especifico } = req.body;
    
        const { data, error } = await supabase
          .from('gasto_especifico')
          .insert([{ id_gasto_esp, nom_gasto, valor_gasto_especifico }])
          .select()
          .single();
        
        if (error) {
          console.log(error);
          return res.status(500).json({ error: error.message });
        } 
    
        res.status(201).json(data);
    };
    

export const updateSpecificCost = async (req, res) => {
    const { id } = req.params;
    const { nom_gasto, valor_gasto_especifico } = req.body;
    const { data, error } = await supabase
      .from('gasto_especifico')
      .update({ nom_gasto, valor_gasto_especifico })
      .eq('id_gasto_esp', id);
  
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  }

  export const deleteSpecificCost = async (req, res) => {
    console.log(req.params);
    
    const { id } = req.params;
    const { data, error } = await supabase
      .from('gasto_especifico')
      .delete()
      .eq('id_gasto_esp', id);
  
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  }