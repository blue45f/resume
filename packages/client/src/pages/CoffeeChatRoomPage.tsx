import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchCoffeeChat, completeCoffeeChat, type CoffeeChat } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { useWebrtcPeer } from '@/lib/useWebrtcPeer';
import { toast } from '@/components/Toast';

/**
 * 1:1 WebRTC 통화 방 — host/requester 양쪽이 같은 페이지에 들어오면 P2P 연결.
 * 서버는 signaling 만 담당, 미디어는 peer-to-peer.
 */
export default function CoffeeChatRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const me = getUser();
  const [chat, setChat] = useState<CoffeeChat | null>(null);
  const [loading, setLoading] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const peerId = chat ? (chat.hostId === me?.id ? chat.requesterId : chat.hostId) : '';
  const peerInfo = chat ? (chat.hostId === me?.id ? chat.requester : chat.host) : null;
  // host 가 initiator (먼저 offer 생성)
  const isInitiator = !!chat && chat.hostId === me?.id;

  const { state, localStream, remoteStream, error, start, hangup } = useWebrtcPeer({
    roomId: chat?.roomId || '',
    peerId,
    isInitiator,
    modality: chat?.modality || 'video',
  });

  useEffect(() => {
    if (!id) return;
    fetchCoffeeChat(id)
      .then((c) => setChat(c))
      .catch((e) => toast(e instanceof Error ? e.message : '불러오기 실패', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-500">불러오는 중...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!chat || !chat.roomId || chat.status !== 'accepted') {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              아직 시작 가능한 통화가 아닙니다
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              호스트가 신청을 수락한 후에만 통화를 시작할 수 있어요.
            </p>
            <button
              onClick={() => navigate('/coffee-chats')}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              커피챗 목록으로
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const isVideo = chat.modality === 'video';
  const isVoice = chat.modality === 'voice';
  const isChat = chat.modality === 'chat';

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <div className="mb-4">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {peerInfo?.name || '상대'}님과의 커피챗
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {chat.modality === 'video'
              ? '📹 화상'
              : chat.modality === 'voice'
                ? '🎙️ 음성'
                : '💬 텍스트'}{' '}
            · {chat.durationMin}분 · 상태: {state}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {!isChat && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full ${isVideo ? '' : 'hidden'}`}
              />
              {!isVideo && remoteStream && (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <span className="text-4xl">🔊 {peerInfo?.name}</span>
                </div>
              )}
              {!remoteStream && (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <span className="text-sm">상대 연결 대기 중...</span>
                </div>
              )}
              <span className="absolute bottom-2 left-2 px-2 py-0.5 text-xs bg-black/60 text-white rounded">
                {peerInfo?.name}
              </span>
            </div>
            <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden relative">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full ${isVideo ? '' : 'hidden'}`}
              />
              {isVoice && localStream && (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <span className="text-4xl">🎙️ 나</span>
                </div>
              )}
              {!localStream && (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <span className="text-sm">통화를 시작하세요</span>
                </div>
              )}
              <span className="absolute bottom-2 left-2 px-2 py-0.5 text-xs bg-black/60 text-white rounded">
                나
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {state === 'idle' ? (
            <button
              onClick={start}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              {isVideo ? '📹 통화 시작' : isVoice ? '🎙️ 음성 통화 시작' : '💬 채팅 시작'}
            </button>
          ) : (
            <button
              onClick={async () => {
                await hangup();
                toast('통화 종료', 'success');
                navigate(`/coffee-chats/${id}`);
              }}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              통화 종료
            </button>
          )}
          {(state === 'connected' || state === 'disconnected') && (
            <button
              onClick={async () => {
                await completeCoffeeChat(id!);
                toast('완료 처리되었습니다', 'success');
                navigate('/coffee-chats');
              }}
              className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              완료 처리
            </button>
          )}
        </div>

        <div className="mt-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
          ⓘ 음성/화상은 브라우저 간 직접 연결(P2P)로 진행됩니다. 서버는 연결 신호만 전달하며
          영상/음성 데이터를 저장하지 않습니다. 일부 NAT 환경에서는 연결이 어려울 수 있어요.
        </div>
      </main>
      <Footer />
    </>
  );
}
