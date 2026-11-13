/**
 * Modul pembersih dan penormalisasi formula matematika (KaTeX / LaTeX).
 * Menjamin semua ekspresi matematika terbungkus tanda pembungkus ($...$ / $$...$$)
 * dan membersihkan artifact regex atau karakter kontrol yang merusak tampilan rumus.
 */

export function sanitizeMathContent(content: string): string {
  if (!content) return "";
  let cleanText = String(content);

  // 1. Bersihkan artifact lama seperti \f$\frac...$ atau \f\frac yang disebabkan bug regex
  cleanText = cleanText.replace(/\\f\s*\$\s*(\\frac\{[^{}]+\}\{[^{}]+\})\s*\$/g, "$1");
  cleanText = cleanText.replace(/\\f\s*\$\s*\\frac\{/g, "\\frac{");
  cleanText = cleanText.replace(/\\f\s*\\frac\{/g, "\\frac{");
  cleanText = cleanText.replace(/\\f(?=\\frac)/g, "");

  // Bersihkan control characters (seperti form feed \x0c) atau simbol panah dari OCR/PDF
  cleanText = cleanText.replace(/[\x0c\u000c]rac/gi, "\\frac");
  cleanText = cleanText.replace(/[↑⬆▲]rac/gi, "\\frac");
  cleanText = cleanText.replace(/(?<![\\a-zA-Z])rac\{/g, "\\frac{");

  // Perbaiki tab-escaped LaTeX akibat single backslash di JS string literal (\times -> \t + imes, \text -> \t + ext)
  cleanText = cleanText.replace(/\times\b/g, "\\times");
  cleanText = cleanText.replace(/\text(?=\{|\b)/g, "\\text");
  cleanText = cleanText.replace(/\theta\b/g, "\\theta");

  // Perbaiki unescaped sqrt yang kehilangan backslash (misal: sqrt{3}, sqrt(3), sqrt3, atau di dalam frac{sqrt3+sqrt2}{...})
  cleanText = cleanText.replace(/(?<![\\a-zA-Z])sqrt\s*\{([^{}]+)\}/g, "\\sqrt{$1}");
  cleanText = cleanText.replace(/(?<![\\a-zA-Z])sqrt\s*\(([^()]+)\)/g, "\\sqrt{$1}");
  cleanText = cleanText.replace(/(?<![\\a-zA-Z])sqrt\s*(\d+)/g, "\\sqrt{$1}");
  cleanText = cleanText.replace(/(?<![\\a-zA-Z])sqrt(?=[{\d(])/g, "\\sqrt");

  // Perbaiki simbol derajat
  cleanText = cleanText.replace(/\^circ\b/g, "^\\circ");

  // Normalisasi double-escaped LaTeX
  cleanText = cleanText.replace(/\\\\(frac|sqrt|text|times|div|pm|cdot|approx|neq|le|ge|alpha|beta|theta|pi|degree|circ|implies|quad|sum|int|infty|Delta|angle)\b/g, "\\$1");

  // 2. Lindungi block yang sudah sah ($...$, $$...$$, atau code `...`)
  const protectedBlocks: string[] = [];
  function protect(match: string): string {
    protectedBlocks.push(match);
    return `___BLOCK_${protectedBlocks.length - 1}___`;
  }

  let masked = cleanText.replace(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$|`[^`]+?`)/g, protect);

  // 3. Tangani pecahan mandiri dengan dukungan nested braces (misal \frac{\sqrt{3}}{\sqrt{2}})
  const bracePattern = '\\{(?:[^{}]|\\{[^{}]*\\})*\\}';
  const fracRegex = new RegExp(`(?:\\b\\d+\\s*)?\\\\frac${bracePattern}${bracePattern}`, 'g');
  masked = masked.replace(fracRegex, (m) => protect(`$${m.trim()}$`));

  // Tangani akar mandiri yang belum terbungkus
  const sqrtRegex = new RegExp(`(?:\\b\\d+\\s*)?\\\\sqrt${bracePattern}`, 'g');
  masked = masked.replace(sqrtRegex, (m) => protect(`$${m.trim()}$`));

  masked = masked.replace(/(?:\b\d+\s*)?\\text\{[^{}]+\}(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?/g, (m) => protect(`$${m.trim()}$`));

  // 4. Deteksi apakah ada baris yang memuat sintaks formula LaTeX yang belum dibungkus $
  const hasLatexRegex = /\\(?:frac|sqrt|text|times|div|pm|cdot|circ|degree|angle|Delta|alpha|beta|theta|pi|sum|int|le|ge|neq|approx|implies)\b/;

  if (hasLatexRegex.test(masked)) {
    const lines = masked.split("\n");
    const processedLines = lines.map((line) => {
      if (!hasLatexRegex.test(line)) return line;

      // Pertahankan markdown prefix seperti "> ", "- ", "1. ", "- A. ", "A. "
      const mdPrefixMatch = line.match(/^(\s*(?:>|\*|-|\d+\.)*\s*(?:[A-D]\.)?\s*)/);
      const mdPrefix = mdPrefixMatch ? mdPrefixMatch[1] : "";
      const contentLine = mdPrefixMatch ? line.slice(mdPrefix.length) : line;

      // Cek jika baris memiliki label dengan titik dua (misal "Hitung luas segitiga: ...")
      const colonMatch = contentLine.match(/^([^:]+:)\s+(.+)$/);
      let prefix = "";
      let body = contentLine;

      if (colonMatch && !hasLatexRegex.test(colonMatch[1])) {
        prefix = colonMatch[1] + " ";
        body = colonMatch[2];
      }

      // Helper untuk membungkus formula matematika dan memisahkan kata pengantar
      function wrapFormula(rawFormula: string): string {
        let text = rawFormula.trim();
        let intro = "";
        const introMatch = text.match(/^([A-Za-z\s]+?)\s+((?:[a-zA-Z_]\s*=\s*)?\\.*)$/);
        if (introMatch && !hasLatexRegex.test(introMatch[1])) {
          intro = introMatch[1] + " ";
          text = introMatch[2].trim();
        }

        let endPunct = "";
        if (text.endsWith(".") && !text.includes("\\text{")) {
          text = text.slice(0, -1);
          endPunct = ".";
        }

        return `${intro}${protect(`$${text}$`)}${endPunct}`;
      }

      // Deteksi kata transisi penutup (misal "Jadi, luas segitiga adalah...")
      const transMatch = body.match(/^(.*?)(?:\s+)(Jadi,|Maka,|Sehingga,|Dengan demikian,)(.*)$/i);
      if (transMatch && hasLatexRegex.test(transMatch[1])) {
        const transWord = transMatch[2];
        const conclusion = transMatch[3];
        return `${mdPrefix}${prefix}${wrapFormula(transMatch[1])} ${transWord}${conclusion}`;
      }

      // Deteksi titik penutup sebelum kalimat baru (misal "... = 2\sqrt{3}. Jadi nilai...")
      const dotMatch = body.match(/^(.*?)\.\s+([A-Z][a-z].*)$/);
      if (dotMatch && hasLatexRegex.test(dotMatch[1])) {
        const afterDot = dotMatch[2];
        return `${mdPrefix}${prefix}${wrapFormula(dotMatch[1])}. ${afterDot}`;
      }

      // Jika seluruh body memuat LaTeX
      return `${mdPrefix}${prefix}${wrapFormula(body)}`;
    });

    masked = processedLines.join("\n");
  }

  // 4. Tangani pecahan mandiri, akar, atau unit ber-LaTeX yang tersisa di luar blok
  masked = masked.replace(/(?:\b\d+\s*)?\\frac\{[^{}]+\}\{[^{}]+\}/g, (m) => protect(`$${m.trim()}$`));
  masked = masked.replace(/(?:\b\d+\s*)?\\sqrt\{[^{}]+\}/g, (m) => protect(`$${m.trim()}$`));
  masked = masked.replace(/(?:\b\d+\s*)?\\text\{[^{}]+\}(?:\^[0-9a-zA-Z]+|\^\{[^{}]+\})?/g, (m) => protect(`$${m.trim()}$`));

  // 5. Kembalikan semua protected blocks secara utuh
  let result = masked;
  let prevResult = "";
  while (result !== prevResult && /___BLOCK_\d+___/.test(result)) {
    prevResult = result;
    result = result.replace(/___BLOCK_(\d+)___/g, (_, i) => protectedBlocks[Number(i)] || "");
  }

  return result;
}

