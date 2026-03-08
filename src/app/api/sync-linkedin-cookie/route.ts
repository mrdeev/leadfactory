import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { withCors, optionsResponse } from "@/lib/cors";

export async function OPTIONS() {
    return optionsResponse()
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, email, cookie, liAt, liA, userAgent, linkedInUserId, extensionVersion, productId } = body;

        if (!userId) {
            return withCors(NextResponse.json({ success: false, error: "userId is required" }, {
                status: 400
            }));
        }

        // Always save to linkedin_sessions (the extension session store)
        const { error } = await supabaseAdmin
            .from("linkedin_sessions")
            .upsert({
                user_id: userId,
                email,
                cookie,
                li_at: liAt,
                li_a: liA,
                user_agent: userAgent,
                linkedin_user_id: linkedInUserId,
                extension_version: extensionVersion,
                updated_at: new Date().toISOString(),
                is_valid: true
            }, {
                onConflict: "user_id"
            });

        if (error) throw error;

        // Also update the product's linkedin_cookie if productId is provided
        // This bridges the extension's cookie capture to the action-router
        if (productId && (liAt || liA)) {
            const { error: productError } = await supabaseAdmin
                .from("products")
                .update({
                    linkedin_cookie: liAt,
                    linkedin_cookie_a: liA,
                    linkedin_user_agent: userAgent,
                    linkedin_user_id: linkedInUserId
                })
                .eq("id", productId);

            if (productError) {
                console.warn(`[sync-linkedin-cookie] Failed to update product ${productId}:`, productError.message);
            } else {
                console.log(`[sync-linkedin-cookie] Updated product ${productId} linkedin_cookie`);
            }
        }

        // If no productId but we have a userId, try to find and update all products for this user
        if (!productId && (liAt || liA) && userId) {
            const { data: products } = await supabaseAdmin
                .from("products")
                .select("id")
                .eq("user_id", userId);

            if (products && products.length > 0) {
                for (const p of products) {
                    await supabaseAdmin
                        .from("products")
                        .update({
                            linkedin_cookie: liAt,
                            linkedin_cookie_a: liA,
                            linkedin_user_agent: userAgent,
                            linkedin_user_id: linkedInUserId
                        })
                        .eq("id", p.id);
                }
                console.log(`[sync-linkedin-cookie] Updated ${products.length} products for user ${userId}`);
            }
        }

        return withCors(NextResponse.json({ success: true }));
    } catch (error: any) {
        console.error("LinkedIn sync error:", error);
        return withCors(NextResponse.json({ success: false, error: error.message }, {
            status: 500
        }));
    }
}
