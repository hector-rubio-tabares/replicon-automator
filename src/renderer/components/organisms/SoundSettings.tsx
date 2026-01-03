import React from 'react';
import { useSoundStore } from '@/stores/sound-store';
import { useTranslation } from '@/i18n';
interface SoundSettingsProps {
  className?: string;
}
export function SoundSettings({ className = '' }: SoundSettingsProps) {
  const { enabled, volume, setEnabled, setVolume, playSuccess, playError, playNotification } = useSoundStore();
  const { t } = useTranslation();
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };
  const testSound = (type: 'success' | 'error' | 'notification') => {
    switch (type) {
      case 'success':
        playSuccess();
        break;
      case 'error':
        playError();
        break;
      case 'notification':
        playNotification();
        break;
    }
  };
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {t('config.app.sound')}
        </label>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 
                      border-transparent transition-colors duration-200 ease-in-out focus:outline-none 
                      focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      ${enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full 
                        bg-white shadow ring-0 transition duration-200 ease-in-out
                        ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
      </div>
      {enabled && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-300">
                {t('common.volume')}
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer
                         accent-blue-600"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              {t('common.testSounds')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => testSound('success')}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-100 text-green-700 
                           hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 
                           dark:hover:bg-green-900/50 transition-colors"
              >
                ✓ {t('common.success')}
              </button>
              <button
                onClick={() => testSound('error')}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-100 text-red-700 
                           hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 
                           dark:hover:bg-red-900/50 transition-colors"
              >
                ✗ {t('common.error')}
              </button>
              <button
                onClick={() => testSound('notification')}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-100 text-blue-700 
                           hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 
                           dark:hover:bg-blue-900/50 transition-colors"
              >
                🔔 {t('common.notification')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export function SoundToggle({ className = '' }: { className?: string }) {
  const { enabled, toggleEnabled } = useSoundStore();
  const { t } = useTranslation();
  return (
    <button
      onClick={toggleEnabled}
      className={`p-2 rounded-lg transition-colors duration-200
                  ${enabled 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}
                  hover:bg-blue-200 dark:hover:bg-blue-900/50 ${className}`}
      title={enabled ? t('common.disableSounds') : t('common.enableSounds')}
    >
      {enabled ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}
