import { useRandomRecording, useLikeRecording } from "@/hooks/use-recordings";
import { useUser } from "@/hooks/use-user";
import { Navigation } from "@/components/Navigation";
import { AudioPlayer } from "@/components/AudioPlayer";
import { MoodBadge } from "@/components/MoodSelector";
import { Heart, Shuffle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Discover() {
  const { data: recording, isLoading, refetch, isRefetching } = useRandomRecording();
  const { userId } = useUser();
  const likeMutation = useLikeRecording();

  const handleLike = () => {
    if (!userId || !recording) return;
    likeMutation.mutate({ id: recording.id, userId });
  };

  const handleNext = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 pb-32">
      <header className="px-6 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-foreground">Discover</h1>
      </header>

      <main className="max-w-md mx-auto px-6 pt-10 flex flex-col items-center gap-8">
        <AnimatePresence mode="wait">
          {isLoading || isRefetching ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[400px] w-full flex items-center justify-center"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </motion.div>
          ) : recording ? (
            <motion.div
              key={recording.id}
              initial={{ opacity: 0, x: 100, rotate: 5 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              exit={{ opacity: 0, x: -100, rotate: -5 }}
              className="w-full relative group"
            >
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full transform scale-90 translate-y-4 -z-10" />
              
              <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-white/50 backdrop-blur-sm flex flex-col items-center text-center gap-6">
                <div className="relative">
                  <img 
                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${recording.user?.avatarSeed}`} 
                    alt="Avatar"
                    className="w-32 h-32 rounded-[2rem] bg-secondary/30 p-2 shadow-inner"
                  />
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                    <MoodBadge mood={recording.mood} />
                  </div>
                </div>

                <div className="space-y-1 mt-2">
                  <h3 className="text-xl font-bold">Anonymous Voice</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(recording.createdAt).toLocaleDateString()} at {new Date(recording.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <AudioPlayer src={recording.audioUrl} autoPlay />
                </div>

                <div className="flex items-center gap-4 w-full pt-2">
                  <button 
                    onClick={handleLike}
                    className={cn(
                      "flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95",
                      recording.isLiked 
                        ? "bg-red-50 text-red-500 border border-red-100" 
                        : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-red-50 hover:text-red-400 hover:border-red-100"
                    )}
                  >
                    <Heart size={20} className={cn(recording.isLiked && "fill-current")} />
                    {recording.likesCount}
                  </button>
                  
                  <button 
                    onClick={handleNext}
                    className="flex-[2] py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Shuffle size={20} />
                    Next Voice
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No recordings found.</p>
              <button onClick={() => refetch()} className="mt-4 text-primary font-bold">Try again</button>
            </div>
          )}
        </AnimatePresence>
      </main>

      <Navigation />
    </div>
  );
}
