import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ilwfeyzkaehkfgkxtciq.supabase.co';
// Use Service Role Key for backend logic to bypass RLS if needed, or Anon key if policies allow.
// Ideally user sets SUPABASE_SERVICE_ROLE_KEY in Vercel.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlsd2ZleXprYWVoa2Zna3h0Y2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDQxNDcsImV4cCI6MjA4MDEyMDE0N30.eK5-Ut91eYVmSgE9-v-zsHZ5lQB7xzVaJZyfXK8qhiM';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { key, ip } = req.query; // Or req.body

    if (!key || !ip) {
        return res.status(400).json({ valid: false, message: 'Missing key or IP' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Check Global Server Status
    const { data: settings } = await supabase.from('settings').select('value').eq('key', 'server_status').single();
    if (settings && settings.value && settings.value.enabled === false) {
        return res.status(503).json({ valid: false, message: 'Server is offline' });
    }

    // 2. Fetch License
    const { data: license, error } = await supabase.from('licenses').select('*').eq('license_key', key).single();

    if (error || !license) {
        return res.status(404).json({ valid: false, message: 'Key not found' });
    }

    // 3. Check Status & Expiry
    if (license.status !== 'active') {
        return res.status(403).json({ valid: false, message: 'Key is ' + license.status });
    }

    const now = new Date();
    const expires = new Date(license.expires_at);
    if (now > expires) {
        return res.status(403).json({ valid: false, message: 'Key expired' });
    }

    // 4. Multi-IP Logic
    let usedIps = license.used_ips || [];
    const maxIps = license.max_ips || 1;

    // Check if IP is already in the list
    if (usedIps.includes(ip)) {
        return res.status(200).json({ valid: true, message: 'Access granted' });
    }

    // If not in list, check if we have space
    if (usedIps.length < maxIps) {
        // Add IP
        usedIps.push(ip);
        const { error: updateError } = await supabase
            .from('licenses')
            .update({ used_ips: usedIps })
            .eq('id', license.id);

        if (updateError) {
            return res.status(500).json({ valid: false, message: 'Failed to register IP' });
        }

        return res.status(200).json({ valid: true, message: 'Access granted (New IP registered)' });
    } else {
        return res.status(403).json({ valid: false, message: 'Max IPs reached' });
    }
}
