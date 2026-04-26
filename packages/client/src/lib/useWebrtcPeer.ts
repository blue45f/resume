import { useEffect, useRef, useState, useCallback } from 'react';
import { sendWebrtcSignal, drainWebrtcSignals, type WebrtcSignal } from '@/lib/api';

/**
 * 1:1 WebRTC P2P 통화 hook (서버는 signaling 만, 미디어는 brower-to-browser).
 *
 * 서버 비용 절감: STUN 만 사용 (Google 공개), TURN 미사용. NAT 환경에서 일부 실패 가능 — 추후 TURN 보강.
 *
 * 사용:
 *   const { state, localStream, remoteStream, start, hangup } = useWebrtcPeer({
 *     roomId, peerId, isInitiator, modality
 *   });
 *
 * polling: 1초 간격으로 server signal 큐 drain (lightweight, 매 분 60 req).
 */

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
};

const POLL_INTERVAL_MS = 1000;

export type PeerState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';

interface Options {
  roomId: string;
  peerId: string;
  /** 먼저 offer 를 만들 쪽 (양쪽이 동시에 활성화되면 둘 다 false 로 두고 정렬 결정) */
  isInitiator: boolean;
  modality: 'voice' | 'video' | 'chat';
}

export function useWebrtcPeer({ roomId, peerId, isInitiator, modality }: Options) {
  const [state, setState] = useState<PeerState>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pollRef = useRef<number | null>(null);
  const lastSignalIdRef = useRef<Set<string>>(new Set());

  const cleanup = useCallback(() => {
    pollRef.current && clearInterval(pollRef.current);
    pollRef.current = null;
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setState('idle');
  }, [localStream]);

  /** 사용자 인터랙션 후 호출 — 카메라/마이크 권한 요청 + peer connection 시작. */
  const start = useCallback(async () => {
    if (state !== 'idle') return;
    setError('');
    setState('connecting');

    try {
      // 1. 미디어 권한 (chat 모드는 stream 없음)
      let stream: MediaStream | null = null;
      if (modality !== 'chat') {
        const constraints: MediaStreamConstraints =
          modality === 'voice'
            ? { audio: true, video: false }
            : { audio: true, video: { width: 640, height: 480 } };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
      }

      // 2. Peer connection
      const pc = new RTCPeerConnection(ICE_CONFIG);
      pcRef.current = pc;

      if (stream) stream.getTracks().forEach((track) => pc.addTrack(track, stream!));

      pc.ontrack = (e) => {
        setRemoteStream(e.streams[0] || null);
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendWebrtcSignal({
            roomId,
            toUserId: peerId,
            type: 'ice',
            payload: e.candidate.toJSON(),
          }).catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') setState('connected');
        else if (pc.connectionState === 'failed') setState('failed');
        else if (pc.connectionState === 'disconnected') setState('disconnected');
      };

      // 3. Initiator: offer 생성
      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendWebrtcSignal({
          roomId,
          toUserId: peerId,
          type: 'offer',
          payload: offer,
        });
      }

      // 4. Polling 시작 — 서버 큐에서 신호 drain
      pollRef.current = window.setInterval(async () => {
        try {
          const signals = await drainWebrtcSignals(roomId);
          for (const s of signals) {
            if (lastSignalIdRef.current.has(s.id)) continue;
            lastSignalIdRef.current.add(s.id);
            await handleSignal(s);
          }
        } catch {
          // network blip — 계속 polling
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : '통화 시작 실패');
      setState('failed');
      cleanup();
    }
  }, [state, modality, isInitiator, roomId, peerId, cleanup]);

  const handleSignal = useCallback(
    async (s: WebrtcSignal) => {
      const pc = pcRef.current;
      if (!pc) return;

      try {
        if (s.type === 'offer') {
          await pc.setRemoteDescription(
            new RTCSessionDescription(s.payload as RTCSessionDescriptionInit),
          );
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendWebrtcSignal({ roomId, toUserId: peerId, type: 'answer', payload: answer });
        } else if (s.type === 'answer') {
          await pc.setRemoteDescription(
            new RTCSessionDescription(s.payload as RTCSessionDescriptionInit),
          );
        } else if (s.type === 'ice') {
          await pc.addIceCandidate(new RTCIceCandidate(s.payload as RTCIceCandidateInit));
        } else if (s.type === 'bye') {
          cleanup();
        }
      } catch (err) {
        // 단일 signal 실패 — 로깅만 (통화 전체 끊지 않음)

        if (import.meta.env.DEV) console.warn('[webrtc] signal handle 실패', s.type, err);
      }
    },
    [roomId, peerId, cleanup],
  );

  const hangup = useCallback(async () => {
    try {
      await sendWebrtcSignal({ roomId, toUserId: peerId, type: 'bye', payload: {} });
    } catch {
      // 통화 종료는 silent
    }
    cleanup();
  }, [roomId, peerId, cleanup]);

  // unmount 시 자동 정리
  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, localStream, remoteStream, error, start, hangup };
}
