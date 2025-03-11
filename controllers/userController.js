import supabase from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const registerUser = async (req, res) => {
    try {
        const { email, password, rol } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { data, error } = await supabase
            .from('usuarios')
            .insert([{ email, password_hash: hashedPassword, rol }])
            .select();

        if (error) throw error;

        res.status(201).json({ message: 'Usuario registrado con éxito', user: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const fetchUsers = async (req, res) => {

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Se requiere un token de autorización" });
    }

    try {
        const { data, error } = await supabase.from("usuarios").select("*");
    
        if (error) {
          return res.status(500).json({ error: error.message });
        }
    
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: "Error interno del servidor" });
      }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !data) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const validPassword = await bcrypt.compare(password, data.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const token = jwt.sign({ id: data.id_usuario, email: data.email, rol: data.rol }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.json({ message: 'Login exitoso', token ,email: data.email});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    console.log(req.params);

    const { id } = req.params;
  
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id_usuario', id);
  
    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Usuario eliminado correctamente" });
};
