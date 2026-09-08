export const ALLOWED_MAPEL_NAMES = [
  "Matematika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "IPA",
  "IPS",
  "PPKN",
  "PJOK",
  "SENI",
  "AGAMA",
] as const;

export type AllowedMapelName = (typeof ALLOWED_MAPEL_NAMES)[number];

/**
 * Normalizes any raw subject name string into one of the 9 allowed canonical subjects.
 */
export function normalizeMapel(name?: string | null): AllowedMapelName {
  if (!name) return "Matematika";
  const s = name.trim().toLowerCase();

  if (s.includes("matematika") || s.includes("math") || s === "mtk") return "Matematika";
  if (s.includes("indonesia") || s === "bahasa indonesia" || s === "bindo") return "Bahasa Indonesia";
  if (s.includes("inggris") || s.includes("english") || s === "bahasa inggris" || s === "bing") return "Bahasa Inggris";
  if (s.includes("ipa") || s.includes("alam") || s.includes("fisika") || s.includes("biologi")) return "IPA";
  if (s.includes("ips") || s.includes("sosial") || s.includes("sejarah") || s.includes("geografi") || s.includes("ekonomi")) return "IPS";
  if (s.includes("pancasila") || s.includes("ppkn") || s.includes("pkn") || s.includes("kewarganegaraan")) return "PPKN";
  if (s.includes("pjok") || s.includes("jasmani") || s.includes("olahraga") || s.includes("penjas")) return "PJOK";
  if (s.includes("seni") || s.includes("musik") || s.includes("rupa") || s.includes("tari") || s.includes("teater") || s.includes("budaya") || s.includes("prakarya")) return "SENI";
  if (s.includes("agama") || s.includes("pai") || s.includes("islam") || s.includes("kristen") || s.includes("katolik") || s.includes("hindu") || s.includes("buddha") || s.includes("konghucu") || s.includes("budi pekerti")) return "AGAMA";

  return "Matematika";
}
