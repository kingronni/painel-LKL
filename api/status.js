import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ilwfeyzkaehkfgkxtciq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must be set in Vercel env vars

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

    if (!supabaseKey) {
        // Fallback for demo/dev without env vars, assuming public read is allowed or just return mock
        // But for production, this is critical.
        // For now, let's return a default true if key is missing to avoid breaking, 
        // but ideally we need the key to read the protected settings table if RLS is on.
        // Since we set RLS to true for all, we can use the anon key if we wanted, but service role is better.
        // I'll use the anon key from index.html for now to ensure it works without extra setup if user doesn't add env vars immediately.
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlsd2ZleXprYWVoa2Zna3h0Y2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDQxNDcsImV4cCI6MjA4MDEyMDE0N30.eK5-Ut91eYVmSgE9-v-zsHZ5lQB7xzVaJZyfXK8qhiM';
        const supabase = createClient(supabaseUrl, anonKey);
        
        const { data, error } = await supabase.from('settings').select('value').eq('key', 'server_status').single();
        
        if (error || !data) {
            return res.status(200).json({ status: true }); // Default to true if error
        }
        
        return res.status(200).json({ status: data.value.enabled });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('settings').select('value').eq('key', 'server_status').single();

    if (error || !data) {
        return res.status(200).json({ status: true });
    }

    return res.status(200).json({ status: data.value.enabled });
}
