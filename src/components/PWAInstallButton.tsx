import React, { useState } from 'react';
import { Download, Share2, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'menu' | 'floating';
  onInstallStarted?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  onInstallStarted,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA on standalone window, suppress
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    onInstallStarted?.();
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // If neither Chromium prompt nor iOS, allow standard install info prompt
  if (!isInstallable && !isIOS && variant !== 'menu') {
    return null;
  }

  return (
    <>
      {variant === 'menu' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full text-left px-3.5 py-2.5 text-xs text-emerald-300 hover:bg-[#22252a] flex items-center justify-between transition-colors border-t border-[#2a2e37]/70"
        >
          <div className="flex items-center gap-2">
            <Smartphone size={14} className="text-emerald-400" />
            <span>Install App (Offline &amp; Fullscreen)</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
            PWA
          </span>
        </button>
      ) : variant === 'header' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          title="Install app to your home screen or desktop for 100% offline access"
          className="h-8 px-2.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 hover:text-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
        >
          <Download size={13} className="text-emerald-400 stroke-[2.5]" />
          <span className="hidden lg:inline">Install App</span>
          <span className="text-[9px] font-mono px-1 rounded bg-emerald-900/90 text-emerald-300 border border-emerald-600/50">
            Offline
          </span>
        </button>
      ) : null}

      {/* Guided iOS Safari Add to Home Screen Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="bg-[#181a20] border border-[#2a2e37] rounded-2xl p-5 max-w-sm w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Smartphone size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Install on iPhone / iPad</h3>
                <p className="text-[11px] text-slate-400">Use Habit Tracker 100% offline</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 bg-[#121316] p-3 rounded-xl border border-[#2a2e37]">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Tap the <strong className="text-white">Share</strong> button{' '}
                  <Share2 size={12} className="inline text-sky-400 mb-0.5" /> in Safari's bottom toolbar.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Scroll down and tap <strong className="text-emerald-400">Add to Home Screen</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Tap <strong className="text-white">Add</strong> in top right. You can now launch and use it offline anytime!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
