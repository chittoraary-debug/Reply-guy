import { useRecordings, useLikeRecording } from "@/hooks/use-recordings";
import { useUser } from "@/hooks/use-user";
import { Navigation } from "@/components/Navigation";
import { AudioPlayer } from "@/components/AudioPlayer";
import { MoodBadge } from "@/components/MoodSelector";
import { Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Home() {
  const { data: recordings, isLoading } = useRecordings({ sort: 'latest' });
  const { userId } = useUser();
  const likeMutation = useLikeRecording();

  const handleLike = (id: number) => {
    if (!userId) return;
    likeMutation.mutate({ id, userId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pb-32">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-white/20 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Voice Diary
        </h1>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent opacity-20" />
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        <div className="text-center py-4">
          <h2 className="text-3xl font-display font-bold text-foreground">
            Listen to the world 🌎
          </h2>
          <p className="text-muted-foreground mt-2">
            Anonymous voice notes from people everywhere.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Listening for voices...</p>
          </div>
        ) : recordings?.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-primary/20">
            <p className="text-lg font-medium text-foreground">It's quiet here...</p>
            <p className="text-muted-foreground mt-1">Be the first to say something!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {recordings?.map((recording, idx) => (
              <motion.div 
                key={recording.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[2rem] p-6 shadow-xl shadow-purple-900/5 border border-purple-100 hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${recording.user?.avatarSeed}`} 
                      alt="Avatar"
                      className="w-12 h-12 rounded-2xl bg-secondary/30 p-1"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">Anonymous</span>
                        <span className="text-xs text-muted-foreground">• {new Date(recording.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-1">
                        <MoodBadge mood={recording.mood} />
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleLike(recording.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all active:scale-95",
                      recording.isLiked 
                        ? "bg-red-50 text-red-500" 
                        : "bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-400"
                    )}
                  >
                    <Heart 
                      size={18} 
                      className={cn("transition-all", recording.isLiked && "fill-current scale-110")} 
                    />
                    <span className="text-xs font-bold">{recording.likesCount}</span>
                  </button>
                </div>

                <AudioPlayer src={recording.audioUrl} />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Navigation />
    </div>
  );
}
