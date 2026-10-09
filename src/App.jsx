import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  collection, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Play, Pause, Mic, MicOff, Users, Video, 
  MessageSquare, Send, Copy, LogOut, Loader2 
} from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyCtVjPMSuedoCFFegxsIXt23fvzt-4IbVE",
  authDomain: "watch-party-4a3fc.firebaseapp.com",
  projectId: "watch-party-4a3fc",
  storageBucket: "watch-party-4a3fc.firebasestorage.app",
  messagingSenderId: "218392439743",
  appId: "1:218392439743:web:608539d2a792a0f3518f0a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'watchparty-default';

const ROOMS_COL = 'watchparty_rooms';
const PARTICIPANTS_COL = 'participants';
const MESSAGES_COL = 'messages';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing');
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Auth Error:", err));
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleCreateRoom = async () => {
    if (!userName.trim()) return setError('Please enter your name');
    if (!user) return setError('Connecting to server...');
    
    const newRoomId = generateRoomId();
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', ROOMS_COL, newRoomId);
    
    await setDoc(roomRef, {
      hostId: user.uid,
      videoUrl: '',
      videoState: { isPlaying: false, currentTime: 0, updatedAt: Date.now() },
      createdAt: serverTimestamp()
    });

    setRoomId(newRoomId);
    setView('room');
  };

  const handleJoinRoom = async () => {
    if (!userName.trim()) return setError('Please enter your name');
    if (!roomId.trim()) return setError('Please enter a Room ID');
    if (!user) return setError('Connecting to server...');

    const cleanRoomId = roomId.toUpperCase().trim();
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', ROOMS_COL, cleanRoomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) return setError('Room not found');

    setRoomId(cleanRoomId);
    setView('room');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-neutral-400">Initializing WatchParty...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      {view === 'landing' ? (
        <Landing 
          userName={userName} setUserName={setUserName}
          roomId={roomId} setRoomId={setRoomId}
          onCreate={handleCreateRoom} onJoin={handleJoinRoom}
          error={error}
        />
      ) : (
        <Room 
          roomId={roomId} user={user} userName={userName} 
          onLeave={() => { setView('landing'); setRoomId(''); setError(''); }} 
        />
      )}
    </div>
  );
}

function Landing({ userName, setUserName, roomId, setRoomId, onCreate, onJoin, error }) {
  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col justify-center px-6 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
          <Video className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">WatchParty</h1>
        <p className="text-neutral-400 text-sm mt-1">Sync videos & chat with friends instantly</p>
      </div>

      <div className="space-y-5 bg-neutral-900/60 p-6 rounded-3xl border border-neutral-800 shadow-2xl backdrop-blur-xl">
        {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-400 text-xs border border-red-500/20">{error}</div>}
        
        <div>
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Your Name</label>
          <input 
            type="text" 
            value={userName} 
            onChange={e => setUserName(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="e.g. Daniel"
          />
        </div>

        <button 
          onClick={onCreate}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-4 py-3 text-sm transition-all shadow-lg shadow-indigo-600/20 flex justify-center items-center gap-2"
        >
          <Video className="w-4 h-4" /> Create New Room
        </button>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-neutral-800"></div>
          <span className="flex-shrink-0 mx-4 text-neutral-600 text-xs uppercase tracking-wider">or join room</span>
          <div className="flex-grow border-t border-neutral-800"></div>
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            value={roomId} 
            onChange={e => setRoomId(e.target.value)}
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors uppercase tracking-widest font-mono"
            placeholder="ROOM ID"
          />
          <button 
            onClick={onJoin}
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm rounded-xl px-5 transition-colors border border-neutral-700 shadow-md"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}

function Room({ roomId, user, userName, onLeave }) {
  const [roomData, setRoomData] = useState(null);
  const [participants, setParticipants] = useState([]);
  
  const roomRef = doc(db, 'artifacts', appId, 'public', 'data', ROOMS_COL, roomId);
  const participantsRef = collection(db, 'artifacts', appId, 'public', 'data', ROOMS_COL, roomId, PARTICIPANTS_COL);

  useEffect(() => {
    const unsub = onSnapshot(roomRef, (doc) => setRoomData(doc.exists() ? doc.data() : null));
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    const unsub = onSnapshot(participantsRef, (snap) => {
      const parts = [];
      snap.forEach(doc => parts.push({ id: doc.id, ...doc.data() }));
      setParticipants(parts);
    });
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    const userDocRef = doc(participantsRef, user.uid);
    setDoc(userDocRef, { name: userName, isMuted: true, joinedAt: serverTimestamp() });
    return () => { deleteDoc(userDocRef).catch(() => {}); };
  }, [roomId, user.uid, userName]);

  if (!roomData) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-950">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const isHost = roomData.hostId === user.uid;

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-neutral-950">
      <header className="flex items-center justify-between px-4 py-3 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-xl border border-indigo-500/20">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-xs tracking-tight text-white">WatchParty Room</h2>
            <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono mt-0.5">
              <span className="text-indigo-400 font-bold">{roomId}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(roomId)} 
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 p-1 rounded-lg transition-colors flex items-center gap-1 text-[10px]"
                title="Copy Room ID"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
          </div>
        </div>
        <button 
          onClick={onLeave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors border border-red-500/20 shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" /> Leave
        </button>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col bg-neutral-950 overflow-y-auto">
          <Player roomId={roomId} roomData={roomData} isHost={isHost} />
          <ParticipantBar participants={participants} roomId={roomId} userId={user.uid} />
        </div>
        <ChatPanel roomId={roomId} user={user} userName={userName} />
      </main>
    </div>
  );
}

function Player({ roomId, roomData, isHost }) {
  const videoRef = useRef(null);
  const [videoInput, setVideoInput] = useState('');
  const [playError, setPlayError] = useState(false);

  const roomRef = doc(db, 'artifacts', appId, 'public', 'data', ROOMS_COL, roomId);

  useEffect(() => {
    if (!videoRef.current || isHost || !roomData.videoUrl) return;
    const vid = videoRef.current;
    const { isPlaying, currentTime } = roomData.videoState;

    if (Math.abs(vid.currentTime - currentTime) > 1.5) {
      vid.currentTime = currentTime;
    }

    if (isPlaying && vid.paused) {
      vid.play().catch(() => setPlayError(true));
    } else if (!isPlaying && !vid.paused) {
      vid.pause();
    }
  }, [roomData.videoState, isHost, roomData.videoUrl]);

  const handleSetVideo = async (e) => {
    e.preventDefault();
    if (!isHost) return;
    
    const url = videoInput.toLowerCase() === 'test' 
      ? 'https://www.w3schools.com/html/mov_bbb.mp4' 
      : videoInput;
      
    await updateDoc(roomRef, { 
      videoUrl: url,
      videoState: { isPlaying: false, currentTime: 0, updatedAt: Date.now() }
    });
    setVideoInput('');
  };

  const handleHostPlay = () => {
    if (!isHost) return;
    updateDoc(roomRef, { 'videoState.isPlaying': true, 'videoState.currentTime': videoRef.current.currentTime, 'videoState.updatedAt': Date.now() });
  };

  const handleHostPause = () => {
    if (!isHost) return;
    updateDoc(roomRef, { 'videoState.isPlaying': false, 'videoState.currentTime': videoRef.current.currentTime, 'videoState.updatedAt': Date.now() });
  };

  const handleHostSeek = () => {
    if (!isHost) return;
    updateDoc(roomRef, { 'videoState.currentTime': videoRef.current.currentTime, 'videoState.updatedAt': Date.now() });
  };

  return (
    <div className="relative w-full aspect-video bg-black flex flex-col justify-center items-center border-b border-neutral-900 shrink-0">
      {!roomData.videoUrl ? (
        <div className="p-6 text-center w-full max-w-sm">
          {isHost ? (
            <form onSubmit={handleSetVideo} className="bg-neutral-900/80 p-6 rounded-3xl border border-neutral-800 shadow-2xl backdrop-blur-md">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20 shadow-inner">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Load a Video</h3>
              <p className="text-xs text-neutral-400 mb-4">Paste a direct MP4 URL or type <span className="text-indigo-400 font-mono">test</span> for a sample video.</p>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={videoInput}
                  onChange={(e) => setVideoInput(e.target.value)}
                  placeholder="https://... or 'test'"
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors shadow-lg shadow-indigo-600/20">
                  Load
                </button>
              </div>
            </form>
          ) : (
            <div className="text-neutral-500 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center mb-3 border border-neutral-800">
                <Video className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-xs font-medium text-neutral-400">Waiting for Host to load a video...</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={roomData.videoUrl}
            className="w-full h-full object-contain"
            controls={isHost}
            onPlay={handleHostPlay}
            onPause={handleHostPause}
            onSeeked={handleHostSeek}
            playsInline
          />
          {!isHost && playError && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm z-20">
              <button 
                onClick={() => { videoRef.current.play(); setPlayError(false); }}
                className="bg-indigo-600 text-white text-xs px-5 py-2.5 rounded-xl font-semibold shadow-xl shadow-indigo-600/30 animate-pulse flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> Tap to Sync Playback
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ParticipantBar({ participants, roomId, userId }) {
  const toggleMute = async () => {
    const myDoc = doc(db, 'artifacts', appId, 'public', 'data', ROOMS_COL, roomId, PARTICIPANTS_COL, userId);
    const me = participants.find(p => p.id === userId);
    if (me) await updateDoc(myDoc, { isMuted: !me.isMuted });
  };

  const me = participants.find(p => p.id === userId);

  return (
    <div className="bg-neutral-950 px-4 py-3 border-b border-neutral-900 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-indigo-400" /> Members ({participants.length}/6)
        </h3>
        
        <button 
          onClick={toggleMute}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            me?.isMuted 
              ? 'bg-neutral-900 text-neutral-400 border border-neutral-800' 
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {me?.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          <span>{me?.isMuted ? 'Muted' : 'Speaking'}</span>
        </button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {participants.slice(0, 6).map((p) => {
          const isMe = p.id === userId;
          return (
            <div key={p.id} className="flex flex-col items-center gap-1 shrink-0">
              <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-md
                ${!p.isMuted ? 'ring-2 ring-emerald-500 bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-neutral-900 border border-neutral-800 text-neutral-300'}
              `}>
                {p.name.charAt(0).toUpperCase()}
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-neutral-950 flex items-center justify-center ${p.isMuted ? 'bg-neutral-700' : 'bg-emerald-500'}`}>
                  {p.isMuted ? <MicOff className="w-2 h-2 text-neutral-300" /> : <Mic className="w-2 h-2 text-white" />}
                </div>
              </div>
              <span className="text-[10px] text-neutral-400 truncate max-w-[60px] text-center">
                {p.name.split(' ')[0]} {isMe && '(You)'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChatPanel({ roomId, user, userName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const messagesRef = collection(db, 'artifacts', appId, 'public', 'data', ROOMS_COL, roomId, MESSAGES_COL);

  useEffect(() => {
    const unsub = onSnapshot(messagesRef, (snap) => {
      const msgs = [];
      snap.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
      msgs.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsub();
  }, [roomId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const text = newMessage;
    setNewMessage('');
    await addDoc(messagesRef, { userId: user.uid, userName, text, createdAt: serverTimestamp() });
  };

  return (
    <div className="flex-1 md:w-80 md:flex-none flex flex-col bg-neutral-900/30 border-l border-neutral-900 min-h-0">
      <div className="p-3 border-b border-neutral-900 bg-neutral-950/60 backdrop-blur flex items-center gap-2 shrink-0">
        <MessageSquare className="w-4 h-4 text-indigo-400" />
        <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Live Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[120px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-1">
            <MessageSquare className="w-6 h-6 opacity-20" />
            <p className="text-xs">No messages yet. Say hi!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.userId === user.uid;
            const showName = i === 0 || messages[i-1].userId !== msg.userId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && showName && <span className="text-[10px] text-neutral-500 mb-0.5 ml-1">{msg.userName}</span>}
                <div className={`px-3.5 py-2 rounded-2xl max-w-[85%] text-xs shadow-sm ${
                  isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-neutral-900 text-neutral-200 rounded-tl-sm border border-neutral-800'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-neutral-950/80 border-t border-neutral-900 shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white disabled:opacity-40 disabled:bg-neutral-900 transition-colors shadow-md shadow-indigo-600/20"
          >
            <Send className="w-3.5 h-3.5 -ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}