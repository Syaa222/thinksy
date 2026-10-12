import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import LatihanSatuSoalClient, { QuestionItem } from "@/components/sesi/LatihanSatuSoalClient";
import { redirect } from "next/navigation";

function isValidUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export default async function LatihanPage({
  params,
}: {
  params: Promise<{ sesiId: string }>;
}) {
  const { sesiId: rawId } = await params;
  const supabase = await createClient();
  const adminDb = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();

  let sesiId = rawId;

  // 1. Validasi sesi jika UUID
  let sesiRow: any = null;
  if (isValidUUID(rawId)) {
    const { data: s } = await adminDb
      .from("sesi")
      .select("id, bab_id, tipe_sesi, status_sesi, bab:bab_id (id, judul)")
      .eq("id", rawId)
      .maybeSingle();
    sesiRow = s;
  }

  // 2. Buat sesi jika belum ada UUID valid
  if (!sesiRow && user) {
    const { data: firstBab } = await adminDb
      .from("bab")
      .select("id, judul")
      .order("urutan", { ascending: true })
      .limit(1)
      .single();

    const { data: newSesi } = await adminDb
      .from("sesi")
      .insert({
        siswa_id: user.id,
        bab_id: firstBab?.id ?? null,
        tipe_sesi: "latihan",
        status_sesi: "aktif",
      })
      .select("id, bab_id, tipe_sesi, status_sesi")
      .single();

    if (newSesi?.id) {
      redirect(`/latihan/${newSesi.id}`);
    }
  }

  const effectiveBabId = sesiRow?.bab_id;
  const judulBab =
    (sesiRow?.bab as any)?.judul || "Bab 1: Pola Bilangan & Barisan";

  // 3. Query Soal Publik terbit untuk bab ini (Termasuk PG, Isian Singkat, dan Esai)
  let soalQuery = adminDb
    .from("soal")
    .select(`
      id,
      pertanyaan,
      tipe_soal,
      poin,
      opsi_soal (
        id,
        label,
        teks_opsi,
        urutan
      )
    `)
    .in("status_soal", ["dipublikasi", "terbit"]);

  if (effectiveBabId) {
    soalQuery = soalQuery.eq("bab_id", effectiveBabId);
  }

  const { data: dbSoalList } = await soalQuery.order("dibuat_pada", { ascending: true }).limit(10);

  // Default soal jika bank soal bab belum memiliki data
  const defaultSoalList: QuestionItem[] = [
    {
      id: "d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
      pertanyaan: "Diketahui barisan aritmatika $3, 7, 11, 15, \\dots$. Tentukan nilai dari suku ke-10 ($U_{10}$)!",
      tipeSoal: "pilihan_ganda",
      poin: 10,
      opsiSoal: [
        { id: "e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a77", label: "A", teksOpsi: "35" },
        { id: "e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a88", label: "B", teksOpsi: "39" },
        { id: "e3eebc99-9c0b-4ef8-bb6d-6bb9bd380a99", label: "C", teksOpsi: "43" },
        { id: "e4eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa", label: "D", teksOpsi: "47" },
      ],
    },
    {
      id: "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
      pertanyaan: "Jika beda ($b$) pada barisan aritmatika $5, 9, 13, 17, \\dots$ adalah konstan, berapakah nilai beda ($b$) tersebut?",
      tipeSoal: "isian_singkat",
      poin: 10,
    },
    {
      id: "d2eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
      pertanyaan: "Jelaskan perbedaan mendasar antara **Barisan Aritmatika** dan **Barisan Geometri**, serta berikan masing-masing 1 contoh sederhana!",
      tipeSoal: "esai",
      poin: 10,
    },
  ];

  const formattedSoalList: QuestionItem[] =
    dbSoalList && dbSoalList.length > 0
      ? dbSoalList.map((item: any) => ({
          id: item.id,
          pertanyaan: item.pertanyaan,
          tipeSoal: item.tipe_soal as "pilihan_ganda" | "isian_singkat" | "esai",
          poin: item.poin || 10,
          opsiSoal: Array.isArray(item.opsi_soal)
            ? [...item.opsi_soal]
                .sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
                .map((o: any, idx: number) => ({
                  id: o.id,
                  label: o.label || String.fromCharCode(65 + idx),
                  teksOpsi: o.teks_opsi,
                }))
            : undefined,
        }))
      : defaultSoalList;

  return (
    <LatihanSatuSoalClient
      sesiId={sesiId}
      judulBab={judulBab}
      soalList={formattedSoalList}
    />
  );
}
