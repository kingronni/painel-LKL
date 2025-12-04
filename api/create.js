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

    // Debug logging to see what Erby sends
    console.log('Webhook Headers:', req.headers);
    console.log('Webhook Body:', JSON.stringify(req.body, null, 2));

    // Security Check
    // Erby uses x-webhook-signature, but for now we will stick to our simple query secret 
    // to get it working quickly. We can add HMAC verification later if needed.
    const apiSecret = req.headers['x-api-secret'] || req.query.secret;
    const envSecret = process.env.API_SECRET;

    // Allow testing without secret if it's not set in env yet (WARNING: INSECURE)
    if (envSecret && apiSecret !== envSecret) {
        console.error('Invalid Secret');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body || {};

    // Try to find fields in common webhook patterns

    console.log('Key Generated:', key);

    return res.status(200).json({
        success: true,
        key: key,
        expires_at: expires.toISOString(),
        data: data
    });
}
