import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ilwfeyzkaehkfgkxtciq.supabase.co';
// Use Service Role Key for backend logic to bypass RLS.
// Ideally user sets SUPABASE_SERVICE_ROLE_KEY in Vercel.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlsd2ZleXprYWVoa2Zna3h0Y2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDQxNDcsImV4cCI6MjA4MDEyMDE0N30.eK5-Ut91eYVmSgE9-v-zsHZ5lQB7xzVaJZyfXK8qhiM';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-secret');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Security Check
    const apiSecret = req.headers['x-api-secret'] || req.query.secret;
    const envSecret = process.env.API_SECRET;

    if (!envSecret) {
        console.warn('API_SECRET not set in environment variables. Endpoint is insecure if not set.');
        // For safety, if API_SECRET is not set on server, we might want to block or allow (depending on dev mode).
        // Let's block to force user to set it for security.
        return res.status(500).json({ error: 'Server misconfiguration: API_SECRET not set' });
    }

    if (apiSecret !== envSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { duration = 'monthly', max_ips = 1, client_name, whatsapp } = req.body;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate Key
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const key = `AK7-${randomStr}`;

    // Calculate Expiry
    const now = new Date();
    let expires = new Date();
    let finalDurationType = duration;
    let durationValue = 0;

    // Handle custom durations if passed (simplified for now to standard types)
    if (duration === 'daily') expires.setDate(now.getDate() + 1);
    else if (duration === 'weekly') expires.setDate(now.getDate() + 7);
    else if (duration === 'monthly') expires.setDate(now.getDate() + 30);
    else if (duration === 'permanent') expires.setFullYear(now.getFullYear() + 100);
    else {
        // Default to monthly if unknown
        expires.setDate(now.getDate() + 30);
        finalDurationType = 'monthly';
    }

    const { data, error } = await supabase.from('licenses').insert({
        license_key: key,
        client_username: client_name || 'Automated Client',
        whatsapp: whatsapp || null,
        status: 'active',
        duration_type: finalDurationType,
        expires_at: expires.toISOString(),
        max_ips: parseInt(max_ips),
        used_ips: []
    }).select().single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
        success: true,
        key: key,
        expires_at: expires.toISOString(),
        data: data
    });
}
