import { format } from 'date-fns';
import { Play, Pause } from 'lucide-react';

interface TimeLapseSliderProps {
  minTime: number;
  maxTime: number;
  currentTime: number;
  onChange: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export function TimeLapseSlider({ minTime, maxTime, currentTime, onChange, isPlaying, onTogglePlay }: TimeLapseSliderProps) {
  // If no data bounds, don't render or disable
  const disabled = minTime === maxTime || isNaN(minTime) || isNaN(maxTime);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl z-[9999] px-4 pointer-events-auto">
      <div className="bg-elevated border border-subtle shadow-token-md rounded-lg p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-tertiary">
            <span>{disabled ? '-' : format(minTime, 'HH:mm')}</span>
            <span className="text-primary font-semibold bg-accent/10 text-accent px-3 py-1 rounded-md">
              {disabled ? 'Live' : format(currentTime, 'MMM d, HH:mm')}
            </span>
            <span>{disabled ? '-' : format(maxTime, 'HH:mm')}</span>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={onTogglePlay}
              disabled={disabled}
              className="w-10 h-10 shrink-0 rounded-md bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
            </button>
            <input
              type="range"
              min={minTime}
              max={maxTime}
              value={currentTime}
              onChange={(e) => onChange(Number(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-subtle rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
