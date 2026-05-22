export type UserJenjang = "SD" | "SMP" | "SMA" | "Kuliah" | "Umum";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: {
    base64: string;
    mimeType: string;
  };
  timestamp: string;
  isVoice?: boolean;
}

// 1. Quiz Definition
export interface QuizOption {
  text: string;
  rationale: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  questionNumber: number;
  question: string;
  answerOptions: QuizOption[];
  hint: string;
}

export interface QuizPayload {
  type: "quiz";
  jenjang: string;
  jurusan: string;
  questions: QuizQuestion[];
}

// 2. PPT Slide Definition
export interface PPTSlide {
  slideNumber: number;
  header: string;
  bullets: string[];
}

export interface PPTPayload {
  type: "ppt";
  title: string;
  slides: PPTSlide[];
}

// 3. Excel Spreadsheet Definition
export interface ExcelPayload {
  type: "excel";
  tableName: string;
  headers: string[];
  rows: string[][];
}

// Universal parsed structure helper
export type ParsedPayload =
  | { type: "quiz"; data: QuizPayload }
  | { type: "ppt"; data: PPTPayload }
  | { type: "excel"; data: ExcelPayload };
