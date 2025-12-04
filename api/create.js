import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ilwfeyzkaehkfgkxtciq.supabase.co';
// Use Service Role Key for backend logic to bypass RLS.
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

    // Debug logging
    console.log('Webhook Headers:', req.headers);
    console.log('Webhook Body:', JSON.stringify(req.body, null, 2));

    // Security Check
    // Security Check
    const apiSecret = req.headers['x-api-secret'] || req.query.secret;
    const envSecret = process.env.API_SECRET;
    const validSecrets = [envSecret, 'LKL2024', 'i0G67jsJANgm3HUPUaa1QVS8AykeCTvRlWSRPaex', 'rLLlPvYXvKLxFILR0iagpN8Bxi9foDDfbIMi2VrU'].filter(Boolean);

    if (!validSecrets.includes(apiSecret)) {
        console.error('Invalid Secret:', apiSecret);
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body || {};

    let clientName = body.client_name || body.name || (body.customer && body.customer.name);
    let clientPhone = body.whatsapp || body.phone || body.mobile || (body.customer && (body.customer.phone || body.customer.mobile));
    let durationInput = body.duration || body.plan || (body.product && body.product.name);
    // Melhoria para suportar Webhooks diretos da plataforma (que costumam mandar 'id' ou 'order.id')
    let orderId = body.order_id || body.id || (body.order && body.order.id);

    if (!clientName) clientName = 'Cliente Erby';

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. VERIFICA SE JÁ EXISTE KEY PARA ESSE PEDIDO (TRAVA DE SEGURANÇA)
    if (orderId) {
        const { data: existingKey, error: searchError } = await supabase
            .from('licenses')
            .select('*')
            .eq('order_id', orderId)
            .single();

        if (existingKey) {
            console.log('Key recuperada para pedido existente:', orderId);
            return res.status(200).json({
                success: true,
                key: existingKey.license_key,
                expires_at: existingKey.expires_at,
                data: existingKey,
                message: 'Key recuperada do banco de dados'
            });
        }
    }

    // Generate Key
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const key = `AK7-${randomStr}`;

    // Calculate Expiry
    const now = new Date();
    let expires = new Date();
    let finalDurationType = 'monthly'; // Default

    if (durationInput) {
        const d = durationInput.toLowerCase();
        if (d.includes('semanal') || d.includes('weekly')) {
            expires.setDate(now.getDate() + 7);
            finalDurationType = 'weekly';
        } else if (d.includes('diario') || d.includes('daily')) {
            expires.setDate(now.getDate() + 1);
            finalDurationType = 'daily';
        } else if (d.includes('permanente') || d.includes('lifetime') || d.includes('vitalicio')) {
            expires.setFullYear(now.getFullYear() + 100);
            finalDurationType = 'permanent';
        } else {
            expires.setDate(now.getDate() + 30);
        }
    } else {
        expires.setDate(now.getDate() + 30);
    }

    const { data, error } = await supabase.from('licenses').insert({
        license_key: key,
        client_username: clientName,
        client_password: null,
        whatsapp: clientPhone || null,
        status: 'active',
        duration_type: finalDurationType,
        expires_at: expires.toISOString(),
        max_ips: 1,
        used_ips: [],
        order_id: orderId // Salva o ID do pedido
    }).select().single();

    if (error) {
        console.error('Supabase Error:', error);
        return res.status(500).json({ error: error.message });
    }

    console.log('Key Generated:', key);

    return res.status(200).json({
        success: true,
        key: key,
        expires_at: expires.toISOString(),
        data: data
    });
}
