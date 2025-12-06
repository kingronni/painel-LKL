import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { resellerId, isActive } = body;

        // TODO: Add stronger Admin Authentication here (e.g. check a cookie or another secret header)
        // For now we assume if you know this endpoint and the ID, you are admin.

        const { data, error } = await supabase
            .from('resellers')
            .update({ is_active: isActive })
            .eq('id', resellerId)
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
