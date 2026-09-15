import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const adminDb = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const { targetRole } = body;

    const validRoles = ["super_admin", "admin_sekolah", "guru", "siswa"];
    if (!validRoles.includes(targetRole)) {
      return NextResponse.json({ error: "Peran tidak valid" }, { status: 400 });
    }

    let userId = user?.id;

    // If no authenticated user, find a demo user for that role
    if (!userId) {
      const { data: demoProfile } = await adminDb
        .from("profil")
        .select("id")
        .eq("peran", targetRole)
        .limit(1)
        .single();

      if (demoProfile) {
        userId = demoProfile.id;
      } else {
        userId = "00000000-0000-0000-0000-000000000001";
      }
    } else {
      // Update profile in database so all queries check_user_role reflect this role
      await adminDb
        .from("profil")
        .update({ peran: targetRole })
        .eq("id", userId);
    }

    const cookieStore = await cookies();
    cookieStore.set("user_role", `${userId}:${targetRole}`, {
      httpOnly: false, // Accessible to client and server for easy UI sync
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    const targetPaths: Record<string, string> = {
      super_admin: "/super",
      admin_sekolah: "/admin",
      guru: "/guru",
      siswa: "/",
    };

    return NextResponse.json({
      success: true,
      targetRole,
      redirectUrl: targetPaths[targetRole] || "/",
    });
  } catch (err: any) {
    console.error("[SWITCH ROLE ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
