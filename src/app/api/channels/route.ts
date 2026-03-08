import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        // Authenticate the user from the authorization header or a session
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.split("Bearer ")[1] || "";

        let userId = "";

        // First try header auth (for mobile apps, external clients)
        if (token) {
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            if (user?.id) userId = user.id;
        }

        // If no token from header, try cookies via the standard getUser route
        if (!userId) {
            const { data: { user } } = await supabaseAdmin.auth.getUser();
            if (user?.id) userId = user.id;
        }

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const channels = await db.getUserChannels(userId);

        return NextResponse.json({
            success: true,
            data: channels,
        });
    } catch (error: any) {
        console.error("[api/channels] GET error:", error.message);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
