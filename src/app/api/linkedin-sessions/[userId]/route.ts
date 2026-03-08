import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

        const { data, error } = await supabaseAdmin
            .from("linkedin_sessions")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: "Session not found" }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("LinkedIn session fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
