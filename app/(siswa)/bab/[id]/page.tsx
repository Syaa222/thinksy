import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import DaftarMateriClient from "./DaftarMateriClient";
import { generateTextbookModules } from "@/lib/curriculum-textbook-engine";

export default async function DetailBabPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ materiId?: string; view?: string }>;
}) {
  const { id } = await params;
  const { materiId, view } = await searchParams;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const IPA_BABS: Record<string, any> = {
    "ipa-bab-1": {
      id: "ipa-bab-1",
      judul: "Bab 1: Pengenalan Sel & Mikroskop",
      deskripsi: "Struktur sel hewan dan tumbuhan, penggunaan mikroskop cahaya, dan hierarki organisasi kehidupan.",
      urutan: 1,
      mapel: "IPA",
      kelas: 8,
    },
    "ipa-bab-2": {
      id: "ipa-bab-2",
      judul: "Bab 2: Struktur dan Fungsi Tubuh Manusia",
      deskripsi: "Sistem pencernaan, sistem peredaran darah, pernapasan, dan ekskresi pada manusia serta nutrisi seimbang.",
      urutan: 2,
      mapel: "IPA",
      kelas: 8,
    },
    "ipa-bab-3": {
      id: "ipa-bab-3",
      judul: "Bab 3: Usaha, Energi, dan Pesawat Sederhana",
      deskripsi: "Konsep usaha fisik, transformasi energi mekanik, kinetik, potensial, serta tuas, bidang miring, dan katrol.",
      urutan: 3,
      mapel: "IPA",
      kelas: 8,
    },
    "ipa-bab-4": {
      id: "ipa-bab-4",
      judul: "Bab 4: Getaran, Gelombang, dan Cahaya",
      deskripsi: "Konsep frekuensi, periode getaran, perambatan gelombang bunyi, serta sifat-sifat pembiasan dan cermin optik.",
      urutan: 4,
      mapel: "IPA",
      kelas: 8,
    },
    "ipa-bab-5": {
      id: "ipa-bab-5",
      judul: "Bab 5: Unsur, Senyawa, dan Struktur Bumi",
      deskripsi: "Klasifikasi materi, tabel periodik, pemisahan campuran, serta lapisan litosfer, hidrosfer, dan tata surya.",
      urutan: 5,
      mapel: "IPA",
      kelas: 8,
    },
  };

  const isIpaTarget = id.startsWith("ipa-") || Boolean(IPA_BABS[id]);

  // 1. Ambil data bab dari Supabase jika bukan IPA virtual bab
  let babData: any = null;
  if (!isIpaTarget) {
    const { data } = await supabase
      .from("bab")
      .select(
        `
        id,
        judul,
        deskripsi,
        urutan,
        mapel,
        kelas,
        materi (
          id,
          judul,
          konten_markdown,
          urutan
        )
      `
      )
      .eq("id", id)
      .maybeSingle();
    babData = data;
  }

  // Jika bab yang diakses adalah materi sisa kurikulum lama non-fase D,
  // otomatis redirect ke Bab 1 Matematika Kelas 8 resmi
  const mapelLower = (babData?.mapel || "").toLowerCase();
  const judulLower = (babData?.judul || "").toLowerCase();
  const isOtherSubject =
    !isIpaTarget &&
    (mapelLower.includes("indonesia") ||
      mapelLower.includes("inggris") ||
      mapelLower.includes("ips") ||
      mapelLower.includes("seni") ||
      mapelLower.includes("pjok") ||
      judulLower.includes("observasi") ||
      judulLower.includes("puisi") ||
      judulLower.includes("surat") ||
      judulLower.includes("pidato") ||
      judulLower.includes("iklan"));

  if (isOtherSubject) {
    const { data: mathBab } = await supabase
      .from("bab")
      .select("id")
      .ilike("mapel", "%matematika%")
      .order("urutan", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (mathBab?.id && mathBab.id !== id) {
      redirect(`/bab/${mathBab.id}`);
    }
  }

  // Selesaikan data bab
  let resolvedBab: any = null;
  if (isIpaTarget) {
    resolvedBab = IPA_BABS[id] || IPA_BABS["ipa-bab-1"];
  } else {
    resolvedBab = babData;
  }

  if (!resolvedBab) {
    const { data: fallbackBab } = await supabase
      .from("bab")
      .select(
        `
        id,
        judul,
        deskripsi,
        urutan,
        mapel,
        kelas,
        materi (
          id,
          judul,
          konten_markdown,
          urutan
        )
      `
      )
      .ilike("mapel", "%matematika%")
      .order("urutan", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fallbackBab) {
      resolvedBab = fallbackBab;
    } else {
      notFound();
    }
  }

  // Tetapkan mapel
  if (!resolvedBab.mapel) {
    resolvedBab.mapel = isIpaTarget ? "IPA" : "Matematika";
  }

  let listMateri =
    resolvedBab.materi?.sort((a: any, b: any) => a.urutan - b.urutan) || [];

  // Jika listMateri kosong atau belum terisi, perkaya dengan modul textbook standar
  if (listMateri.length === 0) {
    const defaultModules = generateTextbookModules(
      resolvedBab.judul,
      resolvedBab.mapel || "Matematika",
      resolvedBab.kelas || 8,
      resolvedBab.deskripsi || undefined
    );
    listMateri = defaultModules.map((m, idx) => ({
      id: `generated-${id}-${idx + 1}`,
      judul: m.judul,
      konten_markdown: m.konten_markdown,
      urutan: m.urutan,
    }));
  }

  // 2. Hitung progres belajar bab & ambil profil serta kelas nyata dari database
  const { data: { user } } = await supabase.auth.getUser();

  let answeredCount = 0;
  let totalSoalCount = 0;
  let studentName = "Siswa";
  let studentPhoto: string | null = null;
  let namaKelas = `Kelas ${resolvedBab.kelas || 8}`;

  if (user) {
    // Ambil profil siswa
    const { data: profil } = await supabase
      .from("profil")
      .select("id, nama_lengkap, email, foto_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profil?.nama_lengkap) {
      studentName = profil.nama_lengkap;
    } else if (user.email) {
      studentName = user.email.split("@")[0];
    }
    if (profil?.foto_url) {
      studentPhoto = profil.foto_url;
    }

    // Ambil kelas siswa dari anggota_kelas
    const { data: memberKelas } = await adminSupabase
      .from("anggota_kelas")
      .select("kelas ( id, nama, nama_kelas, tingkat )")
      .eq("siswa_id", user.id)
      .maybeSingle();

    const rawKelas = (memberKelas as any)?.kelas;
    if (rawKelas) {
      const kName = rawKelas.nama_kelas || rawKelas.nama;
      if (kName) {
        namaKelas = kName.toLowerCase().startsWith("kelas") ? kName : `Kelas ${kName}`;
      } else if (rawKelas.tingkat) {
        namaKelas = `Kelas ${rawKelas.tingkat}`;
      }
    } else if (resolvedBab.kelas) {
      namaKelas = `Kelas ${resolvedBab.kelas}`;
    }

    const { count: dbTotalSoal } = await supabase
      .from("soal_publik")
      .select("id", { count: "exact", head: true })
      .eq("bab_id", id);

    totalSoalCount = dbTotalSoal || 0;

    if (totalSoalCount > 0) {
      const { data: answeredRows } = await supabase
        .from("jawaban")
        .select("soal_id, soal_publik!inner(bab_id), sesi!inner(siswa_id)")
        .eq("sesi.siswa_id", user.id)
        .eq("soal_publik.bab_id", id);

      const answeredSet = new Set(answeredRows?.map((r: any) => r.soal_id));
      answeredCount = answeredSet.size;
    }
  }

  const chapterProgressPercent = totalSoalCount > 0
    ? Math.min(100, Math.round((answeredCount / totalSoalCount) * 100))
    : 0;

  return (
    <DaftarMateriClient
      babId={id}
      judulBab={resolvedBab.judul}
      deskripsiBab={resolvedBab.deskripsi || "Capaian Pembelajaran Kurikulum Merdeka Fase D."}
      urutanBab={resolvedBab.urutan || 1}
      mapel={resolvedBab.mapel || "Matematika"}
      kelas={resolvedBab.kelas || 8}
      namaKelas={namaKelas}
      studentName={studentName}
      studentPhoto={studentPhoto}
      listMateri={listMateri}
      initialMateriId={materiId}
      initialViewMode={(view as "pdf" | "journal" | "modules") || "pdf"}
      chapterProgressPercent={chapterProgressPercent}
      answeredCount={answeredCount}
      totalSoalCount={totalSoalCount}
    />
  );
}
