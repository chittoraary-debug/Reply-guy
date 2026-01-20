import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Waveform } from "@/components/Waveform";
import { MoodSelector } from "@/components/MoodSelector";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useVoiceRecorder } from "@/replit_integrations/audio/useVoiceRecorder";
import { useUpload } from "@/hooks/use-upload";
import { useCreateRecording } from "@/hooks/use-recordings";
import { useUser } from "@/hooks/use-user";
import { Mic, StopCircle, RefreshCcw, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Step = "record" | "preview" | "mood" | "uploading";

export default function Record() {
  const [_, setLocation] = useLocation();
  const { user } = useUser();
  const { state: recordState, startRecording, stopRecording } = useVoiceRecorder();
  
  const [step, setStep] = useState<Step>("record");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [duration, setDuration] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout>();
  
  const { uploadFile, isUploading } = useUpload();
  const createRecordingMutation = useCreateRecording();

  useEffect(() => {
    if (recordState === "recording") {
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recordState]);

  const handleStartRecording = async () => {
    setDuration(0);
    await startRecording();
  };

  const handleStopRecording = async () => {
    const blob = await stopRecording();
    setAudioBlob(blob);
    setAudioUrl(URL.createObjectURL(blob));
    setStep("preview");
  };

  const handleReset = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setStep("record");
    setDuration(0);
    setSelectedMood("");
  };

  const handleSubmit = async () => {
    if (!audioBlob || !selectedMood || !user) return;
    
    setStep("uploading");
    
    try {
      // Create a File object from the blob
      const file = new File([audioBlob], `recording-${Date.now()}.webm`, { type: audioBlob.type });
      
      // Upload to object storage
      const uploadRes = await uploadFile(file);
      
      if (!uploadRes) throw new Error("Upload failed");
      
      // Create record in DB
      await createRecordingMutation.mutateAsync({
        userId: user.id,
        audioUrl: `/objects/${uploadRes.objectPath.split('/objects/')[1]}`, // Relative path for proxy
        duration: duration,
        mood: selectedMood,
      });

      setLocation("/");
    } catch (error) {
      console.error(error);
      setStep("preview"); // Go back on error
      alert("Something went wrong uploading your diary entry.");
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-32 flex flex-col">
      <header className="px-6 py-6 text-center">
        <h1 className="text-2xl font-bold font-display text-foreground">
          {step === "record" && "New Entry"}
          {step === "preview" && "Preview"}
          {step === "mood" && "How are you feeling?"}
          {step === "uploading" && "Saving..."}
        </h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-6 relative">
        <AnimatePresence mode="wait">
          {step === "record" && (
            <motion.div 
              key="record"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-8 w-full"
            >
              <div className="relative">
                {recordState === "recording" && (
                  <div className="absolute inset-0 rounded-full bg-red-400/20 animate-ping" />
                )}
                <button
                  onClick={recordState === "recording" ? handleStopRecording : handleStartRecording}
                  className={cn(
                    "w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 z-10 relative",
                    recordState === "recording" 
                      ? "bg-white text-red-500 hover:scale-105 border-4 border-red-50" 
                      : "bg-primary text-white hover:scale-105 hover:shadow-primary/40 active:scale-95"
                  )}
                >
                  {recordState === "recording" ? <StopCircle size={48} /> : <Mic size={48} />}
                </button>
              </div>

              <div className="text-center space-y-2">
                <div className="text-4xl font-mono font-bold text-foreground tabular-nums">
                  {formatTime(duration)}
                </div>
                <div className="h-8">
                  {recordState === "recording" ? (
                    <Waveform isRecording={true} />
                  ) : (
                    <p className="text-muted-foreground">Tap to record</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === "preview" && audioUrl && (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-8"
            >
              <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-purple-900/5 border border-purple-100">
                <AudioPlayer src={audioUrl} className="w-full" />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleReset}
                  className="flex-1 py-4 rounded-2xl bg-white border border-gray-200 text-foreground font-bold hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <RefreshCcw size={18} />
                  Retry
                </button>
                <button 
                  onClick={() => setStep("mood")}
                  className="flex-1 py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  Next
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === "mood" && (
            <motion.div 
              key="mood"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col gap-8 h-full"
            >
              <MoodSelector 
                selected={selectedMood} 
                onSelect={setSelectedMood} 
                className="flex-1"
              />

              <div className="flex gap-4 mt-auto">
                <button 
                  onClick={() => setStep("preview")}
                  className="flex-1 py-4 rounded-2xl bg-white border border-gray-200 text-foreground font-bold hover:bg-gray-50"
                >
                  Back
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={!selectedMood}
                  className="flex-[2] py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  Post Diary
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === "uploading" && (
            <motion.div 
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <p className="text-muted-foreground font-medium">Sending your voice to the cloud...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {step === "record" && <Navigation />}
    </div>
  );
}
