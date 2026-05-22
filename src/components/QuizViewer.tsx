import React, { useState } from "react";
import { QuizPayload, QuizQuestion } from "../types";
import { Award, CheckCircle, XCircle, Lightbulb, Sparkles, RefreshCw, ArrowRight } from "lucide-react";

interface QuizViewerProps {
  payload: QuizPayload;
}

export default function QuizViewer({ payload }: QuizViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const questions: QuizQuestion[] = payload.questions || [];
  const currentQuestion = questions[currentIndex];

  if (questions.length === 0) {
    return (
      <div className="p-6 bg-white border-2 border-slate-200 rounded-2xl text-center shadow-sm">
        <p className="text-slate-500 font-bold">Tidak ada soal kuis yang tersedia.</p>
      </div>
    );
  }

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (currentQuestion.answerOptions[index].isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setShowHint(false);
    setSelectedOption(null);
    setIsAnswered(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResult(false);
    setShowHint(false);
  };

  const scorePercentage = Math.round((score / questions.length) * 100);

  const getFeedbackMessage = () => {
    if (scorePercentage === 100) return { title: "LUAR BIASA! 🌟", msg: "Kamu menguasai materi ini dengan sempurna! Teruskan prestasi hebatmu!" };
    if (scorePercentage >= 80) return { title: "Keren Banget! 🚀", msg: "Sangat bagus, kamu sudah paham sebagian besar konsep. Sedikit lagi sempurna!" };
    if (scorePercentage >= 50) return { title: "Bagus! Semangat Hebat! 👍", msg: "Usaha yang bagus! Pelajari lagi penjelasan (rationale) tadi biar makin melesat!" };
    return { title: "Jangan Menyerah! 💪", msg: "Belajar adalah proses! Coba baca penjelasan materi lagi dan ulangi kuis ini, ya!" };
  };

  const feedback = getFeedbackMessage();

  return (
    <div className="bg-white border-2 border-slate-200 shadow-md rounded-3xl overflow-hidden max-w-full my-4">
      {/* Title Header */}
      <div className="bg-slate-50 p-5 border-b-2 border-slate-200 flex items-center justify-between">
        <div>
          <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-slate-900 mr-2">
            KUIS: {payload.jenjang || "EDTECH"}
          </span>
          <span className="text-slate-700 text-xs font-black-display tracking-tight uppercase">{payload.jurusan}</span>
        </div>
        <div className="text-slate-500 text-xs font-mono font-bold uppercase tracking-wider">
          Skor: <span className="text-indigo-650 font-black">{score}/{questions.length}</span>
        </div>
      </div>

      {!showResult ? (
        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>Pertanyaan {currentIndex + 1} dari {questions.length}</span>
              <span>{Math.round(((currentIndex + 1) / questions.length) * 105)}% Selesai</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question Text with Space Grotesk Bold */}
          <div className="mb-6">
            <h3 className="text-lg md:text-xl font-black-display text-slate-900 leading-snug tracking-tight">
              {currentQuestion.question}
            </h3>
          </div>

          {/* Answer Options Grid */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            {currentQuestion.answerOptions.map((option, idx) => {
              const alphabet = ["A", "B", "C", "D", "E"][idx] || "";
              
              // Selected correct option styling
              let buttonStyle = "bg-white border-2 border-slate-200 hover:border-slate-400 text-slate-800";
              let badgeStyle = "bg-slate-50 text-slate-700 border-2 border-slate-200 font-black-display";

              if (isAnswered) {
                if (option.isCorrect) {
                  buttonStyle = "bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold shadow-[2px_2px_0px_rgba(16,185,129,0.2)]";
                  if (selectedOption === idx) {
                    badgeStyle = "bg-emerald-500 text-white font-black border-2 border-emerald-600";
                  } else {
                    badgeStyle = "bg-emerald-100 text-emerald-800 border-2 border-emerald-300";
                  }
                } else if (selectedOption === idx) {
                  buttonStyle = "bg-red-50 border-2 border-red-400 text-red-950";
                  badgeStyle = "bg-red-500 text-white font-black border-2 border-red-600";
                } else {
                  buttonStyle = "bg-slate-50/50 border-slate-200 text-slate-400 opacity-60";
                  badgeStyle = "bg-slate-100 text-slate-400 border border-slate-200";
                }
              }

              return (
                <button
                  key={idx}
                  id={`quiz-option-${currentIndex}-${idx}`}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={isAnswered}
                  className={`w-full text-left p-4 rounded-xl border flex items-center justify-between gap-4 transition-all duration-200 group ${buttonStyle} cursor-pointer`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 transition-colors ${badgeStyle}`}>
                      {alphabet}
                    </span>
                    <span className="text-sm md:text-base font-semibold">{option.text}</span>
                  </div>
                  <div className="shrink-0">
                    {isAnswered && option.isCorrect && (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    )}
                    {isAnswered && !option.isCorrect && selectedOption === idx && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation Box (Rationale) & Hint */}
          <div className="space-y-4">
            {/* Hint Box (Collapsible) */}
            {currentQuestion.hint && !isAnswered && (
              <div className="rounded-xl border-2 border-indigo-150 bg-indigo-50/60 px-4 py-3">
                <button 
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-2 text-indigo-700 text-xs font-black uppercase tracking-wider hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  <Lightbulb className="w-4 h-4" />
                  {showHint ? "Sembunyikan Petunjuk" : "Butuh Petunjuk? 💡"}
                </button>
                {showHint && (
                  <p className="mt-2 text-sm text-indigo-950 leading-relaxed font-semibold italic">
                    {currentQuestion.hint}
                  </p>
                )}
              </div>
            )}

            {/* Rationale Explanation Box */}
            {isAnswered && (
              <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 animate-fade-in">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider mb-2">
                  {currentQuestion.answerOptions[selectedOption || 0].isCorrect ? (
                    <span className="text-emerald-700 font-extrabold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> JAWABAN KAMU BENAR!
                    </span>
                  ) : (
                    <span className="text-red-700 font-extrabold flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> JAWABAN KURANG TEPAT
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-semibold">
                  <strong className="text-slate-900 font-black">Penjelasan: </strong>
                  {currentQuestion.answerOptions[selectedOption || 0].rationale || "Ulasan jawaban otomatis."}
                </p>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="mt-6 flex justify-end">
            <button
              id="quiz-next-button"
              onClick={handleNext}
              disabled={!isAnswered}
              className={`px-5 py-3 rounded-xl flex items-center gap-2 font-black uppercase tracking-wider text-xs transition-all border-2 cursor-pointer ${
                isAnswered
                  ? "bg-indigo-650 text-white border-slate-900 shadow-[2px_2px_0px_#000000] active:translate-y-0.5"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              }`}
            >
              <span>{currentIndex === questions.length - 1 ? "Selesaikan Kuis" : "Soal Berikutnya"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Result Scorecard Page */
        <div className="p-8 text-center bg-white border-t border-slate-150">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-50 border-2 border-indigo-200 rounded-full mb-4">
            <Award className="w-12 h-12 text-indigo-600 animate-pulse" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-black-display text-indigo-950 mb-2">
            {feedback.title}
          </h2>
          <p className="text-slate-600 text-sm md:text-base max-w-md mx-auto mb-6 font-semibold">
            {feedback.msg}
          </p>

          {/* Score Circle Display */}
          <div className="relative inline-flex items-center justify-center py-6 px-10 bg-slate-50 border-2 border-slate-200 rounded-2xl shadow-sm mb-6">
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-black tracking-tight text-indigo-650 font-display">
                  {scorePercentage}
                </span>
                <span className="text-xl text-slate-400 font-black font-display">/100</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Hasil Akhir</span>
              <span className="text-xs text-slate-600 font-bold mt-0.5">
                ({score} dari {questions.length} Benar)
              </span>
            </div>
            <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="quiz-retry-button"
              onClick={handleReset}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-550 border-2 border-slate-200 hover:border-slate-400 text-slate-800 font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-y-0.5"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>Ulangi Kuis</span>
            </button>
            <div className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
              StudAI • Teman Belajar Terpintarmu
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
