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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [joinSuccessToast, setJoinSuccessToast] = useState<string | null>(null);

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
        const userSyncCode = `USER-${user.uid.substring(0, 8).toUpperCase()}`;
        setSyncCode(userSyncCode);
        setActiveSyncCode(userSyncCode);
        onSyncCodeChanged(userSyncCode);
      }
    });

    const unsub = onAuthChange((user) => {
      setCurrentUser(user);
      if (user) {
        const userSyncCode = `USER-${user.uid.substring(0, 8).toUpperCase()}`;
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
    try {
      const user = await loginWithGoogle();
      if (user) {
        setCurrentUser(user);
        const userSyncCode = `USER-${user.uid.substring(0, 8).toUpperCase()}`;
        setSyncCode(userSyncCode);
        setActiveSyncCode(userSyncCode);
        onSyncCodeChanged(userSyncCode);
      }
    } catch (err) {
      alert('Google login was cancelled or encountered an error.');
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setCurrentUser(null);
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

              {/* Active Sync Code Card */}
              <div className="bg-[#111315] border border-[#2a2e37] rounded-xl p-4 sm:p-5 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                      Your Device Sync Code
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-widest bg-[#181a20] px-3.5 py-1 rounded-lg border border-[#333842]">
                        {syncCode}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="px-3 py-2 bg-[#22252a] hover:bg-[#2a2e37] text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-[#333842] flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerateNewCode}
                      className="text-xs text-slate-400 hover:text-slate-200 underline font-mono"
                    >
                      Generate New Code
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-3">
                  Enter this code on your phone, tablet, or another laptop to instantly mirror and sync your habits.
                </p>

                {/* Status Bar */}
                <div className="mt-4 pt-3 border-t border-[#22252a] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-ping' : hasConfig ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    <span>{isSyncing ? 'Syncing to cloud...' : hasConfig ? 'Real-time sync active' : 'Local storage only'}</span>
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

              {/* Connect to Another Device */}
              <div className="bg-[#111315] border border-[#2a2e37] rounded-xl p-4 sm:p-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <Smartphone size={16} className="text-sky-400" />
                  <span>Pair with another device</span>
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  Have a sync code already displayed on your phone or computer? Enter it below:
                </p>

                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HABIT-9X42"
                    maxLength={14}
                    className="flex-1 bg-[#181a20] border border-[#333842] rounded-lg px-3 py-2 text-xs font-mono uppercase text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleConnectInputCode}
                    disabled={!inputCode.trim()}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <span>Connect</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              {/* Google Sign In (Optional) */}
              {hasConfig && (
                <div className="bg-[#111315] border border-[#2a2e37] rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                      G
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {currentUser ? `Signed in as ${currentUser.email || currentUser.displayName}` : 'Optional: Sign in with Google'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {currentUser ? 'Your tracker is tied to your Google account across any device' : 'Link your account so you don’t need to remember a code'}
                      </p>
                    </div>
                  </div>

                  {currentUser ? (
                    <button
                      onClick={handleGoogleLogout}
                      className="px-3 py-1.5 bg-[#22252a] hover:bg-[#2a2e37] text-rose-300 text-xs rounded-lg border border-[#333842] flex items-center gap-1"
                    >
                      <LogOut size={13} />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleGoogleLogin}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <LogIn size={13} />
                      <span>Sign In</span>
                    </button>
                  )}
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
