import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const resellerId = searchParams.get('resellerId');

        if (!resellerId) {
            return NextResponse.json({ error: 'Reseller ID required' }, { status: 400 });
        }

        const { data: keys, error } = await supabase
            .from('licenses')
            .select('*')
            .eq('reseller_id', resellerId)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ keys });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
