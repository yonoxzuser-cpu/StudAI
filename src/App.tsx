import React, { useState, useRef, useEffect } from "react";
import { Message, UserJenjang } from "./types";
import QuizViewer from "./components/QuizViewer";
import PPTViewer from "./components/PPTViewer";
import ExcelViewer from "./components/ExcelViewer";
import CameraModal from "./components/CameraModal";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  Send,
  Camera,
  Image as ImageIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Plus,
  Compass,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Paperclip,
  Trash2,
  Brain,
  MessageSquare,
  Wand2,
  Check,
  AlertCircle,
  HelpCircle,
  Clock,
  CheckCircle,
  ArrowUpRight
} from "lucide-react";

// Robust JSON extraction helper
function extractJSONPayload(text: string) {
  try {
    const startIdx = text.indexOf("{");
    const endIdx = text.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const potentialJSON = text.substring(startIdx, endIdx + 1);
      const parsed = JSON.parse(potentialJSON);
      if (parsed && typeof parsed === "object" && parsed.type) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore parse error
  }
  return null;
}

export default function App() {
  // Conversational states
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      content:
        "Hai! Aku **StudAI**, Super-App EdTech pintar asisten belajarmu. Aku dirancang khusus buat membantu pelajar SD, SMP, SMA, maupun Mahasiswa Kuliah.\n\nTanya aku materi apa saja, minta kuis latihan, buat slide presentasi (PPT), atau buat tabel data Excel. Kamu juga bisa kirim foto soal ataupun menggunakan fitur suara (suaraku bisa dibaca otomatis!). Mau coba apa hari ini? ✨",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  // Profile preferences
  const [selectedJenjang, setSelectedJenjang] = useState<UserJenjang>("SMP");

  // Multimodal file states
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI Modal control
  const [showCamera, setShowCamera] = useState(false);

  // Speech and Voice states
  const [voicePlaybackEnabled, setVoicePlaybackEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [isRecording, setIsRecording] = useState(false);

  // References and Web Speech APIs support check
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Setup Web Speech Recognition on component mount if available
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "id-ID";

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        if (resultText) {
          setInputText((prev) => (prev ? prev + " " + resultText : resultText));
        }
      };

      rec.onerror = (err: any) => {
        console.error("Speech recognition error:", err);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Terminate any active browser speech synthesis
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Speaks aloud Indonesian text cleanly, stripping raw JSON block out to avoid speaking raw code
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;

    stopSpeaking();

    // Clean text: strip any JSON brackets and contents to avoid speaking code
    let textToSpeak = text;
    const jsonStart = text.indexOf("{");
    if (jsonStart !== -1) {
      const introText = text.substring(0, jsonStart).trim();
      textToSpeak = introText || "Tabel atau data visualisasi telah dimuat di layar kamu.";
    }

    // Clean markdown characters out for smoother voice readings
    textToSpeak = textToSpeak
      .replace(/\*\*|__/g, "")
      .replace(/\*|_/g, "")
      .replace(/`[^`]*`/g, "")
      .trim();

    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "id-ID";
    utterance.rate = speechRate;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Toggle speech recording state
  const handleMicToggle = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        stopSpeaking();
        recognitionRef.current.start();
      } else {
        alert("Perekaman suara tidak didukung di browser ini. Gunakan Chrome atau browser yang kompatibel.");
      }
    }
  };

  // Core API submit agent call
  const handleSendMessage = async (textOverride?: string) => {
    const prompt = textOverride !== undefined ? textOverride : inputText;
    
    if (!prompt.trim() && !attachedImage) return;

    stopSpeaking();
    
    const userMsgId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    if (attachedImage) {
      userMessage.image = {
        base64: attachedImage.base64,
        mimeType: attachedImage.mimeType,
      };
    }

    setMessages((prev) => [...prev, userMessage]);
    
    // Clear draft states
    setInputText("");
    setAttachedImage(null);
    setImagePreview(null);
    setLoading(true);

    try {
      // Build conversation payload limits (last 10 messages for context)
      const chatHistory = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          history: chatHistory,
          image: userMessage.image,
          voiceMode: voicePlaybackEnabled,
        }),
      });

      const data = await res.json();

      if (res.ok && data.text) {
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.text,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, botMessage]);

        // Auto-read aloud if voice playback toggle is ON
        if (voicePlaybackEnabled) {
          setTimeout(() => {
            speakText(data.text);
          }, 300);
        }
      } else {
        throw new Error(data.error || "Gagal mendapatkan respon asisten.");
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `❌ **Uh oh! Terjadi kesalahan koneksi.**\n\nDetail: ${
          err.message || "Gagal menghubungi server asisten."
        }\n\nSilakan klik kirim ulang atau periksa jaringan kamu, ya!`,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Convert raw local files to base64 for Gemini multimodal pipeline
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        setAttachedImage({
          base64: base64String,
          mimeType: file.type,
        });
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCameraCapture = (base64: string, mimeType: string) => {
    setAttachedImage({ base64, mimeType });
    setImagePreview(`data:${mimeType};base64,${base64}`);
  };

  // High-fidelity study quick starts triggers modified with the Design HTML aesthetic
  const quickOptions = [
    {
      title: "Kuis Fotosintesis",
      subtitle: "LATIHAN KUIS",
      prompt: "Buatkan latihan soal atau kuis tentang materi Fotosintesis IPA SMP Kelas 8 pilihan ganda lengkap dengan rationale penjelasan dan hint.",
      icon: <Brain className="w-6 h-6 text-indigo-600 animate-pulse" />,
      color: "border-indigo-200 hover:border-indigo-600",
      accentBg: "bg-indigo-50",
      number: "01",
      jenjang: "SMP",
    },
    {
      title: "Slide Sejarah Sriwijaya",
      subtitle: "PRESENTASI SLIDE",
      prompt: "Buatkan materi presentasi atau PPT tentang Kerajaan Sriwijaya untuk pelajaran Sejarah SMA.",
      icon: <Compass className="w-6 h-6 text-amber-600" />,
      color: "border-amber-200 hover:border-amber-500",
      accentBg: "bg-amber-50",
      number: "02",
      jenjang: "SMA",
    },
    {
      title: "Data Nilai Rapor",
      subtitle: "TABEL DATA EXCEL",
      prompt: "Buatkan tabel data Excel berisi daftar nilai rapor siswa kelas 5 SD semester ganjil untuk mata pelajaran Matematika, IPA, dan Bahasa Indonesia.",
      icon: <BookOpen className="w-6 h-6 text-emerald-600" />,
      color: "border-emerald-200 hover:border-emerald-500",
      accentBg: "bg-emerald-50",
      number: "03",
      jenjang: "SD",
    },
    {
      title: "Simulasi Keuangan Anak Kos",
      subtitle: "PERENCANAAN MAHASISWA",
      prompt: "Buatkan tabel data perencanaan keuangan bulanan atau simulasi pengeluaran bulanan anak kuliah kos di kota besar dengan rincian biaya makan, buku, kos, dan transportasi.",
      icon: <GraduationCap className="w-6 h-6 text-violet-600" />,
      color: "border-violet-200 hover:border-violet-600",
      accentBg: "bg-violet-50",
      number: "04",
      jenjang: "Kuliah",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      
      {/* 1. Left Sidebar Navigation Container - Light theme, thick crisp borders */}
      <div className="w-full md:w-85 bg-white border-b md:border-b-0 md:border-r-2 border-slate-200 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Logo Brand Header - High contrast black display typography */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-md border-2 border-slate-900">
              S
            </div>
            <div>
              <h1 className="text-2xl font-black-display tracking-tighter text-slate-900 leading-none">
                StudAI
              </h1>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                Super EdTech
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          {/* Jenjang Selector widget - Redesigned to bold buttons styled with thin clear outlines */}
          <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3 shadow-sm">
            <label className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-extrabold flex items-center gap-1.5">
              <span>🎓</span> JENJANG BELAJAR
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["SD", "SMP", "SMA", "Kuliah"] as UserJenjang[]).map((j) => (
                <button
                  key={j}
                  onClick={() => {
                    setSelectedJenjang(j);
                    stopSpeaking();
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer border-2 ${
                    selectedJenjang === j
                      ? "bg-indigo-600 text-white border-slate-900 shadow-[2px_2px_0px_#000000] scale-102"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400"
                  }`}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

          {/* Assistant voice synthesis configurations - High contrast crisp cards */}
          <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-extrabold flex items-center gap-1.5">
                <span>🗣️</span> LIVE AUDIO VOICE
              </span>
              <span className="text-[9px] text-slate-400 font-bold font-mono">ID-ID TTS</span>
            </div>

            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl border-2 border-slate-200">
              <span className="text-xs text-slate-800 font-bold">Suara Otomatis</span>
              <button
                onClick={() => {
                  if (voicePlaybackEnabled) {
                    stopSpeaking();
                    setVoicePlaybackEnabled(false);
                  } else {
                    setVoicePlaybackEnabled(true);
                  }
                }}
                className={`py-1.5 px-3 rounded-lg text-[10px] font-black tracking-wider uppercase cursor-pointer border-2 transition-all flex items-center gap-1 ${
                  voicePlaybackEnabled
                    ? "bg-emerald-100 text-emerald-800 border-emerald-500"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                }`}
              >
                {voicePlaybackEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5" /> ON
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" /> OFF
                  </>
                )}
              </button>
            </div>

            {/* Read Speed rate */}
            {voicePlaybackEnabled && (
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex justify-between text-[10px] text-slate-500 font-mono font-bold">
                  <span>Kecepatan:</span>
                  <span className="text-indigo-600 font-bold">{speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Active Speech visualizer animation */}
            {isSpeaking && (
              <div className="flex items-center justify-center gap-2 py-2.5 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                <div className="text-[10px] text-indigo-700 font-mono font-bold animate-pulse uppercase tracking-wider">
                  Membaca Penjelasan...
                </div>
                {/* CSS Animated sound frequency bar */}
                <div className="flex items-end gap-0.5 h-4">
                  <div className="w-1 h-2 bg-indigo-650 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-1 h-3.5 bg-indigo-650 rounded-full animate-bounce [animation-delay:0.3s]"></div>
                  <div className="w-1 h-2.5 bg-indigo-650 rounded-full animate-bounce [animation-delay:0.15s]"></div>
                  <div className="w-1 h-4 bg-indigo-650 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Brand Credit */}
        <div className="hidden md:block space-y-2 mt-6">
          <div className="h-px bg-slate-200" />
          <div className="text-[10px] text-slate-400 font-mono font-bold">
            StudAI EdTech super-app v3.5 • Google Gemini-3.5-Flash
          </div>
        </div>
      </div>

      {/* 2. Main Chat Panel and Activity Visualizer */}
      <div className="flex-1 flex flex-col h-[calc(100vh-130px)] md:h-screen relative overflow-hidden bg-slate-50">
        
        {/* Responsive top status/metadata bar */}
        <div className="px-6 py-4 border-b-2 border-slate-200 bg-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-indigo-600 pulse-primary"></div>
            <span className="text-xs font-black-display tracking-tight text-slate-800 uppercase">
              STUDY BOARD • JENJANG {selectedJenjang}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 font-mono hidden md:inline">
              ONLINE & SYNCED
            </span>
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="px-3 py-1 bg-red-100 hover:bg-red-200 border-2 border-red-300 text-red-700 rounded-xl text-[10px] font-black tracking-wide uppercase cursor-pointer transition-all"
              >
                Hentikan Suara 🔇
              </button>
            )}
          </div>
        </div>

        {/* Conversational Screen Messages Viewport with automatic widgets extraction */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => {
            const isBot = message.role === "assistant";
            const processedJSON = isBot ? extractJSONPayload(message.content) : null;

            return (
              <div key={message.id} className={`flex flex-col ${isBot ? "items-start" : "items-end"} animate-fade-in`}>
                <div className="max-w-[92%] md:max-w-[85%] space-y-1.5">
                  
                  {/* Name tags */}
                  <span className="text-[10px] font-mono text-slate-450 font-bold px-1 select-none flex items-center gap-1.5">
                    {isBot ? "🤖 StudAI" : "👤 Kamu"} • {message.timestamp}
                  </span>

                  {/* Standard Message Bubble containing file attachments */}
                  <div
                    className={`rounded-2xl p-5 border-2 transition-all ${
                      isBot
                        ? "bg-white border-slate-200 text-slate-800 shadow-sm"
                        : "bg-indigo-600 border-slate-900 text-white shadow-[3px_3px_0px_#0f172a]"
                    }`}
                  >
                    {/* Multimodal Photo Attachment Preview if sent by user */}
                    {message.image && (
                      <div className="mb-3 max-w-[300px] rounded-xl overflow-hidden border-2 border-slate-300 shadow bg-slate-900">
                        <img
                          src={`data:${message.image.mimeType};base64,${message.image.base64}`}
                          alt="Soal Terlampir"
                          className="w-full h-auto object-contain max-h-[300px]"
                        />
                      </div>
                    )}

                    {/* Standard Text Markdown Body */}
                    <div className="prose max-w-none text-slate-800">
                      {processedJSON ? (
                        /* If JSON exists, we can trim the JSON payload out from text to output only the accompanying summary text */
                        <div className={`text-xs md:text-sm text-slate-700 leading-relaxed font-sans space-y-2`}>
                          <ReactMarkdown>
                            {message.content.substring(0, message.content.indexOf("{")).trim()}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className={`text-xs md:text-sm leading-relaxed space-y-2 ${!isBot ? 'text-white [&_strong]:text-white [&_a]:text-indigo-200' : 'text-slate-800 [&_strong]:text-slate-950 font-medium'}`}>
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* TTS Action speaker button triggers immediately */}
                    {isBot && !processedJSON && (
                      <div className="mt-4 pt-2.5 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => speakText(message.content)}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-extrabold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Volume2 className="w-3.5 h-3.5" /> dengerin penjelasan suaraku
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ⚡ ACTIVE RENDER INTERCEPT: Play interactive custom widgets immediately if JSON was detected */}
                  {processedJSON && (
                    <div className="w-full animate-fade-in">
                      {processedJSON.type === "quiz" && (
                        <QuizViewer payload={processedJSON} />
                      )}
                      {processedJSON.type === "ppt" && (
                        <PPTViewer payload={processedJSON} />
                      )}
                      {processedJSON.type === "excel" && (
                        <ExcelViewer payload={processedJSON} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* AI Generation Loader State block */}
          {loading && (
            <div className="flex flex-col items-start font-mono text-xs">
              <span className="text-[10px] text-indigo-600 font-bold px-1 mb-1.5 animate-pulse uppercase">
                ⚡ StudAI Sedang Menganalisis...
              </span>
              <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl flex items-center gap-3 shadow-md max-w-sm">
                <Brain className="w-5 h-5 text-indigo-600 animate-spin" />
                <span className="text-slate-700 font-bold text-xs">Menyusun jawaban & data visual spesial...</span>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Hero Dashboard block matching "Bold Typography" design */}
        {messages.length === 1 && (
          <div className="p-6 md:p-10 absolute top-[110px] bottom-[110px] left-0 right-0 z-10 flex flex-col justify-center max-w-4xl mx-auto space-y-6 overflow-y-auto select-none backdrop-blur-[1px]">
            
            {/* Bold Typography Design Hero Section */}
            <div className="relative bg-indigo-600 rounded-3xl p-8 md:p-10 text-white overflow-hidden flex flex-col justify-end min-h-[220px] md:min-h-[260px] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
              {/* Massive background floating watermarked text */}
              <div className="absolute top-[-25px] right-[-10px] text-[100px] md:text-[150px] font-black text-white/10 leading-none tracking-tighter select-none pointer-events-none font-display">
                LEARN
              </div>

              <span className="bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-4 border border-slate-900">
                🚀 EDTECH SUPER-APP
              </span>

              <h1 className="text-3xl md:text-5xl font-black-display leading-[0.9] tracking-tighter mb-4 text-white uppercase">
                BELAJAR LEBIH<br/>PINTAR SEKARANG.
              </h1>
              
              <p className="text-indigo-150 text-xs md:text-sm max-w-lg font-semibold leading-relaxed">
                Halo! Aku siap bantuin kamu belajar materi {selectedJenjang}, buat ringkasan presentasi PPT otomatis, latihan kuis pilihan ganda, atau susun tabel data laporan. Kamu juga bisa kirim foto soal ataupun ketik langsung!
              </p>
            </div>

            {/* Column cards matching the design widgets layout */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                  PILIH FITUR BELAJAR (KELAS {selectedJenjang}):
                </span>
                <span className="text-xs font-bold text-indigo-600">Terpilih: {selectedJenjang}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickOptions
                  .filter((opt) => opt.jenjang === selectedJenjang)
                  .map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputText(opt.prompt);
                        handleSendMessage(opt.prompt);
                      }}
                      className={`p-5 bg-white bg-white/10 border-2 rounded-2xl text-left transition-all hover:border-slate-900 active:translate-y-0.5 group cursor-pointer flex gap-4 items-center shadow-sm hover:shadow-[3px_3px_0px_#0f172a] ${opt.color}`}
                    >
                      <div className={`p-3.5 rounded-xl shrink-0 border border-slate-150 ${opt.accentBg} group-hover:scale-105 transition-transform`}>
                        {opt.icon}
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono">
                            {opt.subtitle}
                          </span>
                          <span className="text-xs font-black text-indigo-600 font-mono">{opt.number}</span>
                        </div>
                        <h4 className="text-sm font-black tracking-tight text-slate-900 truncate">
                          {opt.title}
                        </h4>
                        <p className="text-xs text-slate-550 truncate">
                          Klik untuk menanyakan otomatis materi ini
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Custom file analysis reminder banner */}
            <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs text-slate-600 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <Camera className="w-4 h-4 shrink-0" />
                </div>
                <span className="font-bold">Punya foto soal PR di buku? Scan memakai kamera device di bawah langsung!</span>
              </div>
              <span className="text-[9px] bg-slate-900 text-white font-black px-2 py-0.5 rounded-md uppercase shrink-0">
                MULTIMODAL
              </span>
            </div>
          </div>
        )}

        {/* 3. Core Input controls panel bar - Redesigned to thick crisp borders */}
        <div className="p-4 md:p-6 bg-white border-t-2 border-slate-200 flex flex-col gap-3">
          
          {/* File input attachment review thumbnail */}
          {imagePreview && (
            <div className="flex items-center gap-3 bg-indigo-50/50 p-2.5 rounded-xl border-2 border-indigo-200 max-w-sm animate-fade-in select-none">
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 border-slate-300 bg-black">
                <img src={imagePreview} alt="Foto lampiran" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900 truncate">Analisis Foto Soal</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Materi Multimodal</p>
                </div>
              </div>
              <button
                onClick={handleRemoveAttachment}
                className="p-1.5 bg-white hover:bg-rose-50 border-2 border-slate-200 hover:border-rose-400 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                title="Batalkan foto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Actual Chat form and controls */}
          <div className="flex items-center gap-2.5">
            
            {/* Camera / Upload buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* File upload hidden */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl transition-all cursor-pointer shadow-sm hover:border-slate-400 active:scale-95"
                title="Pilih file foto dari device"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowCamera(true)}
                className="p-3 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-700 hover:text-amber-800 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                title="Ambil foto instan memakai kamera"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            {/* Core message text form */}
            <div className="flex-1 relative">
              <input
                id="chat-text-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={
                  isRecording 
                    ? "Mendengarkan suaramu dengan cerdas..." 
                    : `Kirim atau tanya materi belajar ${selectedJenjang} di sini...`
                }
                disabled={loading || isRecording}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl focus:border-indigo-600 focus:bg-white focus:outline-none transition-colors text-sm font-semibold placeholder:text-slate-400"
              />
              
              {/* Mic transcription button */}
              <button
                onClick={handleMicToggle}
                disabled={loading}
                className={`absolute right-2.5 top-1.5 p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse shadow-md border border-red-600"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }`}
                title={isRecording ? "Hentikan perekaman" : "Tulis dengan suara"}
              >
                {isRecording ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
              </button>
            </div>

            {/* Send submit button */}
            <button
              id="send-chat-button"
              onClick={() => handleSendMessage()}
              disabled={loading || (!inputText.trim() && !attachedImage)}
              className={`p-3 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer border-2 ${
                inputText.trim() || attachedImage
                  ? "bg-indigo-600 text-white border-slate-900 shadow-[2px_2px_0px_#000000] hover:translate-y-0.5"
                  : "bg-slate-150 text-slate-400 border-slate-205 cursor-not-allowed"
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Footer Status Bar matches design exactly */}
        <footer className="bg-white px-6 py-3 border-t-2 border-slate-200 flex justify-between items-center text-[9px] md:text-xs select-none">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span className="font-bold uppercase tracking-widest text-slate-500 font-mono">AI SYSTEM ONLINE</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
              <span className="font-bold uppercase tracking-widest text-slate-500 font-mono">SYNCING LIBRARY</span>
            </div>
          </div>
          <p className="font-bold uppercase tracking-widest text-indigo-600/80 italic">"Belajar seru, masa depan cerah bersama StudAI"</p>
        </footer>
      </div>

      {/* 3. Camera Snapshot Overlay Modal */}
      {showCamera && (
        <CameraModal
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
