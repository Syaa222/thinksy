import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import fs from "fs";
import path from "path";
import {
  getExamPackage,
  saveExamPackage,
  updateSingleQuestionInExam,
  ExamPackage,
  ExamQuestion,
} from "@/lib/exam-questions-store";

function getDeletedUjianIds(): string[] {
  try {
    const filePath = path.join(process.cwd(), "data", "deleted_ujian.json");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch {}
  return [];
}

function addDeletedUjianId(id: string) {
  try {
    const dirPath = path.join(process.cwd(), "data");
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const filePath = path.join(dirPath, "deleted_ujian.json");
    const current = getDeletedUjianIds();
    if (!current.includes(id)) {
      current.push(id);
      fs.writeFileSync(filePath, JSON.stringify(current, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Gagal simpan deleted_ujian:", err);
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ujianId } = await params;
    if (!ujianId) {
      return NextResponse.json({ error: "ID Ujian tidak ditemukan" }, { status: 400 });
    }

    const localPackage = getExamPackage(ujianId);

    try {
      const supabase = await createClient();
      const adminSupabase = createAdminClient();

      // 1. Ambil data ujian dari Supabase
      const { data: ujian, error: ujianErr } = await adminSupabase
        .from("ujian")
        .select(`
          id,
          judul,
          deskripsi,
          mapel,
          tipe,
          bab_id,
          durasi_menit,
          passing_grade,
          waktu_mulai,
          waktu_berakhir,
          status,
          token,
          acak_soal,
          acak_opsi,
          dibuat_pada,
          kelas:kelas_id ( id, nama_kelas ),
          bab:bab_id ( id, judul )
        `)
        .eq("id", ujianId)
        .maybeSingle();

      if (!ujianErr && ujian) {
        // 2. Ambil butir-butir soal ujian
        const { data: ujianSoalRows } = await adminSupabase
          .from("ujian_soal")
          .select(`
            id,
            urutan,
            poin_bobot,
            soal:soal_id (
              id,
              pertanyaan,
              tipe_soal,
              kunci_jawaban,
              pembahasan,
              tingkat_soal,
              opsi_soal (
                id,
                teks_opsi,
                benar,
                urutan,
                label,
                alasan_salah
              )
            )
          `)
          .eq("ujian_id", ujianId)
          .order("urutan", { ascending: true });

        if (ujianSoalRows && ujianSoalRows.length > 0) {
          const formattedSoalList = (ujianSoalRows || []).map((row: any) => {
            const s = Array.isArray(row.soal) ? row.soal[0] : row.soal;
            const opsiList = Array.isArray(s?.opsi_soal)
              ? [...s.opsi_soal].sort((a, b) => (a.urutan || 0) - (b.urutan || 0)).map((o: any) => ({
                  id: o.id,
                  teks: o.teks_opsi || "",
                  benar: Boolean(o.benar),
                  alasanSalah: o.alasan_salah || "",
                }))
              : [];

            return {
              id: s?.id || row.id,
              pertanyaan: s?.pertanyaan || "",
              tipeSoal: (s?.tipe_soal || "pilihan_ganda") as "pilihan_ganda" | "isian_singkat" | "esai",
              kunciJawaban: s?.kunci_jawaban || "",
              pembahasan: s?.pembahasan || "",
              poin: row.poin_bobot || 10,
              opsi: opsiList,
            };
          });

          return NextResponse.json({
            success: true,
            ujian,
            soalList: formattedSoalList,
          });
        }
      }
    } catch {
      // Abaikan error Supabase jika offline/sandboxed, gunakan local store
    }

    // Jika di database belum ada atau belum ada soalnya, gunakan exam store lokal yang tersinkronisasi
    if (localPackage) {
      return NextResponse.json({
        success: true,
        ujian: {
          id: localPackage.id,
          judul: localPackage.judul,
          deskripsi: localPackage.deskripsi,
          mapel: localPackage.mapel,
          tipe: localPackage.tipe,
          durasi_menit: localPackage.durasi_menit,
          passing_grade: localPackage.passing_grade,
          status: localPackage.status,
          token: localPackage.token || "MTK-8",
          bab_id: localPackage.bab_id,
        },
        soalList: localPackage.soalList || [],
      });
    }

    return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
  } catch (err: any) {
    console.error("Error GET ujian [id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ujianId } = await params;
    const body = await req.json();
    const {
      judul,
      deskripsi,
      mapel = "Matematika",
      tipe = "ulangan",
      token,
      babId,
      durasiMenit = 60,
      passingGrade = 75,
      status = "dipublikasi",
      soalList = [],
    } = body;

    if (!judul || !ujianId) {
      return NextResponse.json({ error: "Judul dan ID Ujian wajib diisi" }, { status: 400 });
    }

    // Simpan ke Central Exam Store agar persisten dan langsung sinkron ke seluruh review
    const examPackage: ExamPackage = {
      id: ujianId,
      judul,
      deskripsi: deskripsi || "",
      mapel,
      tipe: (tipe as "ulangan" | "ujian") || "ulangan",
      durasi_menit: Number(durasiMenit),
      passing_grade: Number(passingGrade),
      status: (status as "dipublikasi" | "draft" | "ditutup") || "dipublikasi",
      token: token ? String(token).trim().toUpperCase() : undefined,
      bab_id: babId || null,
      soalList: soalList as ExamQuestion[],
      diperbarui_pada: new Date().toISOString(),
    };
    saveExamPackage(examPackage);

    // Upayakan sinkronisasi ke Supabase jika database online
    try {
      const supabase = await createClient();
      const adminSupabase = createAdminClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const updatePayload: any = {
          judul,
          deskripsi: deskripsi || "",
          mapel,
          tipe,
          durasi_menit: Number(durasiMenit),
          passing_grade: Number(passingGrade),
          status,
        };
        if (token) updatePayload.token = String(token).trim().toUpperCase();
        if (babId) updatePayload.bab_id = babId;

        await adminSupabase
          .from("ujian")
          .update(updatePayload)
          .eq("id", ujianId);

        if (Array.isArray(soalList) && soalList.length > 0) {
          await adminSupabase.from("ujian_soal").delete().eq("ujian_id", ujianId);
          for (let idx = 0; idx < soalList.length; idx++) {
            const item = soalList[idx];
            let targetSoalId = item.id;
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetSoalId || "");
            const tipeSoal = item.tipeSoal || "pilihan_ganda";
            const correctOpt = Array.isArray(item.opsi) ? item.opsi.find((o: any) => o.benar) : null;
            const kunci = item.kunciJawaban || (tipeSoal === "pilihan_ganda" ? (correctOpt?.teks || "") : "");

            if (isUuid) {
              await adminSupabase
                .from("soal")
                .update({
                  pertanyaan: item.pertanyaan,
                  tipe_soal: tipeSoal,
                  kunci_jawaban: kunci,
                  pembahasan: item.pembahasan || "",
                })
                .eq("id", targetSoalId);

              if (tipeSoal === "pilihan_ganda" && Array.isArray(item.opsi)) {
                await adminSupabase.from("opsi_soal").delete().eq("soal_id", targetSoalId);
                const opsiRows = item.opsi.map((op: any, oi: number) => ({
                  soal_id: targetSoalId,
                  teks_opsi: op.teks || op.teksOpsi || "",
                  benar: Boolean(op.benar),
                  urutan: oi + 1,
                  label: String.fromCharCode(65 + oi),
                  alasan_salah: op.alasanSalah || null,
                }));
                await adminSupabase.from("opsi_soal").insert(opsiRows);
              }
            }
          }
        }
      }
    } catch {
      // Abaikan error jaringan Supabase jika lokal/sandboxed
    }

    return NextResponse.json({
      success: true,
      ujian: examPackage,
      message: "Soal dan lembar ujian berhasil diperbarui dan tersinkronisasi!",
    });
  } catch (err: any) {
    console.error("Error PUT ujian [id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Memperbarui butir soal secara individual langsung dari lembar kerja review siswa
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ujianId } = await params;
    const body = await req.json();
    const { questionId, patch } = body;

    if (!ujianId || !questionId || !patch) {
      return NextResponse.json(
        { error: "ujianId, questionId, dan patch data wajib disertakan" },
        { status: 400 }
      );
    }

    const updatedQ = updateSingleQuestionInExam(ujianId, questionId, patch);
    if (!updatedQ) {
      return NextResponse.json(
        { error: "Gagal memperbarui butir soal di paket ujian terkait" },
        { status: 404 }
      );
    }

    // Upayakan sync ke Supabase jika UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(questionId)) {
      try {
        const adminSupabase = createAdminClient();
        await adminSupabase
          .from("soal")
          .update({
            pertanyaan: patch.pertanyaan,
            kunci_jawaban: patch.kunciJawaban,
            pembahasan: patch.pembahasan,
          })
          .eq("id", questionId);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: "Butir soal berhasil diperbarui!",
      question: updatedQ,
    });
  } catch (err: any) {
    console.error("Error PATCH ujian [id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ujianId } = await params;
    if (!ujianId) {
      return NextResponse.json({ error: "ID Ujian wajib diisi" }, { status: 400 });
    }

    // 1. Bersihkan seluruh jawaban_ujian & sesi_ujian terlebih dahulu
    const { data: sesiList } = await adminSupabase
      .from("sesi_ujian")
      .select("id")
      .eq("ujian_id", ujianId);

    const sesiIds = (sesiList || []).map((s) => s.id);
    if (sesiIds.length > 0) {
      await adminSupabase.from("jawaban_ujian").delete().in("sesi_id", sesiIds);
      await adminSupabase.from("sesi_ujian").delete().eq("ujian_id", ujianId);
    }

    // 2. Bersihkan ujian_soal
    await adminSupabase.from("ujian_soal").delete().eq("ujian_id", ujianId);

    // 3. Hapus ujian master
    const { error: delErr } = await adminSupabase
      .from("ujian")
      .delete()
      .eq("id", ujianId);

    // Catat ID ke daftar deleted_ujian agar kartu ujian (termasuk kanonikal) terhapus permanen
    addDeletedUjianId(ujianId);

    return NextResponse.json({
      success: true,
      message: "Ujian berhasil dihapus.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

