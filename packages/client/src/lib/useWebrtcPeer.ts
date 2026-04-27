import { useEffect, useRef, useState, useCallback } from 'react';
import {
  sendWebrtcSignal,
  drainWebrtcSignals,
  recordWebrtcTelemetry,
  type WebrtcSignal,
} from '@/lib/api';

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

/**
 * ICE 서버 — STUN 기본 + 옵션 TURN.
 * VITE_TURN_URL / VITE_TURN_USERNAME / VITE_TURN_CREDENTIAL 환경변수가 있으면 TURN relay 활성화.
 * Strict NAT (회사 방화벽/모바일 캐리어) 환경에서 통화 성공률 올림. 비용 발생 → telemetry 누적 후 도입 결정.
 */
function buildIceConfig(): RTCConfiguration {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];
  const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
  const turnUser = import.meta.env.VITE_TURN_USERNAME as string | undefined;
  const turnCred = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined;
  if (turnUrl && turnUser && turnCred) {
    servers.push({ urls: turnUrl, username: turnUser, credential: turnCred });
  }
  return { iceServers: servers };
}

const ICE_CONFIG: RTCConfiguration = buildIceConfig();

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
    // idle 또는 failed (재시도) 일 때만 진행
    if (state !== 'idle' && state !== 'failed') return;
    setError('');
    setState('connecting');

    try {
      // 1. 미디어 권한 (chat 모드는 stream 없음)
      let stream: MediaStream | null = null;
      if (modality !== 'chat') {
        // mobile 호환: ideal 만 명시 → 단말이 해상도 결정. 가로/세로 회전 모두 OK.
        const constraints: MediaStreamConstraints =
          modality === 'voice'
            ? { audio: true, video: false }
            : {
                audio: true,
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
              };
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          setLocalStream(stream);
        } catch (mediaErr: any) {
          // 권한 거부 / 디바이스 없음 / 다른 앱 점유 — 명확한 한국어 메시지
          const name = mediaErr?.name || '';
          if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
            throw new Error(
              modality === 'voice'
                ? '마이크 권한이 차단됐어요. 브라우저 주소창의 자물쇠 → 사이트 설정 → 마이크 허용 후 다시 시도해주세요.'
                : '카메라/마이크 권한이 차단됐어요. 브라우저 주소창의 자물쇠 → 사이트 설정 → 카메라·마이크 허용 후 다시 시도해주세요.',
            );
          }
          if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
            throw new Error(
              modality === 'voice'
                ? '마이크 장치를 찾을 수 없어요. 마이크 연결을 확인해주세요.'
                : '카메라/마이크 장치를 찾을 수 없어요. 장치 연결을 확인해주세요.',
            );
          }
          if (name === 'NotReadableError' || name === 'TrackStartError') {
            throw new Error(
              '다른 앱이 카메라/마이크를 사용 중이에요. 해당 앱을 종료 후 재시도해주세요.',
            );
          }
          throw mediaErr;
        }
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

      const startedAt = Date.now();
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setState('connected');
          void recordWebrtcTelemetry({
            roomId,
            state: 'connected',
            modality,
            durationMs: Date.now() - startedAt,
          });
        } else if (pc.connectionState === 'failed') {
          setState('failed');
          void recordWebrtcTelemetry({
            roomId,
            state: 'failed',
            modality,
            durationMs: Date.now() - startedAt,
          });
        } else if (pc.connectionState === 'disconnected') {
          setState('disconnected');
          void recordWebrtcTelemetry({
            roomId,
            state: 'disconnected',
            modality,
            durationMs: Date.now() - startedAt,
          });
        }
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
      const errorName = (err as any)?.name || 'UnknownError';
      setError(err instanceof Error ? err.message : '통화 시작 실패');
      setState('failed');
      void recordWebrtcTelemetry({ roomId, state: 'failed', modality, errorName });
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
