import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Loader, FastForward } from "lucide-react";
import axios from "axios";

export default function PodcastPlayer({ selectedText, insightData, activate2, setActivate2, onClose }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [musicFile, setMusicFile] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  const prevInsightData = useRef(null);

  // Visibility
  useEffect(() => {
    setIsVisible(!!selectedText);
  }, [selectedText]);

  // Reset when activate2 triggers
useEffect(() => {
  if (!activate2) return;
  setIsPlaying(false);
  if (audioRef.current) {
    audioRef.current.currentTime = 0;
  }
  setActivate2(false);
}, [activate2]);

  // Fetch audio when insightData changes
useEffect(() => {
  if (!insightData) return;

  setIsPlaying(false);
  if (musicFile) URL.revokeObjectURL(musicFile);
  setMusicFile(null);
  if (audioRef.current) audioRef.current.currentTime = 0;

  const controller = new AbortController();

  const fetchMusic = async () => {
    try {
      const res = await axios.post(
        "/v1/audio",
        { text: insightData },
        { responseType: "blob", signal: controller.signal }
      );
      const audioUrl = URL.createObjectURL(res.data);
      setMusicFile(audioUrl);
      prevInsightData.current = insightData;
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error("Error fetching audio:", err);
      }
    }
  };

  fetchMusic();

  return () => {
    controller.abort(); // cancel previous request if effect re-runs
    if (musicFile) URL.revokeObjectURL(musicFile);
  };
}, [insightData]);

  if (!selectedText && !isVisible) return null;

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((error) => {
        console.error("Playback failed:", error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleFastForward = () => {
    if (audioRef.current) {
      const newTime = audioRef.current.currentTime + 10;
      audioRef.current.currentTime = Math.min(newTime, audioRef.current.duration);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };

  const togglePlaybackRate = () => {
    const speeds = [0.5, 1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextRate = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const updateTime = () => {
      if (!isScrubbing) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleAudioEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleAudioEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleAudioEnded);
    };
  }, [isScrubbing]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = playbackRate;
    if (isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error("Playback failed:", error);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, playbackRate]);

  const playerClasses = `
    fixed bottom-8 left-1/2 -translate-x-1/2 p-3 rounded-full 
    bg-white/90 backdrop-blur-md shadow-xl flex items-center gap-3 dark:bg-gray-900 
    transition-all duration-500 ease-in-out z-50 min-w-[280px] max-w-md w-11/12
    ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 -bottom-full"}
  `;

  return (
    <div className={playerClasses}>
      {!musicFile ? (
        <div className="p-2 rounded-full bg-gray-100 shadow-md">
          <Loader className="w-5 h-5 text-gray-800 animate-spin" />
        </div>
      ) : (
        <button
          onClick={togglePlayPause}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shadow-md"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-gray-800" />
          ) : (
            <Play className="w-5 h-5 text-gray-800" />
          )}
        </button>
      )}

      <button
        onClick={handleFastForward}
        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shadow-md"
        aria-label="Fast forward 10 seconds"
      >
        <FastForward className="w-5 h-5 text-gray-800" />
      </button>

      <button
        onClick={togglePlaybackRate}
        className="px-3 py-1 rounded-full bg-gray-800 hover:bg-white hover:text-gray-800 transition-colors shadow-md text-sm font-mono"
        aria-label="Change playback speed"
      >
        {playbackRate}x
      </button>

      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs font-mono text-white w-10 text-right">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          value={currentTime}
          max={duration}
          onChange={handleSeek}
          onMouseDown={() => setIsScrubbing(true)}
          onMouseUp={() => setIsScrubbing(false)}
          className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer range-thumb"
        />
        <span className="text-xs font-mono text-gray-600 w-10">
          {musicFile ? (
            formatTime(duration)
          ) : (
            <div className="flex justify-center text-white">
              <span className="dot">.</span>
              <span className="dot dot-2">.</span>
              <span className="dot dot-3">.</span>
            </div>
          )}
        </span>
      </div>

      <div className="relative flex items-center group">

  <Volume2 className="w-5 h-5 text-white-100 cursor-pointer" />
  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white p-2 rounded-lg shadow-md">
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={volume}
      onChange={handleVolumeChange}
      className="w-24 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer range-thumb"
    />
  </div>
</div>


      <button
        onClick={onClose}
        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shadow-md"
        aria-label="Close player"
      >
        <VolumeX className="w-5 h-5 text-gray-800" />
      </button>

      <audio ref={audioRef} src={musicFile} preload="auto"></audio>
    </div>
  );
}