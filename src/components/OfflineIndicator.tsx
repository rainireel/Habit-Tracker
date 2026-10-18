import React, { useEffect, useState } from 'react';
import { CheckCircle2, Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, wasOffline, resetWasOffline } = useOnlineStatus();
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnectedToast(true);
      const timer = setTimeout(() => {
        setShowReconnectedToast(false);
        resetWasOffline();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, resetWasOffline]);

  return (
    <>
      {/* 1. Offline Mode Alert Banner (Sticky at bottom-right or bottom bar) */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 md:bottom-5 right-3 md:right-5 z-40 bg-[#181a20] border border-amber-500/60 rounded-xl p-3 shadow-2xl flex items-center gap-2.5 max-w-sm animate-fadeIn"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <WifiOff size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              <h4 className="text-xs font-bold text-white">Offline Mode Active</h4>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
              Your habits and changes are safely stored in local storage and work 100% offline.
            </p>
          </div>
        </div>
      )}

      {/* 2. Reconnected Notification Toast */}
      {showReconnectedToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 md:bottom-5 right-3 md:right-5 z-40 bg-[#16201b] border border-emerald-500/60 text-emerald-200 text-xs px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-2 animate-fadeIn"
        >
          <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Wifi size={14} />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-1">
              <span>Back Online</span>
              <CheckCircle2 size={12} className="text-emerald-400" />
            </div>
            <p className="text-[10px] text-emerald-300/90">All changes and progress are intact.</p>
          </div>
        </div>
      )}
    </>
  );
};
