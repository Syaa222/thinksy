"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

export async function loginAction(prevState: any, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan kata sandi wajib diisi." };
  }

  const supabase = await createClient();

  // 1. Periksa status akun di database sebelum login
  const { data: statusData } = await supabase.rpc("check_user_account_status", {
    p_email: email,
  });

  const accountStatus = statusData as {
    exists: boolean;
    has_profile: boolean;
    user_id: string | null;
    nama_lengkap: string | null;
    peran: string | null;
    foto_url: string | null;
  } | null;

  // Jika user dideteksi belum memiliki akun di sistem
  if (!accountStatus?.exists) {
    return {
      error: "Akun belum terdaftar. Anda belum memiliki akun, silakan mendaftar terlebih dahulu untuk melengkapi profil data diri Anda.",
      notRegistered: true,
      email,
    };
  }

  // Jika akun auth ada namun profil belum terbentuk
  if (accountStatus.exists && !accountStatus.has_profile) {
    return {
      error: "Data profil akun Anda belum lengkap. Silakan lakukan pendaftaran untuk melengkapi data profil resmi Anda.",
      incompleteProfile: true,
      email,
    };
  }

  // 2. Lakukan login dengan kata sandi
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError) {
    return {
      error: "Kata sandi yang Anda masukkan salah. Silakan periksa kembali.",
      email,
    };
  }

  if (!authData.user) {
    return { error: "Gagal mendapatkan data akun. Silakan coba lagi." };
  }

  const userId = authData.user.id;
  const resolvedPeran = accountStatus.peran || "siswa";

  // Set cookie peran terisolasi dengan user ID
  const cookieStore = await cookies();
  cookieStore.set("user_role", `${userId}:${resolvedPeran}`, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 jam
    path: "/",
  });

  redirect(getDashboardPath(resolvedPeran));
}

export async function registerAction(prevState: any, formData: FormData) {
  const namaLengkap = (formData.get("nama_lengkap") as string)?.trim() || "";
  const email = (formData.get("email") as string)?.trim().toLowerCase() || "";
  const password = (formData.get("password") as string) || "";
  const jenisKelamin = (formData.get("jenis_kelamin") as string)?.trim() || "Laki-laki";
  const noWa = (formData.get("no_wa") as string)?.trim() || "";
  const tempatLahir = (formData.get("tempat_lahir") as string)?.trim() || "";
  const tanggalLahir = (formData.get("tanggal_lahir") as string)?.trim() || "";
  const namaKelas = (formData.get("nama_kelas") as string)?.trim() || "Kelas 8A";
  const nisn = (formData.get("nisn") as string)?.trim() || "";
  const nis = nisn ? nisn.slice(-6) : "260481";
  
  // Tentukan foto profil default berdasarkan jenis kelamin jika foto belum disetel khusus
  const defaultFotoByGender =
    jenisKelamin === "Perempuan"
      ? "/images/pasfoto-siswi-1.jpg"
      : "/images/pasfoto-siswa-1.jpg";
  const fotoUrl = (formData.get("foto_url") as string)?.trim() || defaultFotoByGender;
  const asalSekolah = "SMK Muhammadiyah 1";

  if (!namaLengkap || !email || !password) {
    return { error: "Nama lengkap, email, dan kata sandi wajib diisi." };
  }

  if (namaLengkap.length < 3) {
    return { error: "Nama lengkap minimal 3 karakter." };
  }

  if (password.length < 8) {
    return { error: "Kata sandi minimal 8 karakter." };
  }

  const supabase = await createClient();

  // 1. Cek apakah user dideteksi sudah memiliki akun dan profil (1 akun hanya untuk 1 pengguna)
  const { data: statusData } = await supabase.rpc("check_user_account_status", {
    p_email: email,
  });

  const accountStatus = statusData as {
    exists: boolean;
    has_profile: boolean;
    user_id: string | null;
  } | null;

  if (accountStatus?.exists && accountStatus?.has_profile) {
    return {
      error: "Email ini sudah terdaftar dan sudah memiliki profil. 1 akun hanya dapat digunakan oleh 1 pengguna. Silakan masuk melalui jalur login.",
      alreadyRegistered: true,
      email,
    };
  }

  // Jika akun auth pernah terbentuk sementara (misal saat mencoba login Google/GitHub) tapi belum punya profil,
  // bersihkan user auth tersebut terlebih dahulu agar pendaftaran resmi dengan sandi berjalan mulus.
  if (accountStatus?.exists && !accountStatus?.has_profile) {
    try {
      await supabase.rpc("delete_orphan_auth_user", { p_email: email });
      console.log(`[REGISTER] Berhasil membersihkan user auth sementara (${email}) via RPC sebelum signUp.`);
    } catch (cleanErr: any) {
      console.warn("[REGISTER] Peringatan saat membersihkan user auth sementara:", cleanErr?.message);
    }
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nama_lengkap: namaLengkap,
        peran: "siswa",
        asal_sekolah: asalSekolah,
        jenis_kelamin: jenisKelamin,
        no_wa: noWa,
        tempat_lahir: tempatLahir,
        tanggal_lahir: tanggalLahir,
        nama_kelas: namaKelas,
        nisn: nisn,
        nis: nis,
        foto_url: fotoUrl,
      },
    },
  });

  if (authError) {
    console.error("[REGISTER ERROR]", {
      message: authError.message,
      status: authError.status,
    });

    const msg = authError.message.toLowerCase();

    if (msg.includes("already registered") || msg.includes("user already registered")) {
      return {
        error: "Email ini sudah terdaftar dan sudah memiliki profil. 1 akun hanya dapat digunakan oleh 1 pengguna. Silakan masuk melalui jalur login.",
        alreadyRegistered: true,
        email,
      };
    }
    if (msg.includes("email") && (msg.includes("invalid") || msg.includes("not valid"))) {
      return { error: "Format email tidak valid. Gunakan email yang benar (contoh: nama@gmail.com)." };
    }
    if (msg.includes("password") && msg.includes("weak")) {
      return { error: "Kata sandi terlalu lemah. Gunakan kombinasi huruf, angka, dan simbol." };
    }
    if (msg.includes("signup") && msg.includes("disabled")) {
      return { error: "Pendaftaran akun saat ini dinonaktifkan. Hubungi administrator." };
    }
    if (msg.includes("rate limit") || msg.includes("too many")) {
      return { error: "Terlalu banyak percobaan. Silakan tunggu beberapa menit lalu coba lagi." };
    }
    if (msg.includes("database") || msg.includes("relation") || msg.includes("does not exist")) {
      return { error: "Database belum siap. Pastikan schema.sql sudah dijalankan di Supabase SQL Editor." };
    }

    return { error: `Gagal mendaftar: ${authError.message}` };
  }

  if (!authData.user) {
    return { error: "Gagal membuat akun. Silakan coba lagi." };
  }

  // Cek apakah email sudah terdaftar sebelumnya
  if (authData.user.identities && authData.user.identities.length === 0) {
    const { data: checkAgain } = await supabase.rpc("check_user_account_status", {
      p_email: email,
    });
    const doubleCheck = checkAgain as { exists: boolean; has_profile: boolean } | null;

    if (doubleCheck?.exists && !doubleCheck?.has_profile) {
      console.log(`[REGISTER] User ${email} terdeteksi di auth.users tanpa profil, menghapus dan mencoba mendaftar ulang...`);
      await supabase.rpc("delete_orphan_auth_user", { p_email: email });
      const retrySignUp = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nama_lengkap: namaLengkap,
            peran: "siswa",
            asal_sekolah: asalSekolah,
            jenis_kelamin: jenisKelamin,
            no_wa: noWa,
            tempat_lahir: tempatLahir,
            tanggal_lahir: tanggalLahir,
            nama_kelas: namaKelas,
            nisn: nisn,
            nis: nis,
            foto_url: fotoUrl,
          },
        },
      });

      if (retrySignUp.data?.user && (!retrySignUp.data.user.identities || retrySignUp.data.user.identities.length > 0)) {
        authData.user = retrySignUp.data.user;
        authData.session = retrySignUp.data.session;
      } else {
        return {
          error: "Terjadi sinkronisasi data akun. Silakan klik tombol 'Selesaikan & Masuk Dashboard' sekali lagi.",
          email,
        };
      }
    } else {
      return {
        error: "Email ini sudah terdaftar dan sudah memiliki profil. 1 akun hanya dapat digunakan oleh 1 pengguna. Silakan masuk melalui jalur login.",
        alreadyRegistered: true,
        email,
      };
    }
  }

  const emailNormalized = email.toLowerCase().trim();
  let peranBaru = "siswa";
  let sekolahId: string | null = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  // Cek apakah ada undangan untuk email pendaftar ini
  const { data: undangan } = await supabase
    .from("undangan")
    .select("id, peran, sekolah_id")
    .eq("email", emailNormalized)
    .eq("digunakan", false)
    .gt("kadaluarsa_pada", new Date().toISOString())
    .order("dibuat_pada", { ascending: false })
    .limit(1)
    .single();

  if (undangan) {
    peranBaru = undangan.peran;
    if (undangan.sekolah_id) {
      sekolahId = undangan.sekolah_id;
    }
    await supabase
      .from("undangan")
      .update({ digunakan: true })
      .eq("id", undangan.id);
  }

  // Lengkapi profil pengguna dan koneksi kelas menggunakan RPC dengan SECURITY DEFINER
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "complete_student_registration",
      {
        p_user_id: authData.user.id,
        p_nama_lengkap: namaLengkap,
        p_peran: peranBaru,
        p_sekolah_id: sekolahId,
        p_nisn: nisn || null,
        p_nis: nis || null,
        p_foto_url: fotoUrl || null,
        p_jenis_kelamin: jenisKelamin,
        p_tempat_lahir: tempatLahir || null,
        p_tanggal_lahir: tanggalLahir || null,
        p_no_wa: noWa || null,
        p_nama_kelas: namaKelas || null,
      }
    );

    if (rpcError || (rpcResult && rpcResult.success === false)) {
      console.warn("[REGISTER] RPC complete_student_registration notice:", rpcError?.message || rpcResult?.error);
      // Fallback langsung ke upsert profil
      await supabase.from("profil").upsert({
        id: authData.user.id,
        nama_lengkap: namaLengkap,
        peran: peranBaru,
        sekolah_id: sekolahId,
        nisn: nisn || null,
        nis: nis || null,
        foto_url: fotoUrl || null,
        jenis_kelamin: jenisKelamin,
        tempat_lahir: tempatLahir || null,
        tanggal_lahir: tanggalLahir || null,
        no_wa: noWa || null,
        jurusan: "Fase D (Kurikulum Merdeka)",
        tahun_ajaran: "2026/2027",
      });
    }
  } catch (err) {
    console.error("[REGISTER] Exception saat menyimpan profil:", err);
  }

  // Jika session langsung aktif atau auto sign-in
  let redirectPath: string | null = null;

  if (authData.session) {
    const cookieStore = await cookies();
    cookieStore.set("user_role", `${authData.user.id}:${peranBaru}`, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 jam
      path: "/",
    });
    redirectPath = getDashboardPath(peranBaru);
  } else {
    // Coba auto sign-in jika session belum langsung terbentuk
    try {
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInData?.session) {
        const cookieStore = await cookies();
        cookieStore.set("user_role", `${signInData.user.id}:${peranBaru}`, {
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24,
          path: "/",
        });
        redirectPath = getDashboardPath(peranBaru);
      }
    } catch {
      // Abaikan jika signInWithPassword gagal karena email confirmation
    }
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  return {
    success: true,
    user: {
      id: authData.user.id,
      nama_lengkap: namaLengkap,
      nama_kelas: namaKelas,
      nisn: nisn,
      foto_url: fotoUrl,
    },
    message:
      "Pendaftaran berhasil! Akun Anda telah aktif. Silakan masuk dengan email dan kata sandi Anda.",
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Hapus cookie peran saat logout
  const cookieStore = await cookies();
  cookieStore.delete("user_role");

  redirect("/masuk");
}
