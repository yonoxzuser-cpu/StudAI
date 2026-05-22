import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, X, Check, AlertTriangle } from "lucide-react";

interface CameraModalProps {
  onCapture: (base64: string, mimeType: string) => void;
  onClose: () => void;
}

export default function CameraModal({ onCapture, onClose }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setErrorMsg("");
    setCapturedPhoto(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // prefer rear camera on mobile
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("video.play() was interrupted or prevented:", err);
          });
        }
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setErrorMsg(
        "Gagal mengakses kamera. Pastikan izin kamera diaktifkan di browser kamu."
      );
    }
  };

  const stopCamera = () => {
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (err) {
        // Already paused or inactive
      }
      videoRef.current.srcObject = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (err) {
          // Track already stopped
        }
      });
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/png");
        setCapturedPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    startCamera();
  };

  const handleAccept = () => {
    if (capturedPhoto) {
      // Split header (data:image/png;base64,) from actual base64 bytes
      const parts = capturedPhoto.split(",");
      const base64Content = parts[1];
      const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
      onCapture(base64Content, mime);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-400">
            <Camera className="w-5 h-5" />
            <span className="font-bold font-display text-sm">Ambil Foto Soal</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Feed or Captured Photo */}
        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center max-w-xs space-y-3">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="text-xs text-slate-305 leading-relaxed">{errorMsg}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : capturedPhoto ? (
            <img
              src={capturedPhoto}
              alt="Hasil tangkapan"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                    <span className="text-xs text-slate-400">Menghubungkan kamera...</span>
                  </div>
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-850 flex items-center justify-center gap-4">
          {capturedPhoto ? (
            <>
              <button
                onClick={handleRetake}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-slate-400" />
                <span>Ulangi</span>
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:translate-y-0.5"
              >
                <Check className="w-4 h-4" />
                <span>Gunakan Foto</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleCapture}
              disabled={!isCameraActive || !!errorMsg}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isCameraActive && !errorMsg
                  ? "bg-rose-600 hover:bg-rose-500 text-white pulse-primary scale-105 active:scale-95 cursor-pointer"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }`}
              title="Tangkap sekarang"
            >
              <Camera className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
