import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// Helper: tentukan path dashboard berdasarkan peran
function getDashboardPath(peran: string): string {
  switch (peran) {
    case "guru":
      return "/guru";
    case "siswa":
    default:
      return "/";
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  console.log("\n=== [OAuth Callback] ===");
  console.log("Code:", code ? `✅ ada (${code.substring(0, 10)}...)` : "❌ tidak ada");
  console.log("Error param:", errorParam || "tidak ada");

  if (errorParam) {
    console.error("❌ OAuth error:", errorParam, errorDescription);
    return NextResponse.redirect(
      `${origin}/masuk?error=${encodeURIComponent(errorDescription || errorParam)}`
    );
  }

  if (!code) {
    console.error("❌ Tidak ada code di URL callback");
    return NextResponse.redirect(
      `${origin}/masuk?error=${encodeURIComponent("Gagal melakukan autentikasi sosial.")}`
    );
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  console.log("Exchange:", exchangeError ? `❌ ${exchangeError.message}` : "✅ berhasil");

  if (exchangeError) {
    console.error("❌ Exchange code gagal:", exchangeError.message);
    return NextResponse.redirect(
      `${origin}/masuk?error=${encodeURIComponent("Autentikasi gagal: " + exchangeError.message)}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("User:", user ? `✅ ${user.email}` : "❌ null");

  if (!user) {
    return NextResponse.redirect(
      `${origin}/masuk?error=${encodeURIComponent("Gagal mendapatkan data pengguna.")}`
    );
  }

  // Cek apakah user sudah memiliki profil resmi di tabel profil
  const { data: profilLama } = await supabase
    .from("profil")
    .select("id, peran, nama_lengkap")
    .eq("id", user.id)
    .single();

  // =========================================================================
  // SKENARIO 1: Akun BELUM terdaftar di profil (belum pernah registrasi resmi)
  // Tombol Google / GitHub HANYA untuk login akun yang sudah ada.
  // =========================================================================
  if (!profilLama) {
    console.warn(`[OAuth Callback] User ${user.email} belum terdaftar di profil. Membatalkan sesi & mengarahkan ke registrasi...`);

    // 1. Cabut sesi login dari browser
    await supabase.auth.signOut();
    cookieStore.delete("user_role");

    // 2. Bersihkan akun auth sementara di auth.users agar email tidak terkunci
    try {
      const adminClient = createAdminClient();
      await adminClient.auth.admin.deleteUser(user.id);
      console.log(`[OAuth Callback] User auth sementara ${user.id} (${user.email}) berhasil dibersihkan.`);
    } catch (cleanErr: any) {
      console.warn("[OAuth Callback] Peringatan saat membersihkan user auth sementara:", cleanErr?.message);
    }

    // 3. Ambil data nama & email dari metadata Google/GitHub untuk prefill form pendaftaran
    const emailUser = user.email || "";
    const namaUser =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      emailUser.split("@")[0] ||
      "";

    // 4. Redirect ke /daftar dengan notifikasi ramah & form pre-filled
    return NextResponse.redirect(
      `${origin}/daftar?email=${encodeURIComponent(emailUser)}&nama=${encodeURIComponent(namaUser)}&error=unregistered_oauth`
    );
  }

  // =========================================================================
  // SKENARIO 2: Akun SUDAH terdaftar di profil resmi
  // Lanjutkan proses login langsung ke dashboard yang sesuai
  // =========================================================================
  const finalRole = profilLama.peran || "siswa";
  console.log(`[OAuth Callback] User ${user.email} terverifikasi dengan peran "${finalRole}". Lanjut ke dashboard.`);

  // Set cookie peran terikat dengan user ID
  cookieStore.set("user_role", `${user.id}:${finalRole}`, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 jam
    path: "/",
  });

  return NextResponse.redirect(`${origin}${getDashboardPath(finalRole)}`);
}
