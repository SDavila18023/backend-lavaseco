import supabase from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Registro de usuario
export const registerUser = async (req, res) => {
    try {
        const { email, password, rol } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insertar usuario en Supabase
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

// Login de usuario
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        // Buscar usuario en Supabase
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !data) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Comparar contraseña
        const validPassword = await bcrypt.compare(password, data.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Generar token
        const token = jwt.sign({ id: data.id_usuario, email: data.email, rol: data.rol }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.json({ message: 'Login exitoso', token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
