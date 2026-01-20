import { cn } from "@/lib/utils";

const MOODS = [
  { id: 'happy', label: 'Happy', emoji: '😊', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'sad', label: 'Sad', emoji: '😢', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'calm', label: 'Calm', emoji: '😌', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'angry', label: 'Angry', emoji: '😠', color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'confused', label: 'Confused', emoji: '🤔', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'excited', label: 'Excited', emoji: '🤩', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'lonely', label: 'Lonely', emoji: '🥺', color: 'bg-gray-100 text-gray-700 border-gray-200' },
] as const;

export type MoodId = typeof MOODS[number]['id'];

interface MoodSelectorProps {
  selected?: string;
  onSelect: (mood: string) => void;
  className?: string;
}

export function MoodSelector({ selected, onSelect, className }: MoodSelectorProps) {
  return (
    <div className={cn("grid grid-cols-3 sm:grid-cols-4 gap-3", className)}>
      {MOODS.map((mood) => (
        <button
          key={mood.id}
          onClick={() => onSelect(mood.id)}
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200",
            selected === mood.id 
              ? cn(mood.color, "scale-105 shadow-md border-current") 
              : "bg-white border-transparent hover:border-gray-100 hover:bg-gray-50 text-gray-500"
          )}
        >
          <span className="text-2xl filter drop-shadow-sm">{mood.emoji}</span>
          <span className="text-xs font-bold">{mood.label}</span>
        </button>
      ))}
    </div>
  );
}

export function MoodBadge({ mood }: { mood: string }) {
  const moodConfig = MOODS.find(m => m.id === mood.toLowerCase()) || MOODS[0];
  return (
    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm", moodConfig.color)}>
      <span>{moodConfig.emoji}</span>
      <span className="capitalize">{moodConfig.label}</span>
    </div>
  );
}
