import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export type PlayerSong = { id: number; title: string; artist: string | null; url: string; cover: string | null };

type RepeatMode = "off" | "all" | "one";

type PlayerCtx = {
  queue: PlayerSong[];
  idx: number;
  playing: boolean;
  time: number;
  dur: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  current: PlayerSong | null;
  playList: (list: PlayerSong[], startIdx: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seekTo: (fraction: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  close: () => void;
};

const Ctx = createContext<PlayerCtx | null>(null);

export function usePlayer(): PlayerCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlayer debe usarse dentro de <PlayerProvider>");
  return ctx;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<PlayerSong[]>([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [volume, setVolumeState] = useState(0.9);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("all");

  const current = queue.length > 0 ? queue[Math.min(idx, queue.length - 1)] : null;

  const next = useCallback(() => {
    setIdx((i) => {
      if (queue.length === 0) return 0;
      if (shuffle && queue.length > 1) {
        let r = i;
        while (r === i) r = Math.floor(Math.random() * queue.length);
        return r;
      }
      return (i + 1) % queue.length;
    });
    setPlaying(true);
  }, [queue.length, shuffle]);

  // Cargar la pista al cambiar
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    a.src = current.url;
    a.volume = volume;
    setTime(0);
    setDur(0);
    if (playing) a.play().catch(() => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  // Eventos del elemento de audio
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime);
    const onDur = () => setDur(a.duration);
    const onEnd = () => {
      if (repeat === "one") {
        a.currentTime = 0;
        a.play().catch(() => setPlaying(false));
        return;
      }
      if (repeat === "all" || idx < queue.length - 1) next();
      else setPlaying(false);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onDur);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onDur);
      a.removeEventListener("ended", onEnd);
    };
  }, [repeat, idx, queue.length, next]);

  // Marca en <body> para que los botones flotantes se suban sobre la barra
  useEffect(() => {
    document.body.classList.toggle("has-player", current !== null);
    return () => document.body.classList.remove("has-player");
  }, [current]);

  const playList = useCallback(
    (list: PlayerSong[], startIdx: number) => {
      const target = list[startIdx];
      if (!target) return;
      const cur = queue.length > 0 ? queue[Math.min(idx, queue.length - 1)] : null;
      // Tocar la canción que ya suena = pausar/reanudar
      if (cur?.id === target.id) {
        const a = audioRef.current;
        if (a) {
          if (a.paused) a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
          else { a.pause(); setPlaying(false); }
        }
        return;
      }
      setQueue(list);
      setIdx(startIdx);
      setPlaying(true);
    },
    [queue, idx]
  );

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [playing, current]);

  const prev = useCallback(() => {
    if (queue.length === 0) return;
    const a = audioRef.current;
    // Si van más de 4 segundos, reinicia la canción (como Spotify)
    if (a && a.currentTime > 4) {
      a.currentTime = 0;
      return;
    }
    setIdx((i) => (i - 1 + queue.length) % queue.length);
    setPlaying(true);
  }, [queue.length]);

  const seekTo = useCallback((fraction: number) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    a.currentTime = fraction * a.duration;
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === "all" ? "one" : r === "one" ? "off" : "all")),
    []
  );

  const close = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    setQueue([]);
    setIdx(0);
    setPlaying(false);
    setTime(0);
    setDur(0);
  }, []);

  return (
    <Ctx.Provider
      value={{
        queue, idx, playing, time, dur, volume, shuffle, repeat, current,
        playList, toggle, next, prev, seekTo, setVolume, toggleShuffle, cycleRepeat, close,
      }}
    >
      {children}
      <audio ref={audioRef} preload="metadata" />
    </Ctx.Provider>
  );
}
