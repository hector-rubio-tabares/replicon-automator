import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getTranslation } from '../i18n';
import { logCatch } from '../utils/logger';
const SOUNDS = {
  success: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JkI+GgHx6d3h7gYaJioiFf3t4eXuAhIiKiYZ/e3h4fICEiImIhX97eHl7gISIiYiFf3t4eXyAhIiJiIV/e3h5fICEiImIhX97eHl8gISIiYiFf3t4eXyAhIiJiIV/e3l5fICEiImIhX97eXl8gISIiYiFf3t5eXyAhIiJiIV/e3l5fICDiImIhYB7eXl8gIOIiYiFgHt5eXyAg4iJiIWAe3l5fICDiImIhYB7eXl8gIOIiYiFgHt5eXyAg4iJiIWAe3l5fICDh4mIhYB7eXp8gIOHiYiFgHt5enyAg4eJiIWAe3l6fICDh4mIhYB8eXp8gIOHiYiFgHx5enyAg4eJiIWAfHl6fICDh4mIhYB8eXp8gIOHiImFgHx5enyAg4eIiIWAfHl6fICDh4iIhYB8enp8gIOHiIiFgHx6enyAg4eIiIWAfHp6fICDh4iIhYB8enp8gIOHiIiFgHx6enyAg4eIiIWAfHp6fICDh4iIhYB8enp8gIOHiIiFgHx6enyAg4eIiIWAfHp7fICDh4iIhYB8ent8gIOHiIiFgHx6e3yAg4eIiIWAfHp7fICDh4iIhYB8ent8gIOHiIiFgHx6e3yAg4eIiIWAfHp7fICDh4iIhYB8ent8gIOHiIiFgHx6e3yAg4eIiIWAfHp7fICDh4iIhYB8ent8f4OHiIiFgHx6e3x/g4eIiIWAfHp7fH+Dh4iIhYB8ent8f4OHiIiFgHx6e3x/g4eHiIWAfHt7fH+Dh4eIhYB9e3t8f4OHh4iFgH17e3x/g4eHiIWAfXt7fH+Dh4eIhYB9e3t8f4OHh4iFgH17e3x/g4eHiIWAfXt7fH+Dh4eIhYB9e3t8f4OHh4iFgH17fHx/g4eHiIWAfXt8fH+Dh4eIhYB9e3x8f4OHh4iFgH17fHx/g4eHiIWAfXt8fH+Dh4eIhYB9e3x8f4OHh4eFgH17fHx/g4aHh4WAfXt8fH+DhoeHhYB9e3x8f4OGh4eFgH17fHx/g4aHh4WAfXx8fH+DhoeHhYB9fHx8f4OGh4eFgH18fHx/g4aHh4WAfXx8fH+DhoeHhYB9fHx8f4OGh4eFgH18fHx/g4aHh4WAfXx8fH+DhoeHhYB9fHx8f4OGh4eFgH18fHx/g4aHh4WAfXx8fH+DhoeHhYB9fH18f4OGh4eFgH18fXx/g4aGh4WAfXx9fH+DhoaHhYB9fH18f4OGhoeEgH18fXx/g4aGh4SAfXx9fH+DhoaHhIB9fH18f4OGhoeEgH18fXx/g4aGh4SAfXx9fH+DhoaHhIB9fH18f4OGhoeEgH18fXx/g4aGh4SAfXx9fH+DhoaHhIB9fH18f4OGhoeEgH18fXx/g4aGhoSAfX19fH+DhoaGhIB9fX18f4OGhoaEgH19fXx/g4aGhoSAfX19fH+DhoaGhIB9fX18f4OGhoaEgH19fXx/g4aGhoSAfX19fH+DhoaGhIB9fX18f4OGhoaEgH19fXx/g4aGhoSAfX19fH+DhoaGhIB9fX18f4OGhoaEgH19fXx/g4aGhoSAfX19fH+DhoaGhIB9fX18f4OGhoaEgH19fXx/g4aGhoSAfX19fH+DhoaGhIB9fX18f4OGhoaEgH19fX1/g4WGhoSAfX19fX+DhYaGhIB9fX19f4OFhoaEgH19fX1/g4WGhoSAfX19fX+DhYaGhIB9fX19f4OFhoaEgH19fX1/g4WGhoSAfX19fX+DhYaGhIB9fX19f4OFhoaEgH19fX1/g4WGhoSAfX19fX+DhYaGhIB9fX19f4OFhoaEgH19fX1/g4WFhoSAfX19fX+DhYWGhIB9fX19f4OFhYaEgH19fX1/g4WFhoSAfX19fX+DhYWGhIB9fX19f4OFhYaEgH19fX1/g4WFhoSAfX19fX+DhYWGhIB9fX19f4OFhYaEgH19fX1/g4WFhoSAfX19fX+DhYWGhIB9fX19f4OFhYWEgH1+fX1/g4WFhYSAfX59fX+DhYWFhIB9fn19f4OFhYWEgH1+fX1/g4WFhYSAfX59fX+DhYWFhIB9fn19f4OFhYWEgH1+fX1/g4WFhYSAfX59fX+DhYWFhIB9fn19f4OFhYWEgH1+fX1/g4WFhYSAfX59fX+DhYWFhIB9fn19f4OFhYWEgH1+fX1/g4WFhYSAfX59fX+DhYWFhIB9fn59f4OFhYWEgH1+fn1/g4WFhYSAfX5+fX+DhYWFhIB9fn59f4OFhYWEgH1+fn1/g4WFhYSAfX5+fX+DhYWFhIB9fn59f4OFhYWEgH1+fn1/g4WFhYSAfX5+fX+DhYWFhIB9fn59f4OFhYWEgH1+fn1/g4WFhYSAfX5+fX+DhYWFhIB9fn59f4OFhYWEgH1+fn1/g4SFhYSAfX5+fX+DhIWFhIB9fn59f4OEhYWEgH1+fn1/g4SFhYR/fX5+fX+DhIWFhH99fn59f4OEhYWEf31+fn1/g4SEhYR/fX5+fX+DhISFhH99fn59f4OEhISEf31+fn1/g4SEhIR/fX5+fX+DhISEhH99fn59f4OEhISEf31+fn5/g4SEhIR/fX5+fn+DhISEhH99fn5+f4OEhISEf31+fn5/g4SEhIR/fX5+fn+DhISEhH99fn5+f4OEhISEf35+fn5/g4SEhIR/fn5+fn+DhISEhH9+fn5+f4OEhISEf35+fn5/g4SEhIR/fn5+fn+DhISEhH9+fn5+f4OEhISEf35+fn5/g4SEhIR/fn5+fn+DhISEhH9+fn5+f4OEhISEf35+fn5/g4SEhISAfn5+fn9/g4SEhIB+fn5+f3+DhISEgH5+fn5/f4OEhISAfn5+fn9/g4SEhIB+fn5+f3+DhISEgH5+fn5/f4OEhISAfn5+fn9/g4OEhIB+fn5+f3+Dg4SEgH5+fn5/f4ODhISAfn5+fn9/g4ODhIB+fn5+f3+Dg4OEgH5+f35/f4ODg4SAfn5/fn9/g4ODg4R/fn5/fn9/g4ODg4R/fn5/fn9/g4ODg4R/fn5/fn9/g4ODg4R/fn5/fn9/g4ODg4R/fn5/fn9/g4ODg4R/fn5/fn9/g4ODg4R/fn9/fn9/g4ODg4R/fn9/fn9/g4ODg4R/fn9/fn9/g4ODg4N/fn9/fn9/g4ODg4N/fn9/fn9/g4ODg4N/',
  error: 'data:audio/wav;base64,UklGRl9EAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTtEAACBhYmMjoqGgn19fX6AgoWHiImJiIaCfnp3dnd5fICDhoeIiIeFgXx4dXR0dnh8gIOGh4iIh4R/e3d0c3N1eHyAg4aHiIiHhH97d3RzcnR3e3+Cg4aHh4eFgn56dnNycnR4e3+CgoWGh4eGg398eHVycnJ1eHt/goKFhoaGhYJ/e3h0cnJydXh7foGChIaGhoWCf3t4dXJxcnR3en6BgoSFhoaFgn98eXVycXF0dnh7foGCg4WFhYSDf3x5dnNxcXN2eXt+gIGDhIWFhIOAfXp3dHJxc3V4ent+gIGCg4SEg4GAfXp3dHJxc3R3eXt9f4GCg4ODg4F/fXp3dXNycnR2eHp8fn+BgoODg4KAf3x6d3VzcnJ0dnl6fH5/gIGCgoKBgH58enh2dHNzdHZ4ent9fn+AgYGBgYB/fXt6eHZ0c3N0dnh5e3x+f4CAgYGAgH9+fHt5d3V0c3R1d3l6fH1+f4CAgICAgH9+fXt6eHZ1dHR1d3h6e3x+fn+AgICAf39+fXx6eXd2dXR1dnd5ent8fX5/f4CAgH9/fn18e3p4d3Z1dXZ3eXp7fH1+f39/f39/f359fHt6eXh3dnZ2d3h5ent8fX5+f39/f39/fn59fHt6eXh3dnZ2d3h5ent7fH1+fn9/f39/fn5+fXx7enl4d3d2d3d4eXp7fHx9fn5+f39/f35+fn18fHt6eXh4d3d3eHl5ent8fH1+fn5+f39/fn5+fX18e3p5eXh3d3d4eHl6e3t8fX1+fn5+fn5+fn59fXx8e3p5eXh4d3h4eXl6e3t8fHx9fX5+fn5+fn59fX18fHt6enl5eHh4eHl5enp7e3x8fH19fX5+fn5+fn19fXx8e3t6enl5eHh4eXl5enp7e3x8fH19fX1+fn5+fn19fXx8fHt7enp5eXl5eXl6enp7e3x8fH19fX19fX5+fn19fXx8fHt7e3p6enl5eXl6enp6e3t8fHx8fX19fX19fX19fX18fHx8e3t7enp6enp6enp6ent7e3x8fHx9fX19fX19fX19fXx8fHx7e3t7e3p6enp6enp7e3t7fHx8fHx8fX19fX19fX19fHx8fHx7e3t7e3p6',
  notification: 'data:audio/wav;base64,UklGRl9EAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTtEAAB+gIOGiIqLioiFgn9+fn+AgoSGh4iIh4aDgH59fX5/gYOFhoiIh4aDgH59fH1+gIKEhoiIiIeFgn9+fH1+f4GDhYeIiIiGhIJ/fn19fn+Bg4WGiIiIhoSCf359fX5/gYOFh4iIiIaEgn9+fX1+f4GDhYeIiIiGhIJ/fn19fn+Bg4WHiIiIhoSCgH59fX5/gYOFh4eIiIaEgoB+fX19f4GDhYeHiIiGhIKAfn19fX+Bg4WHh4eHhoSCgH59fX1/gYOFh4eHh4aEgoB+fX19f4GDhYaHh4eGhIOAfn59fX+Bg4WGh4eHhoSDgH5+fX1/gYOFhoeHh4aEg4B+fn19f4CDhYaGh4eGhIOAfn5+fX+Ag4WGhoeHhoSDgH5+fn1/gIOFhoaHh4aEg4B/fn5+f4CDhIaGhoeGhIOAf35+fn+Ag4SFhoaGhoSDgH9+fn5/gIOEhYaGhoaEg4B/fn5+f4CDhIWFhoaGhIOBf35+fn+Ag4SFhYaGhoSDgX9+fn5/gIOEhYWGhoaEg4F/fn5+f4CDhIWFhYaGhIOBf39+fn+Ag4SFhYWGhoSDgX9/fn5/gIOEhYWFhoaEg4F/f35+f4CDhIWFhYWGhIOBgH9+fn+Ag4SFhYWGhoSDgYB/fn5/gIOEhYWFhoaEg4GAfn5+f4CDhIWFhYWGhIOBgH9+fn+Ag4SFhYWFhoSDgYB/fn5/gIKEhIWFhYaEg4GAf35+f4CChISFhYWFhIOBgH9+fn+AgoSDhYWFhYSDgYB/fn5/gIKDhIWFhYWEg4GAf35+f4CCg4SFhYWFhIOBgH9/fn+AgoOEhIWFhYSDgYB/f35/gIKDhISEhYWEg4GAf39+f4CCg4OEhISFhIOBgH9/fn+AgoODhISEhISDgYB/fn5/gIKDg4SEhISEg4GAgH9+f4CCg4OEhISEhIOBgIB/fn+AgoODhISEhISDgYCAfn5/gIKDg4OEhISEg4GAgH9/f4CCg4ODhISEhIOBgIB/f3+AgoODhISEhISDgYCAfn9/gIKCg4OEhISEg4GAgH9/f4CCgoODhISEhIOBgIB/f3+AgoKDg4SEhISDgYCAfn9/gIKCg4ODhIR/',
};
export type SoundType = 'success' | 'error' | 'notification';
interface SoundState {
  enabled: boolean;
  volume: number;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  setVolume: (volume: number) => void;
  play: (type: SoundType) => Promise<void>;
  playSuccess: () => Promise<void>;
  playError: () => Promise<void>;
  playNotification: () => Promise<void>;
}
export const useSoundStore = create<SoundState>()(
  persist(
    (set, get) => ({
      enabled: true,
      volume: 0.5,
      setEnabled: (enabled: boolean) => set({ enabled }),
      toggleEnabled: () => set((state) => ({ enabled: !state.enabled })),
      setVolume: (volume: number) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      play: async (type: SoundType) => {
        const { enabled, volume } = get();
        if (!enabled) return;
        try {
          const audio = new Audio(SOUNDS[type]);
          audio.volume = volume;
          await audio.play();
        } catch (error) {
          logCatch('SoundStore', getTranslation('errors.playingSound'), error);
        }
      },
      playSuccess: () => get().play('success'),
      playError: () => get().play('error'),
      playNotification: () => get().play('notification'),
    }),
    {
      name: 'replicon-sound',
      partialize: (state) => ({ enabled: state.enabled, volume: state.volume }),
    }
  )
);
