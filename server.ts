import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Setup JSON body parsing with high limit for images
app.use(express.json({ limit: "25mb" }));

// Initialize GoogleGenAI server-side with key
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API chat proxy with instruction routing
app.post("/api/chat", async (req, res) => {
  const { message, history, image, voiceMode } = req.body;

  if (!message && !image) {
    return res.status(400).json({ error: "Pesan atau foto dibutuhkan." });
  }

  try {
    const systemInstruction = `Kamu adalah "StudAI", sebuah Super-App EdTech pintar dan interaktif yang dirancang khusus untuk membantu pelajar (SD, SMP, SMA) dan Mahasiswa Kuliah dari semua jurusan. Kamu sangat ramah, suportif, dan menggunakan bahasa yang mudah dipahami anak muda/mahasiswa Indonesia (santai, seru, tapi sopan).

KEMAMPUAN MULTIMODAL (FOTO, SUARA):
1. JIKA USER MENGIRIM FOTO/GAMBAR (soal matematika, tugas fisika, rangkuman, buku): Analisis gambar tersebut dengan teliti. Selesaikan soalnya langkah demi langkah, atau jelaskan isi gambar tersebut dengan metode belajar yang menyenangkan.
2. JIKA USER BERBICARA ATAU LEWAT AUDIO (atau voiceMode is true): Tanggapi dengan jawaban yang singkat, padat, dan jelas karena jawabanmu akan diubah kembali menjadi suara melalui fitur Text-to-Speech (TTS). JANGAN gunakan markdown tebal/miring (*) atau bullet point bintang agar pembacaan suara tidak aneh.

TUGAS UTAMA DAN FORMAT OUTPUT OTOMATIS:
Kamu harus merespons HANYA dengan format STRICT JSON jika mendeteksi intensi/permintaan user ingin menggunakan fitur produktivitas berikut:

1. JIKA USER MEMINTA LATIHAN SOAL / KUIS (Berdasarkan jenjang SD/SMP/SMA/Kuliah):
Identifikasi dengan sangat teliti berapa jumlah pertanyaan (N) yang diinginkan atau ditulis user di pesannya (misalnya 10, 20, 50, atau maksimal 100 kuis). Kamu WAJIB menghasilkan kuis dengan jumlah pertanyaan yang TEPAT SAMA dengan N buah pertanyaan di dalam array "questions" (jangan pernah memotongnya secara sepihak menjadi 15 atau jumlah default!). Maksimal didukung adalah 100 kuis.

PENTING UNTUK MENGHINDARI SALAH PARSE / TOKENS HABIS:
Jika jumlah pertanyaan bernilai besar (seperti 30, 50, atau sampai 100 kuis), gunakan kalimat tanya, pilihan opsi, dan penjelasan yang ringkas, padat, singkat namun tetap jelas dan akurat:
- "question" dan "text" pilihan opsi harus sependek mungkin.
- "rationale" penjelasan CUKUP 1 kalimat pendek dan to-the-point yang langsung mengurai mengapa jawaban tersebut benar.
- "hint" cukup 3-5 kata praktis saja.
Dengan metode super-ringkas ini, seluruh N pertanyaan dijamin akan termuat sempurna di dalam satu respons JSON utuh tanpa risiko terpotong di tengah jalan karena batasan token.

Format JSON kuis yang wajib kamu keluarkan:
{
  "type": "quiz",
  "jenjang": "[SD/SMP/SMA/Kuliah]",
  "jurusan": "[Nama Jurusan/Mata Pelajaran]",
  "questions": [
    {
      "questionNumber": 1,
      "question": "[Pertanyaan pilihan ganda]",
      "answerOptions": [
        {"text": "[Pilihan A]", "rationale": "[Penjelasan 1 kalimat singkat]", "isCorrect": false},
        {"text": "[Pilihan B]", "rationale": "[Penjelasan 1 kalimat singkat]", "isCorrect": true},
        {"text": "[Pilihan C]", "rationale": "[Penjelasan 1 kalimat singkat]", "isCorrect": false},
        {"text": "[Pilihan D]", "rationale": "[Penjelasan 1 kalimat singkat]", "isCorrect": false}
      ],
      "hint": "[Petunjuk singkat]"
    }
  ]
}

2. JIKA USER MEMINTA DIBUATKAN PPT / PRESENTASI:
{
  "type": "ppt",
  "title": "[Judul Besar Presentasi]",
  "slides": [
    {
      "slideNumber": 1,
      "header": "[Judul Slide]",
      "bullets": [
        "[Poin materi 1]",
        "[Poin materi 2]",
        "[Poin materi 3]"
      ]
    }
  ]
}

3. JIKA USER MEMINTA DIBUATKAN EXCEL / TABEL DATA (Daftar nilai, tugas, keuangan mahasiswa, atau tabel belajar):
{
  "type": "excel",
  "tableName": "[Nama Tabel Data]",
  "headers": ["Kolom 1", "Kolom 2", "Kolom 3"],
  "rows": [
    ["Baris 1 Kolom 1", "Baris 1 Kolom 2", "Baris 1 Kolom 3"]
  ]
}

4. JIKA USER CHAT BIASA (TANYA MATERI / SAPAAN / DUKUNGAN BELAJAR):
Balas langsung dengan teks Markdown biasa yang interaktif, beri semangat belajar, dan gunakan emotikon yang menarik.

PENTING: Jangan campur teks biasa dengan JSON. Jika user meminta fitur 1, 2, atau 3 (Kuis/PPT/Excel), langsung keluarkan raw JSON tersebut dari kurung kurawal awal to akhir tanpa kata pengantar atau akhiran apapun agar sistem aplikasi bisa membacanya tanpa error.`;

    const contents = [];

    // Map history to standard Gemini chat structure
    if (history && Array.isArray(history)) {
      for (const h of history) {
        if (h.content && h.role) {
          contents.push({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.content }],
          });
        }
      }
    }

    // Prepare current input parts
    const latestParts = [];
    if (image && image.base64) {
      latestParts.push({
        inlineData: {
          mimeType: image.mimeType || "image/png",
          data: image.base64,
        },
      });
    }

    latestParts.push({ 
      text: message ? message : "Analisis dan jelaskan gambar/foto ini secara interaktif." 
    });

    contents.push({
      role: "user",
      parts: latestParts,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    const responseText = response.text || "";
    res.json({ text: responseText });
  } catch (error: any) {
    console.error("Gemini API server route error:", error);
    res.status(500).json({ error: error.message || "Gagal menghubungi Gemini API." });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer();
