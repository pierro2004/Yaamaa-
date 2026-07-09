import React, { useState, useEffect, useRef } from "react";
import { 
  Phone, Video, Mic, MicOff, Camera, CameraOff, Volume2, VolumeX, 
  PhoneOff, Users, UserPlus, Shield, Share2, Disc, Hand, Smile, 
  MessageSquare, Sparkles, Clock, CheckCircle2, XCircle, AlertCircle, 
  ChevronDown, Globe, Settings, Eye, RefreshCw, Radio
} from "lucide-react";
import { User, CallRecord, CallType, CallParticipant, CallStatus } from "../types";

interface AudioVideoCallModalProps {
  currentUser: User;
  usersList: User[];
  activeCall: CallRecord | null;
  onClose: () => void;
  onInitiateCall: (targetUserId: string, type: CallType) => void;
  onEndCall: (callId: string) => void;
  onAcceptCall: (callId: string) => void;
  onHostAction: (callId: string, action: string, targetUserId?: string) => void;
  callHistory: CallRecord[];
  onRefreshCalls?: () => void;
}

export const AudioVideoCallModal: React.FC<AudioVideoCallModalProps> = ({
  currentUser,
  usersList,
  activeCall,
  onClose,
  onInitiateCall,
  onEndCall,
  onAcceptCall,
  onHostAction,
  callHistory,
  onRefreshCalls
}) => {
  const [tab, setTab] = useState<"active" | "dialer" | "history">("active");
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [callTypeToStart, setCallTypeToStart] = useState<CallType>("video_single");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [activeReactions, setActiveReactions] = useState<Array<{ id: number; emoji: string; x: number }>>([]);
  const [aiSubtitlesEnabled, setAiSubtitlesEnabled] = useState<boolean>(true);
  const [aiNoiseSuppression, setAiNoiseSuppression] = useState<boolean>(true);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [callDurationSeconds, setCallDurationSeconds] = useState<number>(0);

  // Timer for active call duration
  useEffect(() => {
    let timer: any = null;
    if (activeCall && activeCall.status === "answered") {
      timer = setInterval(() => {
        setCallDurationSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setCallDurationSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeCall]);

  const triggerReaction = (emoji: string) => {
    const newReaction = {
      id: Date.now() + Math.random(),
      emoji,
      x: Math.floor(Math.random() * 80) + 10 // percentage left
    };
    setActiveReactions(prev => [...prev, newReaction]);
    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 3000);
  };

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md p-2 sm:p-4 animate-fade-in font-sans">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh] max-h-[850px] text-white">
        
        {/* HEADER */}
        <div className="bg-gray-900/90 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Yaamaa Secure Comms
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Shield className="w-3 h-3" /> E2EE Propriétaire
                </span>
              </h2>
              <p className="text-xs text-gray-400">Appels vocaux et vidéo HD ultra-sécurisés sans tiers</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-gray-800/80 p-1 rounded-xl border border-gray-700/50">
              <button
                type="button"
                onClick={() => setTab("active")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${tab === "active" ? "bg-emerald-600 text-white shadow" : "text-gray-400 hover:text-white"}`}
              >
                Appel en cours {activeCall ? "🔴" : ""}
              </button>
              <button
                type="button"
                onClick={() => setTab("dialer")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${tab === "dialer" ? "bg-emerald-600 text-white shadow" : "text-gray-400 hover:text-white"}`}
              >
                Nouveau / Réunion
              </button>
              <button
                type="button"
                onClick={() => setTab("history")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${tab === "history" ? "bg-emerald-600 text-white shadow" : "text-gray-400 hover:text-white"}`}
              >
                Historique ({callHistory.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition"
              title="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* BODY CONTENT */}
        <div className="flex-1 overflow-y-auto relative flex flex-col bg-gray-950">

          {/* TAB 1: ACTIVE CALL */}
          {tab === "active" && (
            <div className="flex-1 flex flex-col relative overflow-hidden">
              {activeCall ? (
                <div className="flex-1 flex flex-col justify-between p-6 relative">
                  
                  {/* Floating floating floating reactions */}
                  <div className="absolute inset-x-0 bottom-24 pointer-events-none z-30 flex justify-center overflow-hidden h-32">
                    {activeReactions.map(r => (
                      <div 
                        key={r.id} 
                        className="absolute text-3xl animate-bounce transition-all duration-1000"
                        style={{ left: `${r.x}%`, bottom: '0px' }}
                      >
                        {r.emoji}
                      </div>
                    ))}
                  </div>

                  {/* TOP BAR IN CALL */}
                  <div className="flex items-center justify-between bg-gray-900/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-gray-800/80 z-20">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                      <div>
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                          {activeCall.type.includes("video") ? "Appel Vidéo HD" : "Appel Vocal HD"} ({activeCall.participants.length} participants)
                        </span>
                        <p className="text-sm font-mono font-black text-emerald-400">{formatDuration(callDurationSeconds)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isRecording && (
                        <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
                          <Disc className="w-3.5 h-3.5 text-rose-500" /> Enregistrement en cours
                        </span>
                      )}
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" /> Chiffré AES-256
                      </span>
                    </div>
                  </div>

                  {/* VIDEO / PARTICIPANTS GRID */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-4 items-center justify-center p-2">
                    {activeCall.participants.map((p, idx) => (
                      <div 
                        key={p.userId || idx} 
                        className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden relative shadow-xl flex flex-col items-center justify-center h-full min-h-[220px] group"
                      >
                        {activeCall.type.includes("video") && !p.isCameraOff ? (
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent flex items-center justify-center">
                            <img 
                              src={p.avatar} 
                              alt={p.name} 
                              className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition duration-500" 
                            />
                            <div className="absolute inset-0 bg-gray-950/20"></div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-6 space-y-3">
                            <div className="relative">
                              <img src={p.avatar} alt={p.name} className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500/50 shadow-2xl" />
                              {p.isSpeaking && (
                                <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping pointer-events-none"></span>
                              )}
                            </div>
                            <span className="text-sm font-bold text-white">{p.name}</span>
                          </div>
                        )}

                        {/* PARTICIPANT OVERLAY BADGES */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs bg-gray-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-800">
                          <span className="font-bold text-gray-200 truncate max-w-[120px]">
                            {p.name} {p.userId === currentUser.id ? "(Moi)" : ""}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {p.isHandRaised && <span title="Main levée">✋</span>}
                            {p.isMuted ? (
                              <MicOff className="w-3.5 h-3.5 text-rose-400" />
                            ) : (
                              <Mic className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI SUBTITLES BANNER */}
                  {aiSubtitlesEnabled && (
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-2 mx-auto max-w-xl text-center text-xs text-gray-300 italic mb-3 shadow-lg">
                      💬 <strong className="text-emerald-400 not-italic">IA Subtitles (Yaamaa Engine):</strong> "Conversation active chiffrée de bout en bout. Suppression active des bruits de fond activée."
                    </div>
                  )}

                  {/* CONTROLS BAR */}
                  <div className="bg-gray-900/90 border border-gray-800 p-4 rounded-2xl flex flex-wrap items-center justify-center gap-4 z-20 shadow-2xl">
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-3.5 rounded-2xl flex items-center justify-center transition cursor-pointer ${isMuted ? 'bg-rose-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                      title={isMuted ? "Activer le micro" : "Couper le micro"}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCameraOff(!isCameraOff)}
                      className={`p-3.5 rounded-2xl flex items-center justify-center transition cursor-pointer ${isCameraOff ? 'bg-rose-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                      title={isCameraOff ? "Activer la caméra" : "Couper la caméra"}
                    >
                      {isCameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setFacingMode(facingMode === "user" ? "environment" : "user")}
                      className="p-3.5 rounded-2xl bg-gray-800 hover:bg-gray-700 text-white transition cursor-pointer"
                      title="Basculer caméra avant/arrière"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                      className={`p-3.5 rounded-2xl flex items-center justify-center transition cursor-pointer ${!isSpeakerOn ? 'bg-amber-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                      title={isSpeakerOn ? "Haut-parleur actif" : "Écouteur actif"}
                    >
                      {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsScreenSharing(!isScreenSharing)}
                      className={`p-3.5 rounded-2xl flex items-center justify-center transition cursor-pointer ${isScreenSharing ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                      title="Partage d'écran"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsHandRaised(!isHandRaised)}
                      className={`p-3.5 rounded-2xl flex items-center justify-center transition cursor-pointer ${isHandRaised ? 'bg-amber-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                      title="Lever la main"
                    >
                      <Hand className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsRecording(!isRecording)}
                      className={`p-3.5 rounded-2xl flex items-center justify-center transition cursor-pointer ${isRecording ? 'bg-rose-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                      title="Enregistrer la réunion"
                    >
                      <Disc className="w-5 h-5" />
                    </button>

                    {/* Reactions dropdown */}
                    <div className="flex items-center gap-1 bg-gray-800 p-1.5 rounded-2xl border border-gray-700">
                      {["❤️", "👍", "👏", "🎉", "🔥"].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => triggerReaction(emoji)}
                          className="w-8 h-8 rounded-xl hover:bg-gray-700 flex items-center justify-center text-base transition cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => onEndCall(activeCall.id)}
                      className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition cursor-pointer"
                    >
                      <PhoneOff className="w-5 h-5" /> Quitter l'appel
                    </button>
                  </div>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                  <div className="w-24 h-24 rounded-3xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-600 shadow-inner">
                    <Phone className="w-10 h-10 animate-bounce" />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h3 className="text-lg font-bold text-white">Aucun appel ou réunion en cours</h3>
                    <p className="text-xs text-gray-400">
                      Lancez un nouvel appel individuel ou créez une réunion audio/vidéo de groupe chiffrée avec vos contacts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab("dialer")}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/25 transition cursor-pointer"
                  >
                    Démarrer un appel ou une réunion
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DIALER & START NEW CALL */}
          {tab === "dialer" && (
            <div className="flex-1 p-8 max-w-2xl mx-auto w-full space-y-6">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>📞</span> Lancer un Appel ou une Réunion Yaamaa
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Sélectionnez un contact ou créez une réunion de groupe avec chiffrement de bout en bout instantané.
                </p>
              </div>

              <div className="space-y-4 bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-xl">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-2">Type de communication</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { id: "video_single", label: "Vidéo Individuel", icon: Video },
                      { id: "audio_single", label: "Vocal Individuel", icon: Phone },
                      { id: "video_group", label: "Vidéo Groupe", icon: Users },
                      { id: "audio_group", label: "Vocal Groupe", icon: Users },
                      { id: "video_meeting", label: "Réunion Vidéo", icon: Globe },
                      { id: "audio_meeting", label: "Réunion Audio", icon: Volume2 },
                    ].map(item => {
                      const Icon = item.icon;
                      const isSel = callTypeToStart === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setCallTypeToStart(item.id as CallType)}
                          className={`p-3 rounded-2xl border text-left flex flex-col gap-2 transition cursor-pointer ${
                            isSel 
                              ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-md' 
                              : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          <Icon className="w-5 h-5 text-emerald-400" />
                          <span className="text-xs font-bold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-2">Destinataire ou Participant Principal</label>
                  <select
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-xs text-white font-medium"
                  >
                    <option value="">-- Choisir un contact Yaamaa --</option>
                    {usersList.filter(u => u.id !== currentUser.id).map(u => (
                      <option key={u.id} value={u.id}>
                        @{u.username} ({u.name}) - {u.country}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={!selectedTargetId}
                    onClick={() => {
                      if (selectedTargetId) {
                        onInitiateCall(selectedTargetId, callTypeToStart);
                        setTab("active");
                      }
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" /> Lancer l'Appel Sécurisé
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CALL HISTORY */}
          {tab === "history" && (
            <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>📜</span> Historique Complet des Appels & Réunions
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Consignez tous les appels vocaux, vidéo et réunions avec statuts et durées.</p>
                </div>
                {onRefreshCalls && (
                  <button
                    type="button"
                    onClick={onRefreshCalls}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-bold text-gray-300 flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Actualiser
                  </button>
                )}
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-800/80 border-b border-gray-700 text-gray-400 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-4">Type</th>
                      <th className="p-4">Initiateur / Participants</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4">Durée</th>
                      <th className="p-4">Date & Heure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {callHistory.map(rec => (
                      <tr key={rec.id} className="hover:bg-gray-800/40 transition">
                        <td className="p-4 flex items-center gap-2 font-bold text-white">
                          {rec.type.includes("video") ? <Video className="w-4 h-4 text-emerald-400" /> : <Phone className="w-4 h-4 text-teal-400" />}
                          <span className="capitalize">{rec.type.replace('_', ' ')}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <img src={rec.creatorAvatar} alt={rec.creatorName} className="w-7 h-7 rounded-full object-cover border" />
                            <div>
                              <span className="font-bold text-white">{rec.creatorName}</span>
                              <p className="text-[10px] text-gray-400">{rec.participants.length} participants</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            rec.status === "answered" || rec.status === "completed" 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : rec.status === "missed" 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-gray-300">
                          {rec.durationSeconds ? `${Math.floor(rec.durationSeconds / 60)}m ${rec.durationSeconds % 60}s` : "-"}
                        </td>
                        <td className="p-4 text-gray-400 font-mono text-[10px]">
                          {new Date(rec.startedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {callHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          Aucun historique d'appel enregistré.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
