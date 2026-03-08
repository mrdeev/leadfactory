import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from("linkedin_sessions")
            .select("user_id, email, is_valid, updated_at")
            .order("updated_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("LinkedIn sessions fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
