import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { secretKey } = body;

        if (!secretKey) {
            return NextResponse.json({ error: 'Secret Key requerida' }, { status: 400 });
        }

        // 1. Get Reseller ID from Secret
        const { data: reseller, error: resError } = await supabase
            .from('resellers')
            .select('id')
            .eq('secret_key', secretKey)
            .single();

        if (resError || !reseller) {
            return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
        }

        // 2. Fetch Keys for this Reseller
        const { data: keys, error: keyError } = await supabase
            .from('licenses')
            .select('*')
            .eq('reseller_id', reseller.id)
            .order('created_at', { ascending: false });

        if (keyError) {
            return NextResponse.json({ error: keyError.message }, { status: 500 });
        }

        return NextResponse.json({ keys });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
