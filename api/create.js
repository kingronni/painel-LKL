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

    // 0. CHECK PAYMENT STATUS (CRITICAL FIX)
    // Many gateways send multiple webhooks (created, pending, approved). We only want 'approved' or 'paid'.
    // If no status is found, we assume it's a legacy or forced request and proceed (be careful).
    const status = body.status || body.payment_status || (body.order && body.order.status) || (body.transaction && body.transaction.status);

    // List of statuses to IGNORE (return 200 but don't create key)
    const ignoredStatuses = ['pending', 'processing', 'created', 'updated', 'waiting_payment', 'in_process', 'authorized'];
    // List of statuses to ALLOW
    const allowedStatuses = ['approved', 'paid', 'completed', 'succeeded'];

    if (status) {
        const normalizedStatus = status.toLowerCase();
        if (ignoredStatuses.includes(normalizedStatus)) {
            console.log(`Webhook ignored due to status: ${status}`);
            return res.status(200).json({ message: 'Ignored: Status not approved' });
        }
        // Optional: If you want to be very strict, only allow if in allowedStatuses
        // if (!allowedStatuses.includes(normalizedStatus)) { ... }
    }

    let clientName = body.client_name || body.name || (body.customer && body.customer.name) || (body.payer && body.payer.first_name);
    let clientPhone = body.whatsapp || body.phone || body.mobile || (body.customer && (body.customer.phone || body.customer.mobile)) || (body.payer && body.payer.phone && body.payer.phone.number);
    let durationInput = body.duration || body.plan || (body.product && body.product.name) || (body.additional_info && body.additional_info.items && body.additional_info.items[0] && body.additional_info.items[0].title);

    // Improved Order ID detection for Mercado Pago / Stripe / etc
    let orderId = body.order_id || body.id || (body.order && body.order.id) || (body.data && body.data.id);

    // CRITICAL: If coming from Mercado Pago 'payment.created' or similar without order_id in root, try to find external_reference
    if (!orderId && body.external_reference) orderId = body.external_reference;

    if (!clientName) {
        const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        clientName = `Cliente Erby ${uniqueSuffix}`;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. VERIFICA SE JÁ EXISTE KEY PARA ESSE PEDIDO (TRAVA DE SEGURANÇA)
    if (orderId) {
        // First, check if this order ID already has a key
        const { data: existingKey, error: searchError } = await supabase
            .from('licenses')
            .select('*')
            .eq('order_id', orderId.toString()) // Ensure string comparison
            .maybeSingle(); // Use maybeSingle to avoid error if 0 rows

        if (existingKey) {
            console.log('Key recuperada para pedido existente:', orderId);
            return res.status(200).json({
                success: true,
                key: existingKey.license_key,
                expires_at: existingKey.expires_at,
                data: existingKey,
                message: 'Key recuperada do banco de dados (Idempotency)'
            });
        }
    } else {
        console.warn('AVISO: Webhook recebido SEM order_id. Risco de duplicidade se o gateway reenviar.');
    }

    // Generate Key
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const key = `LKL-${randomStr}`;

    // Calculate Expiry
    const now = new Date();
    let expires = new Date();
    let finalDurationType = 'monthly'; // Default

    if (durationInput) {
        const d = durationInput.toLowerCase();
        if (d.includes('semanal') || d.includes('weekly') || d.includes('7 dias')) {
            expires.setDate(now.getDate() + 7);
            finalDurationType = 'weekly';
        } else if (d.includes('diario') || d.includes('daily') || d.includes('1 dia') || d.includes('24h')) {
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
        order_id: orderId ? orderId.toString() : null // Salva string
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
