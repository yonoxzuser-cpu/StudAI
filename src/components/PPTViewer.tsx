import React, { useState } from "react";
import { PPTPayload, PPTSlide } from "../types";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, MonitorPlay, Palette, Copy, Check, Presentation, Download, FileDown, Printer, FileText } from "lucide-react";
import pptxgen from "pptxgenjs";

interface PPTViewerProps {
  payload: PPTPayload;
}

type SlideTheme = "slate" | "sunset" | "mint" | "light" | "cyberpunk";

export default function PPTViewer({ payload }: PPTViewerProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [theme, setTheme] = useState<SlideTheme>("slate");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const slides: PPTSlide[] = payload.slides || [];
  const totalSlides = slides.length;
  const currentSlide = slides[currentSlideIndex];

  if (slides.length === 0) {
    return (
      <div className="p-6 bg-white border-2 border-slate-200 rounded-3xl text-center text-slate-500 font-bold shadow-sm">
        Tidak ada slide presentasi yang tersedia.
      </div>
    );
  }

  const handleNext = () => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleCopyMaterial = () => {
    const textRepresentation = slides
      .map(
         (slide) =>
          `SLIDE ${slide.slideNumber}: ${slide.header}\n` +
          slide.bullets.map((bullet) => `• ${bullet}`).join("\n")
      )
      .join("\n\n");

    try {
      navigator.clipboard.writeText(`📖 PRESENTASI: ${payload.title}\n\n${textRepresentation}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Clipboard access not available.");
    }
  };

  const handleDownloadPPT = () => {
    try {
      const pptx = new pptxgen();
      
      pptx.defineLayout({ name: "CUSTOM_16_9", width: 13.33, height: 7.5 });
      pptx.layout = "CUSTOM_16_9";
      
      const isDark = theme === "slate" || theme === "cyberpunk" || theme === "sunset";
      let bgHex = "FFFFFF";
      let textHex = "0F172A";

      if (theme === "slate") { bgHex = "1E1B4B"; textHex = "FFFFFF"; }
      else if (theme === "sunset") { bgHex = "FFFBEB"; textHex = "1E293B"; }
      else if (theme === "mint") { bgHex = "F0FDF4"; textHex = "052E16"; }
      else if (theme === "cyberpunk") { bgHex = "FDF4FF"; textHex = "2E1065"; }

      const titleSlide = pptx.addSlide();
      titleSlide.background = { color: bgHex };
      
      titleSlide.addText(payload.title || "STUD-AI PRESENTATION", {
        x: 1.0,
        y: 2.2,
        w: 11.33,
        h: 2.0,
        fontSize: 34,
        bold: true,
        color: textHex,
        fontFace: "Arial",
        align: "center"
      });

      titleSlide.addText("Teman belajar cerdas bertenaga AI • StudAI EdTech Super-App", {
        x: 1.0,
        y: 4.5,
        w: 11.33,
        h: 1.0,
        fontSize: 14,
        color: isDark ? "D1D5DB" : "4B5563",
        fontFace: "Arial",
        align: "center"
      });

      slides.forEach((s) => {
        const slide = pptx.addSlide();
        slide.background = { color: "FFFFFF" };

        slide.addText(s.header, {
          x: 0.8,
          y: 0.6,
          w: 11.73,
          h: 1.0,
          fontSize: 24,
          bold: true,
          color: "0F172A",
          fontFace: "Arial"
        });

        const textObjects = s.bullets.map((bullet) => {
          return { text: bullet, options: { bullet: true, color: "334155", fontSize: 16, fontFace: "Arial", paraSpaceAfter: 10 } };
        });

        slide.addText(textObjects, {
          x: 1.0,
          y: 1.7,
          w: 11.33,
          h: 4.6,
          valign: "top"
        });

        slide.addText("StudAI Presentation Tool", {
          x: 0.8,
          y: 6.8,
          w: 5.0,
          h: 0.3,
          fontSize: 9,
          color: "94A3B8",
          fontFace: "Arial"
        });

        slide.addText(`Slide ${s.slideNumber}`, {
          x: 11.5,
          y: 6.8,
          w: 1.0,
          h: 0.3,
          fontSize: 9,
          color: "94A3B8",
          fontFace: "Arial",
          align: "right"
        });
      });

      const safeTitle = (payload.title || "presentasi_studai").toLowerCase().replace(/[^a-z0-9]+/g, "_");
      pptx.writeFile({ fileName: `${safeTitle}.pptx` });
    } catch (err) {
      console.error("Export to PPT failed", err);
      alert("Gagal mengekspor file PPT. Gunakan format salin materi atau coba lagi!");
    }
  };

  const handleDownloadHTML = () => {
    try {
      const safeTitle = payload.title || "Presentasi StudAI";
      const slidesJSON = JSON.stringify(slides);
      
      const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${safeTitle} - StudAI Offline Presentation</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background-color: #f8fafc; }
  </style>
</head>
<body class="h-screen flex flex-col justify-between overflow-hidden">
  <header class="bg-white border-b-2 border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black">S</div>
      <h1 class="text-lg font-black tracking-tight text-slate-900">\${safeTitle}</h1>
    </div>
    <span class="text-xs font-mono font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase">Offline Slide Deck</span>
  </header>

  <main class="flex-1 flex items-center justify-center p-6 md:p-12">
    <div class="w-full max-w-4xl bg-white border-4 border-slate-900 rounded-3xl p-8 md:p-12 shadow-[8px_8px_0px_rgba(0,0,0,0.15)] min-h-[400px] flex flex-col justify-between relative">
      <div id="slide-content">
        <h2 id="slide-header" class="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">Memuat slides...</h2>
        <div id="slide-bullets" class="space-y-4"></div>
      </div>

      <div class="flex justify-between items-center pt-8 border-t border-slate-100 text-xs font-bold text-slate-400 mt-8">
        <span>StudAI Presentation Deck</span>
        <span id="slide-footer-counter">Slide 1 dari 1</span>
      </div>
    </div>
  </main>

  <footer class="bg-white border-t-2 border-slate-200 px-8 py-4 flex justify-between items-center select-none">
    <div class="flex gap-2">
      <button onclick="prevSlide()" class="px-4 py-2 border-2 border-slate-300 hover:border-slate-800 rounded-xl font-bold text-sm bg-white cursor-pointer transition-colors">◀ Sebelumnya</button>
      <button onclick="nextSlide()" class="px-4 py-2 border-2 border-slate-900 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold text-sm cursor-pointer transition-colors shadow-[2px_2px_0px_#000000]">Berikutnya ▶</button>
    </div>
    <div class="text-xs text-slate-400 font-mono">Gunakan tombol arah KIRI / KANAN keyboard untuk berganti slide</div>
  </footer>

  <script>
    const slides = \${slidesJSON};
    let currentIdx = 0;

    function renderSlide() {
      const slide = slides[currentIdx];
      document.getElementById('slide-header').innerText = slide.header;
      
      const bulletsDiv = document.getElementById('slide-bullets');
      bulletsDiv.innerHTML = '';
      
      slide.bullets.forEach((bullet, bIdx) => {
        const item = document.createElement('div');
        item.className = 'flex items-start gap-4';
        item.innerHTML = \\\`<span class="w-6 h-6 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 mt-1">\\\${bIdx + 1}</span><p class="text-base md:text-lg text-slate-700 leading-relaxed font-medium">\\\${bullet}</p>\\\`;
        bulletsDiv.appendChild(item);
      });

      document.getElementById('slide-footer-counter').innerText = \\\`Slide \\\${currentIdx + 1} dari \\\${slides.length}\\\`;
    }

    function nextSlide() {
      if (currentIdx < slides.length - 1) {
        currentIdx++;
        renderSlide();
      }
    }

    function prevSlide() {
      if (currentIdx > 0) {
        currentIdx--;
        renderSlide();
      }
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    });

    renderSlide();
  </script>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = (payload.title || "slide_materi_studai").toLowerCase().replace(/[^a-z0-9]+/g, "_");
      link.setAttribute("download", `${fileName}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // Theme-specific styles designed with high-contrast, polished bold editorial theme details
  const getThemeClasses = () => {
    switch (theme) {
      case "sunset":
        return {
          wrapper: "bg-amber-50 border-amber-200 text-slate-900",
          card: "bg-white border-amber-200 text-slate-900 shadow-sm",
          headerText: "text-amber-650",
          bulletIcon: "bg-amber-100 text-amber-850 border border-amber-300 font-bold",
          footerText: "text-amber-800/70",
          accentLine: "bg-amber-500",
        };
      case "mint":
        return {
          wrapper: "bg-emerald-50 border-emerald-200 text-slate-900",
          card: "bg-white border-emerald-250 text-slate-900 shadow-sm",
          headerText: "text-emerald-700 font-extrabold",
          bulletIcon: "bg-emerald-100 text-emerald-850 border border-emerald-300 font-bold",
          footerText: "text-emerald-800/70",
          accentLine: "bg-emerald-500",
        };
      case "light":
        return {
          wrapper: "bg-slate-50 border-slate-200 text-slate-900",
          card: "bg-white border-slate-150 text-slate-900 shadow-sm",
          headerText: "text-indigo-600 font-black",
          bulletIcon: "bg-indigo-50 text-indigo-700 border-2 border-indigo-200 font-bold",
          footerText: "text-slate-500",
          accentLine: "bg-indigo-650",
        };
      case "cyberpunk":
        return {
          wrapper: "bg-purple-50 border-purple-200 text-slate-900",
          card: "bg-white border-purple-250 text-slate-900 shadow-sm",
          headerText: "text-purple-700 font-extrabold",
          bulletIcon: "bg-purple-100 text-purple-800 border border-purple-300 font-bold",
          footerText: "text-purple-800/70",
          accentLine: "bg-purple-500",
        };
      case "slate":
      default:
        return {
          wrapper: "bg-white border-slate-200 text-slate-900",
          card: "bg-slate-50 border-slate-200 text-slate-900",
          headerText: "text-indigo-600 font-black-display",
          bulletIcon: "bg-indigo-50 text-indigo-700 border-2 border-indigo-250 font-bold",
          footerText: "text-indigo-700/80",
          accentLine: "bg-indigo-600",
        };
    }
  };

  const style = getThemeClasses();

  const renderSlidesPlayer = (isFull: boolean) => {
    return (
      <div className={`flex flex-col flex-1 justify-between p-6 md:p-10 h-full ${style.wrapper} ${isFull ? "border-0" : ""}`}>
        {/* Header containing slide layout title */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-slate-100">
          <div className="flex items-center gap-2">
            <Presentation className="w-5 h-5 text-indigo-600" />
            <h4 className="text-xs font-black-display tracking-tight text-slate-800 uppercase line-clamp-1 max-w-[200px] md:max-w-xl">
              {payload.title || "STUD-AI PRESENTATION"}
            </h4>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-slate-905 bg-indigo-600 text-white px-2.5 py-1 rounded-full border border-slate-900">
            Slide {currentSlideIndex + 1} / {totalSlides}
          </span>
        </div>

        {/* Dynamic visual slide canvas (16:9 like presentation board) */}
        <div className={`flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full my-4`}>
          {/* Accent Line indicator */}
          <div className={`w-14 h-1.5 rounded MB-4 ${style.accentLine}`}></div>

          <h2 className={`text-xl md:text-3.5xl font-black-display leading-snug tracking-tight mb-5 ${style.headerText}`}>
            {currentSlide.header}
          </h2>

          <div className="space-y-3">
            {currentSlide.bullets && currentSlide.bullets.map((bullet, index) => (
              <div
                key={index}
                className="flex items-start gap-3.5 animate-fade-in"
              >
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 mt-0.5 ${style.bulletIcon}`}>
                  {index + 1}
                </span>
                <p className="text-sm md:text-base leading-relaxed text-slate-800 select-all font-semibold font-sans">
                  {bullet}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footnotes indicator */}
        <div className="flex justify-between items-center text-[9px] md:text-xs font-mono font-bold uppercase tracking-wider mt-4 pt-3 border-t-2 border-slate-100">
          <span className={style.footerText}>StudAI PRESENTATION TOOL</span>
          <span className="text-slate-400">PAGE {currentSlideIndex + 1}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white border-2 border-slate-200 shadow-md rounded-3xl overflow-hidden max-w-full my-4">
        {/* Core Control actions bar */}
        <div className="bg-slate-50 p-4 border-b-2 border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-slate-900">
              SLIDEDECK
            </span>
            <h3 className="text-xs font-black-display tracking-tight text-slate-800 truncate max-w-[200px] md:max-w-[400px]">
              {payload.title}
            </h3>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Themes selector */}
            <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border-2 border-slate-200">
              <Palette className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
              {(["slate", "sunset", "mint", "cyberpunk", "light"] as SlideTheme[]).map((t) => {
                const colors = {
                  slate: "bg-indigo-650",
                  sunset: "bg-amber-500",
                  mint: "bg-emerald-500",
                  cyberpunk: "bg-purple-600",
                  light: "bg-slate-100 border-2 border-slate-300",
                };
                return (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    title={`Tema: ${t}`}
                    className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                      colors[t]
                    } ${theme === t ? "scale-125 ring-2 ring-indigo-650 ring-offset-2 ring-offset-white" : "hover:scale-110"}`}
                  />
                );
              })}
            </div>

            {/* material operations */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={handleCopyMaterial}
                className="p-2 bg-white hover:bg-slate-100 rounded-lg border-2 border-slate-200 text-slate-550 hover:text-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                title="Salin semua teks materi slide"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider hidden md:inline">Salin</span>
              </button>

              <button
                onClick={handleDownloadPPT}
                className="p-2 bg-white hover:bg-slate-100 rounded-lg border-2 border-slate-200 text-indigo-700 hover:text-indigo-900 transition-colors cursor-pointer flex items-center gap-1"
                title="Unduh file Microsoft PowerPoint asli (.pptx)"
              >
                <FileDown className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider hidden md:inline">PPTX</span>
              </button>

              <button
                onClick={handlePrintPDF}
                className="p-2 bg-white hover:bg-slate-100 rounded-lg border-2 border-slate-200 text-rose-700 hover:text-rose-900 transition-colors cursor-pointer flex items-center gap-1"
                title="Simpan sebagai dokumen PDF berkualitas tinggi (.pdf)"
              >
                <Printer className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider hidden md:inline">PDF</span>
              </button>

              <button
                onClick={handleDownloadHTML}
                className="p-2 bg-white hover:bg-slate-100 rounded-lg border-2 border-slate-200 text-emerald-700 hover:text-emerald-950 transition-colors cursor-pointer flex items-center gap-1"
                title="Unduh slide presentasi interaktif offline (.html)"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider hidden md:inline">Offline HTML</span>
              </button>
            </div>

            <button
              id="presentation-fullscreen-button"
              onClick={toggleFullscreen}
              className="p-2 px-3 bg-indigo-600 text-white border-2 border-slate-900 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-[2px_2px_0px_#000000] cursor-pointer hover:translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              <span>Presentasi</span>
            </button>
          </div>
        </div>

        {/* Actual Presentation View Canvas (16:9 Aspect fixed representation) */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] bg-white border-b-2 border-slate-200 flex flex-col justify-between overflow-hidden select-none">
          {renderSlidesPlayer(false)}
        </div>

        {/* Player Navigation controls */}
        <div className="bg-slate-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              id="slide-prev-button"
              onClick={handlePrev}
              disabled={currentSlideIndex === 0}
              className={`p-2 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${
                currentSlideIndex === 0
                  ? "bg-white text-slate-300 border-slate-100 cursor-not-allowed opacity-50"
                  : "bg-white hover:bg-slate-100 text-slate-800 border-slate-200 active:translate-y-0.5"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              id="slide-next-button"
              onClick={handleNext}
              disabled={currentSlideIndex === totalSlides - 1}
              className={`p-2 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${
                currentSlideIndex === totalSlides - 1
                  ? "bg-white text-slate-300 border-slate-100 cursor-not-allowed opacity-50"
                  : "bg-white hover:bg-slate-100 text-slate-800 border-slate-200 active:translate-y-0.5"
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
            Gunakan tombol panah untuk ganti slide
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay Presenter View */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-slate-100 p-4 md:p-8 flex flex-col justify-between overflow-hidden">
          {/* Floating dismiss controls */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-3 bg-white border-2 border-slate-900 p-2.5 rounded-xl shadow-md">
            <span className="text-xs font-black-display text-slate-800 px-2 tracking-tight">
              SLIDE {currentSlideIndex + 1} / {totalSlides}
            </span>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
              title="Keluar Layar Penuh"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Core Player Canvas strictly sized */}
          <div className="flex-1 max-w-5xl mx-auto w-full flex flex-col justify-center bg-white border-2 border-slate-300 rounded-3xl overflow-hidden shadow-2xl">
            {renderSlidesPlayer(true)}
          </div>

          {/* Fullscreen controls bar */}
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between p-4 bg-white border-2 border-slate-950 rounded-2xl mb-2 mt-4 shadow-md">
            <button
              onClick={handlePrev}
              disabled={currentSlideIndex === 0}
              className={`p-2.5 px-4 rounded-xl border-2 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 cursor-pointer transition-all select-none ${
                currentSlideIndex === 0
                  ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                  : "bg-white hover:bg-slate-105 text-slate-800 border-slate-200"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <span className="text-[10px] text-slate-405 font-bold uppercase tracking-widest">
              Kembali (ESC / TUTUP)
            </span>

            <button
              onClick={handleNext}
              disabled={currentSlideIndex === totalSlides - 1}
              className={`p-2.5 px-4 rounded-xl border-2 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 cursor-pointer transition-all select-none ${
                currentSlideIndex === totalSlides - 1
                  ? "bg-slate-50 text-slate-300 border-slate-150 cursor-not-allowed"
                  : "bg-indigo-600 text-white border-slate-900 shadow-[2px_2px_0px_#000000]"
              }`}
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* High-fidelity print-only PPT elements to back flawless PDF/Paper conversion */}
      <div id="printable-slides-deck" className="hidden">
        {slides.map((slide, sIdx) => (
          <div key={sIdx} className="print-slide-page">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", marginBottom: "20px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "900", color: "#4f46e5", textTransform: "uppercase" }}>
                {payload.title || "STUD-AI PRESENTATION"}
              </h4>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>
                Slide {sIdx + 1} / {totalSlides}
              </span>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#0f172a", marginBottom: "20px", letterSpacing: "-0.03em" }}>
                {slide.header}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {slide.bullets && slide.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                    <span style={{ width: "22px", height: "22px", borderRadius: "6px", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold", color: "#1e293b", marginTop: "4px", flexShrink: 0 }}>
                      {bIdx + 1}
                    </span>
                    <p style={{ fontSize: "16px", color: "#334155", margin: 0, fontWeight: "600", lineHeight: "1.5" }}>
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: "10px", fontSize: "10px", fontWeight: "bold", color: "#94a3b8" }}>
              <span>StudAI Presentation Tool</span>
              <span>Halaman {sIdx + 1}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
