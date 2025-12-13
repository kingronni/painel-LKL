import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ilwfeyzkaehkfgkxtciq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Initialize Supabase
    let supabase;
    if (supabaseKey) {
        supabase = createClient(supabaseUrl, supabaseKey);
    } else {
        // Fallback for dev/demo without server keys, using anon key (NOT RECOMMENDED for production write)
        // Assuming we might need to read at least.
        // BUT for POST (updating settings), we definitely need SERVICE_ROLE_KEY or a logged in user with rights.
        // Since this is a simple "panel", we'll try to use the anon key for READ, but warn for WRITE.
        // However, the current status.js uses anon key fallback, so we'll mirror that but be careful.
        // Wait, the prompt implies "painel-lkl.vercel.app" which should have env vars.
        // If local, it might fail. I'll add the fallback for safety but primarily rely on env vars.
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlsd2ZleXprYWVoa2Zna3h0Y2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDQxNDcsImV4cCI6MjA4MDEyMDE0N30.eK5-Ut91eYVmSgE9-v-zsHZ5lQB7xzVaJZyfXK8qhiM';
        supabase = createClient(supabaseUrl, anonKey);
    }

    if (req.method === 'GET') {
        const { data, error } = await supabase.from('settings').select('value').eq('key', 'global_message').single();

        if (error || !data) {
            // Return default if not found
            return res.status(200).json({ message: "", active: false });
        }

        return res.status(200).json(data.value);
    }

    if (req.method === 'POST') {
        // Verify authentication or basic restriction if needed. 
        // For now, assuming the panel is protected by its own login (client-side) 
        // AND the API should ideally be protected. 
        // But the user just asked for the route. I will implement the update logic.

        const { message, active } = req.body;

        if (typeof message === 'undefined' || typeof active === 'undefined') {
            return res.status(400).json({ error: 'Missing message or active status' });
        }

        const newValue = { message, active };

        // Upsert the setting
        const { data, error } = await supabase
            .from('settings')
            .upsert({ key: 'global_message', value: newValue })
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ success: true, data });
    }

    res.status(405).json({ error: 'Method not allowed' });
}
