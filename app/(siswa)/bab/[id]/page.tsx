import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
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

  // 1. Ambil data bab dari Supabase
  const { data: babData } = await supabase
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

  // Jika bab tidak ditemukan di database, coba cari fallback atau render notFound
  let resolvedBab = babData;
  if (!resolvedBab) {
    // Check if ID is in standard list or return 404
    notFound();
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

  // 2. Hitung progres belajar bab secara nyata dari database
  const { data: { user } } = await supabase.auth.getUser();

  let answeredCount = 0;
  let totalSoalCount = 0;

  const { count: dbTotalSoal } = await supabase
    .from("soal_publik")
    .select("id", { count: "exact", head: true })
    .eq("bab_id", id);

  totalSoalCount = dbTotalSoal || 0;

  if (user && totalSoalCount > 0) {
    const { data: answeredRows } = await supabase
      .from("jawaban")
      .select("soal_id, soal_publik!inner(bab_id), sesi!inner(siswa_id)")
      .eq("sesi.siswa_id", user.id)
      .eq("soal_publik.bab_id", id);

    const answeredSet = new Set(answeredRows?.map((r: any) => r.soal_id));
    answeredCount = answeredSet.size;
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
      listMateri={listMateri}
      initialMateriId={materiId}
      initialViewMode={(view as "pdf" | "journal" | "modules") || "pdf"}
      chapterProgressPercent={chapterProgressPercent}
      answeredCount={answeredCount}
      totalSoalCount={totalSoalCount}
    />
  );
}
