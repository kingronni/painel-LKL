import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { secretKey, durationType = 'monthly' } = body;

        // 1. Validate Input
        if (!secretKey) {
            return NextResponse.json({ error: 'Chave secreta do revendedor obrigatória' }, { status: 400 });
        }

        // 2. Validate Reseller & Check Kill Switch
        const { data: reseller, error: resellerError } = await supabase
            .from('resellers')
            .select('id, name, is_active')
            .eq('secret_key', secretKey)
            .single();

        if (resellerError || !reseller) {
            return NextResponse.json({ error: 'Revendedor não encontrado' }, { status: 401 });
        }

        if (!reseller.is_active) {
            return NextResponse.json({ error: 'ACESSO BLOQUEADO PELO ADMINISTRADOR' }, { status: 403 });
        }

        // 3. Generate License Key
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const licenseKey = `LKL-${randomStr}`;

        // Calculate Expiry
        const now = new Date();
        let expires = new Date();

        if (durationType === 'weekly') expires.setDate(now.getDate() + 7);
        else if (durationType === 'daily') expires.setDate(now.getDate() + 1);
        else if (durationType === 'permanent') expires.setFullYear(now.getFullYear() + 100);
        else expires.setDate(now.getDate() + 30); // Monthly default

        // 4. Save to Database
        const { data: license, error: licenseError } = await supabase
            .from('licenses')
            .insert({
                license_key: licenseKey,
                status: 'active',
                duration_type: durationType,
                expires_at: expires.toISOString(),
                reseller_id: reseller.id, // Linking to reseller
                created_at: now.toISOString(),
                max_ips: 1,
                used_ips: []
            })
            .select()
            .single();

        if (licenseError) {
            console.error('Error creating license:', licenseError);
            return NextResponse.json({ error: 'Erro ao criar licença' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            key: licenseKey,
            expires_at: expires.toISOString(),
            reseller: reseller.name
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
