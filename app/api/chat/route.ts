import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const adminDb = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // 1. Search Users across Siswa, Guru, Admin Sekolah, Super Admin
    if (action === "search_users") {
      const q = (searchParams.get("q") || "").trim();
      let query = adminDb
        .from("profil")
        .select("id, nama_lengkap, peran, email, foto_url")
        .neq("id", user.id)
        .limit(20);

      if (q) {
        query = query.or(`nama_lengkap.ilike.%${q}%,email.ilike.%${q}%`);
      }

      const { data: users, error } = await query;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ users: users || [] });
    }

    // 2. Get Messages for a specific room
    if (action === "get_messages") {
      const roomId = searchParams.get("roomId");
      if (!roomId) {
        return NextResponse.json({ error: "roomId is required" }, { status: 400 });
      }

      const { data: messages, error } = await adminDb
        .from("chat_messages")
        .select(`
          id,
          room_id,
          sender_id,
          content,
          created_at,
          sender:sender_id (
            id,
            nama_lengkap,
            peran,
            foto_url
          )
        `)
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ messages: messages || [] });
    }

    // 3. Default: Get Rooms for current user (or Global Channel)
    // Find all room IDs where user is participant
    const { data: participations } = await adminDb
      .from("chat_participants")
      .select("room_id")
      .eq("user_id", user.id);

    const roomIds = (participations || []).map((p) => p.room_id);

    // Also get school global channel room
    const { data: currentProfil } = await adminDb
      .from("profil")
      .select("sekolah_id, nama_lengkap, peran")
      .eq("id", user.id)
      .single();

    let roomsQuery = adminDb
      .from("chat_rooms")
      .select(`
        id,
        nama,
        tipe,
        sekolah_id,
        created_at,
        chat_participants (
          user_id,
          profil:user_id (
            id,
            nama_lengkap,
            peran,
            foto_url
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (roomIds.length > 0) {
      roomsQuery = roomsQuery.or(`id.in.(${roomIds.join(",")}),tipe.eq.channel`);
    } else {
      roomsQuery = roomsQuery.eq("tipe", "channel");
    }

    const { data: rooms, error } = await roomsQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format rooms with other participant's info
    const formattedRooms = (rooms || []).map((r: any) => {
      const otherParticipant = r.chat_participants?.find(
        (p: any) => p.user_id !== user.id
      )?.profil;

      return {
        id: r.id,
        nama: r.tipe === "channel" ? "Saluran Komunikasi Global THINKSY" : otherParticipant?.nama_lengkap || r.nama || "Obrolan",
        tipe: r.tipe,
        otherUser: otherParticipant || null,
        created_at: r.created_at,
      };
    });

    return NextResponse.json({ rooms: formattedRooms, currentUserId: user.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const adminDb = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { roomId, recipientId, content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
    }

    let targetRoomId = roomId;

    // If starting a direct chat with recipientId
    if (!targetRoomId && recipientId) {
      // Check if room already exists between these 2 users
      const { data: existingParts } = await adminDb
        .from("chat_participants")
        .select("room_id")
        .eq("user_id", user.id);

      const userRoomIds = (existingParts || []).map((p) => p.room_id);

      if (userRoomIds.length > 0) {
        const { data: match } = await adminDb
          .from("chat_participants")
          .select("room_id")
          .eq("user_id", recipientId)
          .in("room_id", userRoomIds)
          .maybeSingle();

        if (match) {
          targetRoomId = match.room_id;
        }
      }

      // If still no room, create one
      if (!targetRoomId) {
        const { data: newRoom, error: roomErr } = await adminDb
          .from("chat_rooms")
          .insert({
            nama: "Direct Chat",
            tipe: "direct",
          })
          .select()
          .single();

        if (roomErr || !newRoom) {
          return NextResponse.json({ error: roomErr?.message || "Gagal membuat ruang chat" }, { status: 500 });
        }

        targetRoomId = newRoom.id;

        // Add both participants
        await adminDb.from("chat_participants").insert([
          { room_id: targetRoomId, user_id: user.id },
          { room_id: targetRoomId, user_id: recipientId },
        ]);
      }
    }

    if (!targetRoomId) {
      return NextResponse.json({ error: "Target room tidak ditemukan" }, { status: 400 });
    }

    // Insert Message
    const { data: newMsg, error: msgErr } = await adminDb
      .from("chat_messages")
      .insert({
        room_id: targetRoomId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select(`
        id,
        room_id,
        sender_id,
        content,
        created_at,
        sender:sender_id (
          id,
          nama_lengkap,
          peran,
          foto_url
        )
      `)
      .single();

    if (msgErr) {
      return NextResponse.json({ error: msgErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: newMsg, roomId: targetRoomId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
