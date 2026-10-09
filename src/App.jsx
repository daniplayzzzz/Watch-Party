import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
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
  MessageSquare, Send, Upload, Copy, LogOut, Link2 
} from 'lucide-react';

// Your custom Firebase configuration
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

// Constants for collections
const ROOMS_COL = 'watchparty_rooms';
const PARTICIPANTS_COL = 'participants';
const MESSAGES_COL = 'messages';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing'); // 'landing' | 'room'
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');

  // Firebase Auth setup
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleCreateRoom = async () => {
    if (!userName.trim()) return setError('Please enter a name');
    if (!user) return setError('Not authenticated yet');
    
    const newRoomId = generateRoomId();
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', ROOMS_COL, newRoomId);
    
    await setDoc(roomRef, {
      hostId: user.uid,
      videoUrl: '', // Default empty video
      videoState: {
        isPlaying: false,
        currentTime: 0,
        updatedAt: Date.now()
      },
      createdAt: serverTimestamp()
    });

    setRoomId(newRoomId);
    setView('room');
  };

  const handleJoinRoom = async () => {
    if (!userName.trim()) return setError('Please enter a name');
    if (!roomId.trim()) return setError('Please enter a Room ID');
    if (!user) return setError('Not authenticated yet');

    const cleanRoomId = roomId.toUpperCase().trim();
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', ROOMS_COL, cleanRoomId);
    
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) {
      return setError('Room not found');
    }

    setRoomId(cleanRoomId);
    setView('room');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        <div className="animate-pulse flex flex-col items-center">
          <Video className="w-12 h-12 mb-4 text-indigo-500" />
          <p>Connecting to WatchParty...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500/30">
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
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-6">
          <Video className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent">
          WatchParty
        </h1>
        <p className="text-neutral-400 mt-2">Sync videos & chill with friends</p>
      </div>

      <div className="space-y-6 bg-neutral-900/50 p-6 rounded-3xl border border-neutral-800 backdrop-blur-xl">
        {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-400 text-sm border border-red-500/20">{error}</div>}
        
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-2">Your Name</label>
          <input 
            type="text" 
            value={userName} 
            onChange={e => setUserName(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="e.g. John Doe"
          />
        </div>

        <div className="pt-4 border-t border-neutral-800">
          <button 
            onClick={onCreate}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-4 py-3 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Video className="w-5 h-5" /> Create New Room
          </button>
        </div>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-neutral-800"></div>
          <span className="flex-shrink-0 mx-4 text-neutral-500 text-sm">or</span>
          <div className="flex-grow border-t border-neutral-800"></div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-2">Join Existing Room</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={roomId} 
              onChange={e => setRoomId(e.target.value)}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors uppercase"
              placeholder="ROOM ID"
            />
            <button 
              onClick={onJoin}
              className="bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl px-6 transition-colors border border-neutral-700"
            >
              Join
            </button>
          </div>
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

  // Sync Room Data
  useEffect(() => {
    const unsub = onSnapshot(roomRef, 
      (doc) => setRoomData(doc.exists() ? doc.data() : null),
      (err) => console.error("Room sync error:", err)
    );
    return () => unsub();
  }, [roomId]);

  // Sync Participants
  useEffect(() => {
    const unsub = onSnapshot(participantsRef, 
      (snap) => {
        const parts = [];
        snap.forEach(doc => parts.push({ id: doc.id, ...doc.data() }));
        setParticipants(parts);
      },
      (err) => console.error("Participants sync error:", err)
    );
    return () => unsub();
  }, [roomId]);

  // Join/Leave room effects
  useEffect(() => {
    const userDocRef = doc(participantsRef, user.uid);
    setDoc(userDocRef, {
      name: userName,
      isMuted: true,
      joinedAt: serverTimestamp()
    });

    return () => {
      deleteDoc(userDocRef).catch(console.error);
    };
  }, [roomId, user.uid, userName]);

  if (!roomData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-neutral-400">Loading Room...</div>
      </div>
    );
  }

  const isHost = roomData.hostId === user.uid;

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-black">
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-4 py-3 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-900 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 text-indigo-400 p-2 rounded-lg">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-sm leading-tight">WatchParty</h2>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span>ID: {roomId}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(roomId)}
                className="hover:text-white transition-colors"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        <button 
          onClick={onLeave}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors border border-red-500/20"
        >
          <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Leave</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="flex-1 flex flex-col min-h-[40vh] md:min-h-0 bg-neutral-950">
          <Player 
            roomId={roomId} 
            roomData={roomData} 
            isHost={isHost} 
          />
          
          <ParticipantBar 
            participants={participants} 
            roomId={roomId} 
            userId={user.uid}
            isHost={isHost}
          />
        </div>
        
        <ChatPanel 
          roomId={roomId} 
          user={user} 
          userName={userName} 
        />
      </main>
    </div>
  );
}

function Player({ roomId, roomData, isHost }) {
  const videoRef = useRef(null);
  const [videoInput, setVideoInput] = useState('');
  const [playError, setPlayError] = useState(false);

  const roomRef = doc(db, 'artifacts', appId, 'public', 'data', ROOMS_COL, roomId);

  // Sync logic for Viewers
  useEffect(() => {
    if (!videoRef.current || isHost || !roomData.videoUrl) return;

    const vid = videoRef.current;
    const { isPlaying, currentTime } = roomData.videoState;

    // Check drift
    if (Math.abs(vid.currentTime - currentTime) > 1.5) {
      vid.currentTime = currentTime;
    }

    if (isPlaying && vid.paused) {
      vid.play().catch(e => {
        console.log("Autoplay prevented:", e);
        setPlayError(true);
      });
    } else if (!isPlaying && !vid.paused) {
      vid.pause();
    }
  }, [roomData.videoState, isHost, roomData.videoUrl]);

  // Host Control Handlers
  const handleHostPlay = () => {
    if (!isHost) return;
    updateDoc(roomRef, {
      'videoState.isPlaying': true,
      'videoState.currentTime': videoRef.current.currentTime,
      'videoState.updatedAt': Date.now()
    });
  };

  const handleHostPause = () => {
    if (!isHost) return;
    updateDoc(roomRef, {
      'videoState.isPlaying': false,
      'videoState.currentTime': videoRef.current.currentTime,
      'videoState.updatedAt': Date.now()
    });
  };

  const handleHostSeek = () => {
    if (!isHost) return;
    updateDoc(roomRef, {
      'videoState.currentTime': videoRef.current.currentTime,
      'videoState.updatedAt': Date.now()
    });
  };

  const handleSetVideo = async (e) => {
    e.preventDefault();
    if (!isHost) return;
    const url = videoInput.toLowerCase() === 'test' 
      ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' 
      : videoInput;
      
    await updateDoc(roomRef, { 
      videoUrl: url,
      videoState: { isPlaying: false, currentTime: 0, updatedAt: Date.now() }
    });
    setVideoInput('');
  };

  return (
    <div className="relative w-full aspect-video bg-black flex flex-col justify-center items-center border-b border-neutral-900 group">
      {!roomData.videoUrl ? (
        <div className="p-6 text-center w-full max-w-lg">
          {isHost ? (
            <form onSubmit={handleSetVideo} className="space-y-4">
              <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                <Video className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Load a Video</h3>
                <p className="text-sm text-neutral-400 mb-6">Paste a direct MP4 URL or type "test" for a sample video.</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-black border border-neutral-700 rounded-xl px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl font-medium transition-colors">
                    Load
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-neutral-500 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-4">
                <Video className="w-8 h-8 opacity-50" />
              </div>
              <p className="font-medium">Waiting for Host to start a video...</p>
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
                onClick={() => {
                  videoRef.current.play();
                  setPlayError(false);
                }}
                className="bg-indigo-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 animate-pulse"
              >
                <Play className="w-5 h-5" /> Click to Sync Playback
              </button>
            </div>
          )}
          {!isHost && !playError && (
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-2 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Synced with Host
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ParticipantBar({ participants, roomId, userId, isHost }) {
  const toggleMute = async () => {
    const myDoc = doc(db, 'artifacts', appId, 'public', 'data', ROOMS_COL, roomId, PARTICIPANTS_COL, userId);
    const me = participants.find(p => p.id === userId);
    if (me) {
      await updateDoc(myDoc, { isMuted: !me.isMuted });
    }
  };

  const me = participants.find(p => p.id === userId);

  return (
    <div className="bg-neutral-950 p-3 md:p-4 border-b border-neutral-900">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-3.5 h-3.5" /> 
          Party Members ({participants.length}/6)
        </h3>
        
        <button 
          onClick={toggleMute}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            me?.isMuted 
              ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700' 
              : 'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}
        >
          {me?.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          <span className="hidden sm:inline">{me?.isMuted ? 'Muted' : 'Speaking'}</span>
        </button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {participants.slice(0, 6).map((p) => {
          const isMe = p.id === userId;
          return (
            <div key={p.id} className="flex flex-col items-center gap-1 min-w-[60px]">
              <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                ${!p.isMuted ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-neutral-950 bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-neutral-800 border border-neutral-700'}
              `}>
                {p.name.charAt(0).toUpperCase()}
                
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-neutral-950 flex items-center justify-center
                  ${p.isMuted ? 'bg-neutral-700' : 'bg-green-500'}
                `}>
                  {p.isMuted ? <MicOff className="w-2.5 h-2.5 text-neutral-400" /> : <Mic className="w-2.5 h-2.5 text-white" />}
                </div>
              </div>
              <span className="text-[10px] text-neutral-400 truncate w-full text-center">
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
    const unsub = onSnapshot(messagesRef, 
      (snap) => {
        const msgs = [];
        snap.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
        msgs.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || Date.now();
          const timeB = b.createdAt?.toMillis() || Date.now();
          return timeA - timeB;
        });
        setMessages(msgs);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      },
      (err) => console.error("Chat sync error:", err)
    );
    return () => unsub();
  }, [roomId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage;
    setNewMessage(''); 
    
    await addDoc(messagesRef, {
      userId: user.uid,
      userName: userName,
      text: text,
      createdAt: serverTimestamp()
    });
  };

  return (
    <div className="flex-1 md:w-80 md:flex-none flex flex-col bg-neutral-900 border-l border-neutral-800">
      <div className="p-3 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur z-10 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-neutral-400" />
        <h3 className="text-sm font-semibold text-neutral-300">Room Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-2">
            <MessageSquare className="w-8 h-8 opacity-20" />
            <p className="text-sm">No messages yet. Say hi!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.userId === user.uid;
            const showName = i === 0 || messages[i-1].userId !== msg.userId;
            
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && showName && (
                  <span className="text-[10px] text-neutral-500 mb-1 ml-1">{msg.userName}</span>
                )}
                <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-neutral-800 text-neutral-200 rounded-tl-sm border border-neutral-700'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-neutral-900 border-t border-neutral-800">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-black border border-neutral-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white disabled:opacity-50 disabled:bg-neutral-800 transition-colors"
          >
            <Send className="w-4 h-4 -ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

