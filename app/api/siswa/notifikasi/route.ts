import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ notifications: [] });
    }

    const { data: dbNotif, error } = await supabase
      .from("notifikasi")
      .select("id, judul, pesan, tipe, dibaca, dibuat_pada, link_url")
      .eq("user_id", user.id)
      .order("dibuat_pada", { ascending: false })
      .limit(20);

    if (error || !dbNotif || dbNotif.length === 0) {
      // Mengembalikan array KOSONG jika belum ada notifikasi (tanpa mock data)
      return NextResponse.json({ notifications: [] });
    }

    const formattedNotifs = dbNotif.map((n) => {
      const dt = new Date(n.dibuat_pada);
      const timeStr = dt.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return {
        id: n.id,
        title: n.judul,
        desc: n.pesan,
        time: `${timeStr} WIB`,
        type: n.tipe || "info",
        dibaca: n.dibaca,
        link_url: n.link_url || null,
      };
    });

    return NextResponse.json({ notifications: formattedNotifs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return handleUpdateNotification(request);
}

export async function PATCH(request: Request) {
  return handleUpdateNotification(request);
}

async function handleUpdateNotification(request: Request) {
  try {
    const supabase = await createClient();
    const adminDb = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, id, notifId, judul, pesan, tipe } = body;
    const targetId = id || notifId;

    // Action: Mark notification(s) as read in Database
    if (action === "mark_as_read" || targetId) {
      if (targetId) {
        await adminDb
          .from("notifikasi")
          .update({ dibaca: true })
          .eq("id", targetId)
          .eq("user_id", user.id);
      } else {
        await adminDb
          .from("notifikasi")
          .update({ dibaca: true })
          .eq("user_id", user.id);
      }

      return NextResponse.json({
        success: true,
        message: "Notifikasi berhasil ditandai dibaca di database.",
      });
    }

    // Action: Create new notification log
    if (judul && pesan) {
      const recipientId = body.target_user_id || user.id;
      const { data: newNotif, error } = await adminDb
        .from("notifikasi")
        .insert({
          user_id: recipientId,
          judul,
          pesan,
          tipe: tipe || "info",
          dibaca: false,
          link_url: body.link_url || null,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, notification: newNotif });
    }

    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
