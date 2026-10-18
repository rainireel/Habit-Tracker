import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudCheck,
  CloudOff,
  Copy,
  Check,
  RefreshCw,
  Smartphone,
  Laptop,
  ArrowRight,
  ExternalLink,
  Key,
  ShieldCheck,
  HelpCircle,
  X,
  Sparkles,
  LogIn,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import {
  getStoredFirebaseConfig,
  saveStoredFirebaseConfig,
  getActiveSyncCode,
  setActiveSyncCode,
  generateRandomSyncCode,
  resetFirebaseInstances,
  initFirebase,
  uploadTrackerData,
  loginWithGoogle,
  logoutGoogle,
  onAuthChange,
  checkRedirectResult,
  FirebaseConfig,
} from '../services/firebase';
import { User } from 'firebase/auth';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
  currentUser?: User | null;
  onSyncCodeChanged: (newCode: string) => void;
  getCurrentTrackerData: () => any;
  onForcePullRemote: () => void;
  lastSyncedAt: Date | null;
  isSyncing: boolean;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  accentColor,
  currentUser: propUser,
  onSyncCodeChanged,
  getCurrentTrackerData,
  onForcePullRemote,
  lastSyncedAt,
  isSyncing,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'guide' | 'config'>('sync');
  const [syncCode, setSyncCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [hasConfig, setHasConfig] = useState<boolean>(false);
  const [rawConfigInput, setRawConfigInput] = useState<string>('');
  const [configError, setConfigError] = useState<string | null>(null);
  const [configSuccess, setConfigSuccess] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(propUser || null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [joinSuccessToast, setJoinSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (propUser !== undefined) {
      setCurrentUser(propUser);
    }
  }, [propUser]);

  useEffect(() => {
    if (isOpen) {
      const code = getActiveSyncCode();
      setSyncCode(code);
      const conf = getStoredFirebaseConfig();
      setHasConfig(!!conf);
      if (conf) {
        setRawConfigInput(JSON.stringify(conf, null, 2));
      }
    }
  }, [isOpen]);

  useEffect(() => {
    checkRedirectResult().then((user) => {
      if (user) {
        setCurrentUser(user);
        const userSyncCode = `GOOGLE-${user.uid}`;
        setSyncCode(userSyncCode);
        setActiveSyncCode(userSyncCode);
        onSyncCodeChanged(userSyncCode);
      }
    });

    const unsub = onAuthChange((user) => {
      setCurrentUser(user);
      if (user) {
        const userSyncCode = `GOOGLE-${user.uid}`;
        setSyncCode(userSyncCode);
        setActiveSyncCode(userSyncCode);
        onSyncCodeChanged(userSyncCode);
      }
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateNewCode = () => {
    const newCode = generateRandomSyncCode();
    setSyncCode(newCode);
    setActiveSyncCode(newCode);
    onSyncCodeChanged(newCode);
  };

  const handleConnectInputCode = () => {
    if (!inputCode.trim()) return;
    const cleanCode = inputCode.trim().toUpperCase();
    setSyncCode(cleanCode);
    setActiveSyncCode(cleanCode);
    onSyncCodeChanged(cleanCode);
    setInputCode('');
    setJoinSuccessToast(`Connected to ${cleanCode}! Syncing data...`);
    setTimeout(() => setJoinSuccessToast(null), 3000);
  };

  const handleParseAndSaveConfig = () => {
    setConfigError(null);
    setConfigSuccess(false);

    try {
      let configObj: Partial<FirebaseConfig> = {};
      const trimmed = rawConfigInput.trim();

      // Check if user pasted a JSON string or JS object snippet
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        configObj = JSON.parse(trimmed);
      } else {
        // Regex extract fields from JS object code snippet
        const apiKeyMatch = trimmed.match(/apiKey:\s*["']([^"']+)["']/);
        const authDomainMatch = trimmed.match(/authDomain:\s*["']([^"']+)["']/);
        const projectIdMatch = trimmed.match(/projectId:\s*["']([^"']+)["']/);
        const storageBucketMatch = trimmed.match(/storageBucket:\s*["']([^"']+)["']/);
        const messagingSenderIdMatch = trimmed.match(/messagingSenderId:\s*["']([^"']+)["']/);
        const appIdMatch = trimmed.match(/appId:\s*["']([^"']+)["']/);

        if (apiKeyMatch && projectIdMatch && appIdMatch) {
          configObj = {
            apiKey: apiKeyMatch[1],
            authDomain: authDomainMatch ? authDomainMatch[1] : `${projectIdMatch[1]}.firebaseapp.com`,
            projectId: projectIdMatch[1],
            storageBucket: storageBucketMatch ? storageBucketMatch[1] : undefined,
            messagingSenderId: messagingSenderIdMatch ? messagingSenderIdMatch[1] : undefined,
            appId: appIdMatch[1],
          };
        } else {
          throw new Error('Could not parse Firebase keys. Please ensure apiKey, projectId, and appId are present.');
        }
      }

      if (!configObj.apiKey || !configObj.projectId || !configObj.appId) {
        throw new Error('Missing required fields: apiKey, projectId, or appId.');
      }

      saveStoredFirebaseConfig(configObj as FirebaseConfig);
      resetFirebaseInstances();
      const instances = initFirebase();

      if (instances) {
        setHasConfig(true);
        setConfigSuccess(true);
        // Upload initial data right away
        uploadTrackerData(syncCode, getCurrentTrackerData());
        setTimeout(() => {
          setConfigSuccess(false);
          setActiveTab('sync');
        }, 1200);
      } else {
        throw new Error('Firebase initialized with errors. Please check the keys.');
      }
    } catch (err: any) {
      setConfigError(err.message || 'Invalid Firebase configuration format.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const user = await loginWithGoogle();
      if (user) {
        setCurrentUser(user);
        const userSyncCode = `GOOGLE-${user.uid}`;
        setSyncCode(userSyncCode);
        setActiveSyncCode(userSyncCode);
        onSyncCodeChanged(userSyncCode);
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setLoginError(err?.message || 'Google sign-in was cancelled or encountered an error.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    const newCode = generateRandomSyncCode();
    setSyncCode(newCode);
    setActiveSyncCode(newCode);
    onSyncCodeChanged(newCode);
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn select-none">
      <div className="bg-[#181a20] border border-[#333842] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#22252a] px-4 sm:px-6 py-3.5 border-b border-[#333842] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Cross-Device Cloud Sync</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  hasConfig
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border-amber-800'
                }`}>
                  {hasConfig ? 'Cloud Connected' : 'Setup Required'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sync habits in real-time between your phone, tablet, and computer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#2a2e37] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-[#2a2e37] bg-[#14161a] px-4 sm:px-6 pt-2">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sync'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone size={14} />
            <span>Sync Devices</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle size={14} />
            <span>2-Min Setup Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key size={14} />
            <span>Firebase Credentials</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar text-slate-200">
          {joinSuccessToast && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <Check size={16} />
              <span>{joinSuccessToast}</span>
            </div>
          )}

          {/* TAB 1: SYNC CODE & DEVICES */}
          {activeTab === 'sync' && (
            <div className="space-y-5">
              {!hasConfig && (
                <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-amber-300">Firebase project not linked yet</p>
                    <p className="text-slate-300">
                      To enable real-time sync across different networks, link your free Firebase project. Check out the <strong>2-Min Setup Guide</strong> tab!
                    </p>
                    <button
                      onClick={() => setActiveTab('guide')}
                      className="mt-1 text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>Open Setup Guide</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* PRIMARY: GOOGLE ACCOUNT ZERO-CODE SYNC */}
              {currentUser ? (
                <div className="bg-gradient-to-r from-emerald-950/70 via-[#13231b] to-[#111315] border border-emerald-500/50 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt="Google Avatar"
                          className="w-12 h-12 rounded-full border-2 border-emerald-400 object-cover shrink-0 shadow-md"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 font-bold flex items-center justify-center text-lg shrink-0">
                          {(currentUser.displayName || currentUser.email || 'G')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-500/40 mb-1">
                          <Check size={12} className="stroke-[3]" />
                          <span>Google Account Linked</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-white">
                          {currentUser.displayName || currentUser.email}
                        </h3>
                        <p className="text-xs text-slate-300 font-mono">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleGoogleLogout}
                      className="px-3.5 py-2 bg-[#22252a] hover:bg-[#2a2e37] text-rose-300 hover:text-rose-200 text-xs font-semibold rounded-xl border border-[#333842] flex items-center justify-center gap-1.5 transition-all self-start sm:self-center cursor-pointer active:scale-95"
                    >
                      <LogOut size={13} />
                      <span>Unlink Account</span>
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-emerald-500/20 text-xs text-emerald-200/90 flex items-start gap-2.5">
                    <Sparkles size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Zero-code sync is active!</strong> Open this app on your <strong>Tecno Camon 50 Pro</strong> or any other laptop/phone and sign in with this same Google account. All habits, streaks, and checkmarks will automatically link without needing to type any codes.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-emerald-950/40 via-[#181d24] to-[#14161b] border-2 border-emerald-500/50 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider border border-emerald-500/30">
                        <Sparkles size={12} />
                        <span>Recommended · No Codes Needed</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                        <span>Sign in with Google</span>
                      </h3>
                      <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                        Link your Google account to automatically connect your Mac and your Tecno Camon 50 Pro. All your habits mirror instantly without ever needing to copy or type a code!
                      </p>
                    </div>

                    <button
                      onClick={handleGoogleLogin}
                      disabled={isLoggingIn}
                      className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 shrink-0 disabled:opacity-60 cursor-pointer min-w-[200px]"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>{isLoggingIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
                    </button>
                  </div>

                  {loginError && (
                    <div className="mt-3.5 p-3 bg-rose-950/70 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0 text-rose-400" />
                      <span>{loginError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* SECONDARY: DEVICE SYNC CODE & STATUS */}
              <div className="bg-[#111315] border border-[#2a2e37] rounded-xl p-4 sm:p-5 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                        {currentUser ? 'Current Cloud Document ID' : 'Manual Device Sync Code'}
                      </span>
                      {currentUser && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                          Auto-Linked
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base sm:text-lg font-mono font-bold text-white tracking-wider bg-[#181a20] px-3 py-1 rounded-lg border border-[#333842] select-all max-w-full break-all">
                        {syncCode}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="px-3 py-2 bg-[#22252a] hover:bg-[#2a2e37] text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-[#333842] flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                      >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {!currentUser && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleGenerateNewCode}
                        className="text-xs text-slate-400 hover:text-slate-200 underline font-mono"
                      >
                        Generate New Code
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Bar */}
                <div className="mt-4 pt-3 border-t border-[#22252a] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-ping' : hasConfig ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    <span>{isSyncing ? 'Syncing to cloud...' : hasConfig ? 'Real-time cloud sync active' : 'Local storage only'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Last synced: <strong className="text-slate-200 font-mono">{formatLastSync(lastSyncedAt)}</strong></span>
                    {hasConfig && (
                      <button
                        onClick={onForcePullRemote}
                        title="Force sync now"
                        className="p-1 hover:text-emerald-400 transition-colors"
                      >
                        <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PAIR VIA MANUAL CODE (FOR GUEST USERS) */}
              {!currentUser && (
                <div className="bg-[#111315] border border-[#2a2e37] rounded-xl p-4 sm:p-5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <Smartphone size={16} className="text-sky-400" />
                    <span>Pair via manual sync code</span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    If not using Google, you can pair devices manually by entering the code shown on your other device:
                  </p>

                  <div className="flex items-center gap-2 max-w-md">
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      placeholder="e.g. HABIT-9X42"
                      maxLength={40}
                      className="flex-1 bg-[#181a20] border border-[#333842] rounded-lg px-3 py-2 text-xs font-mono uppercase text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={handleConnectInputCode}
                      disabled={!inputCode.trim()}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Connect</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 2-MINUTE SETUP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-emerald-400 text-sm">Free Firebase Setup (takes ~2 minutes)</h3>
                  <p className="text-slate-300">Firebase provides free real-time cloud database hosting forever on the Spark plan.</p>
                </div>
                <a
                  href="https://console.firebase.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>Open Firebase</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-[#111315] border border-[#2a2e37] rounded-xl flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono flex items-center justify-center shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-white mb-0.5">Create your free project</h4>
                    <p className="text-slate-400">
                      Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-emerald-400 underline">console.firebase.google.com</a>, log in with your Google account, and click <strong>Create a project</strong> (name it anything, e.g. "MyHabitTracker").
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#111315] border border-[#2a2e37] rounded-xl flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono flex items-center justify-center shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-white mb-0.5">Enable Firestore Database</h4>
                    <p className="text-slate-400">
                      In the left sidebar, click <strong>Build</strong> $\rightarrow$ <strong>Firestore Database</strong> $\rightarrow$ click <strong>Create database</strong>. Choose a location and select <strong>Start in test mode</strong> (or test rules), then click Enable.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#111315] border border-[#2a2e37] rounded-xl flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono flex items-center justify-center shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-white mb-0.5">Register Web App & Copy Keys</h4>
                    <p className="text-slate-400">
                      Click the Gear icon ⚙️ (Project settings) in the sidebar. Scroll down to <em>Your apps</em>, click the Web icon <code>&lt;/&gt;</code>, name it "Web", and click <strong>Register app</strong>. Copy the code snippet inside <code>const firebaseConfig = &#123; ... &#125;;</code>.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#111315] border border-[#2a2e37] rounded-xl flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono flex items-center justify-center shrink-0">4</div>
                  <div>
                    <h4 className="font-bold text-white mb-0.5">Paste & Connect!</h4>
                    <p className="text-slate-400 mb-2">
                      Go to the <strong>Firebase Credentials</strong> tab in this window, paste your snippet, and click <strong>Save & Connect</strong>. That’s it!
                    </p>
                    <button
                      onClick={() => setActiveTab('config')}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 text-xs"
                    >
                      <span>Go to Credentials Tab</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CREDENTIALS INPUT */}
          {activeTab === 'config' && (
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-white text-sm mb-1">Paste your Firebase Config</h3>
                <p className="text-slate-400">
                  You can paste the entire <code>const firebaseConfig = &#123; ... &#125;;</code> snippet directly from the Firebase console, or raw JSON:
                </p>
              </div>

              {configError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{configError}</span>
                </div>
              )}

              {configSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center gap-2">
                  <Check size={15} className="shrink-0" />
                  <span>Firebase successfully linked! Redirecting to sync...</span>
                </div>
              )}

              <textarea
                rows={8}
                value={rawConfigInput}
                onChange={(e) => setRawConfigInput(e.target.value)}
                placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "my-app.firebaseapp.com",\n  projectId: "my-app",\n  storageBucket: "my-app.appspot.com",\n  messagingSenderId: "123456789",\n  appId: "1:123456789:web:abcdef"\n};`}
                className="w-full bg-[#111315] border border-[#333842] rounded-xl p-3 font-mono text-xs text-emerald-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 custom-scrollbar"
              />

              <div className="flex items-center justify-between">
                {hasConfig ? (
                  <button
                    onClick={() => {
                      saveStoredFirebaseConfig(null);
                      resetFirebaseInstances();
                      setHasConfig(false);
                      setRawConfigInput('');
                    }}
                    className="text-rose-400 hover:text-rose-300 underline font-semibold"
                  >
                    Disconnect Firebase
                  </button>
                ) : <span />}

                <button
                  onClick={handleParseAndSaveConfig}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <ShieldCheck size={15} />
                  <span>Save & Connect Firebase</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
