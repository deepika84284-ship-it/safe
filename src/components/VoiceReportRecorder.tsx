import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { AudioTranscriptionResult } from '../types';
import {
  Mic,
  Square,
  Sparkles,
  RefreshCw,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  Volume2,
  Radio,
  FileText,
  Languages,
  Tag
} from 'lucide-react';

interface VoiceReportRecorderProps {
  onTranscribeComplete: (result: AudioTranscriptionResult) => void;
}

export const VoiceReportRecorder: React.FC<VoiceReportRecorderProps> = ({
  onTranscribeComplete
}) => {
  const { t, language } = useLanguage();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<AudioTranscriptionResult | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>([15, 25, 40, 20, 50, 30, 60, 40, 25, 45, 20, 15]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopMediaTracks();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.abort(); } catch {}
      }
    };
  }, [audioUrl]);

  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
  };

  // Start microphone recording
  const startRecording = async () => {
    setErrorMessage(null);
    setLiveTranscript('');
    setTranscriptionResult(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support microphone audio recording.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      // Setup Web Audio Analyser for live visualizer
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVisualizer = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            // Sample 12 frequency bins
            const levels: number[] = [];
            for (let i = 0; i < 12; i++) {
              const val = dataArray[i * 2] || 0;
              levels.push(Math.max(12, Math.min(100, Math.round((val / 255) * 100))));
            }
            setAudioLevels(levels);
            animFrameRef.current = requestAnimationFrame(updateVisualizer);
          };
          updateVisualizer();
        }
      } catch (audioCtxErr) {
        console.warn('AudioContext visualization not available:', audioCtxErr);
      }

      // Determine mimeType
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stopMediaTracks();

        // Process audio with AI
        await processAudioWithAi(audioBlob, mimeType);
      };

      // Optional Browser Speech Recognition for live preview
      try {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          const recognition = new SpeechRec();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';

          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript + ' ';
            }
            setLiveTranscript(current.trim());
          };

          recognition.onerror = (e: any) => {
            console.warn('SpeechRecognition interim error:', e);
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        }
      } catch (recErr) {
        console.warn('Browser SpeechRecognition not active:', recErr);
      }

      mediaRecorder.start(250); // Slice every 250ms
      setIsRecording(true);
      setRecordingDuration(0);

      // Duration counter
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 120) {
            // Auto stop after 2 minutes
            stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setIsRecording(false);
      stopMediaTracks();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          language === 'ta'
            ? 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது. உலாவியில் மைக் அனுமதியை வழங்கி மீண்டும் முயற்சிக்கவும்.'
            : 'Microphone permission denied. Please allow microphone access in your browser settings to record.'
        );
      } else {
        setErrorMessage(
          err.message ||
            (language === 'ta'
              ? 'மைக்ரோஃபோனை அணுக முடியவில்லை. தயவுசெய்து சாதனத்தை சரிபார்க்கவும்.'
              : 'Failed to access microphone. Please check your audio input device.')
        );
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Convert Blob to base64 and call server AI endpoint
  const processAudioWithAi = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      // Convert to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const res = await api.transcribeScamVoice({
        audioBase64: base64Data,
        mimeType: mimeType || 'audio/webm',
        clientTranscript: liveTranscript,
        language: language === 'ta' ? 'ta' : 'en'
      });

      if (res.success && res.data) {
        setTranscriptionResult(res.data);
        onTranscribeComplete(res.data);
      } else {
        throw new Error('AI transcription returned empty response.');
      }
    } catch (err: any) {
      console.error('Audio transcription error:', err);
      // Fallback: if we have a live client transcript, use fallback extraction
      if (liveTranscript) {
        const fallbackResult: AudioTranscriptionResult = {
          fullTranscript: liveTranscript,
          extractedReason: liveTranscript.slice(0, 100),
          extractedDescription: liveTranscript,
          suggestedCategory: 'Product not delivered',
          financialLossAmount: 0,
          detectedKeywords: ['Live Speech'],
          detectedLanguage: language === 'ta' ? 'Tamil' : 'English'
        };
        setTranscriptionResult(fallbackResult);
        onTranscribeComplete(fallbackResult);
      } else {
        setErrorMessage(
          language === 'ta'
            ? 'குரல் பதிவை மாற்ற இயலவில்லை. தயவுசெய்து மீண்டும் பேசவும் அல்லது நேரடியாக தட்டச்சு செய்யவும்.'
            : 'Failed to transcribe audio. Please try speaking again or type your complaint manually.'
        );
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  // Play / Pause audio playback
  const togglePlayAudio = () => {
    if (!audioElementRef.current || !audioUrl) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-700/80 p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
      {/* Decorative top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 opacity-80" />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                {t('report.voiceTitle')}
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Gemini 3.7 AI
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {t('report.voiceSubtitle')}
            </p>
          </div>
        </div>

        {/* Language Indicator */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono">
          <Languages className="w-3.5 h-3.5 text-red-400" />
          <span>{language === 'ta' ? 'தமிழ் / Tanglish / English' : 'English / தமிழ்'}</span>
        </div>
      </div>

      {/* Active Recording State or Main Action Box */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
        {isRecording ? (
          /* Active Recording View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">
                  {t('report.recording')}
                </span>
              </div>
              <div className="text-xs font-mono font-black text-white bg-red-950/80 border border-red-500/30 px-3 py-1 rounded-full">
                ⏱️ {formatSeconds(recordingDuration)} / 02:00
              </div>
            </div>

            {/* Audio Waveform Visualizer */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 h-14 bg-slate-900/90 rounded-xl px-4 border border-slate-800">
              {audioLevels.map((lvl, idx) => (
                <div
                  key={idx}
                  className="w-1.5 sm:w-2 bg-gradient-to-t from-red-600 via-amber-500 to-emerald-400 rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.max(15, lvl)}%`,
                    opacity: 0.4 + (lvl / 100) * 0.6
                  }}
                />
              ))}
            </div>

            {/* Live speech preview if available */}
            {liveTranscript && (
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 font-mono italic">
                <span className="text-slate-500 not-italic block text-[10px] uppercase tracking-wider mb-1 font-bold">
                  {language === 'ta' ? 'நேரடி உரை முன்னோட்டம்:' : 'Live Speech Recognition:'}
                </span>
                "{liveTranscript}"
              </div>
            )}

            {/* Stop Button */}
            <button
              type="button"
              onClick={stopRecording}
              className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>{t('report.recordStop')}</span>
            </button>
          </div>
        ) : isTranscribing ? (
          /* Transcribing with AI view */
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative">
              <RefreshCw className="w-9 h-9 text-emerald-400 animate-spin" />
              <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                {t('report.transcribing')}
              </h4>
              <p className="text-xs text-slate-400 max-w-md">
                {language === 'ta'
                  ? 'உங்கள் குரலை பகுப்பாய்வு செய்து இணையதள முகவரி, இழப்புத் தொகை, வகை மற்றும் புகார் விவரங்களைSafeCart பிரித்தெடுக்கிறது...'
                  : 'Analyzing voice audio, extracting website URL, payment loss, issue category, and building a structured incident report...'}
              </p>
            </div>
          </div>
        ) : (
          /* Idle / Ready to Record State */
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={startRecording}
                className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                title="Click to Record Voice Description"
              >
                <Mic className="w-6 h-6 group-hover:animate-bounce" />
                <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-slate-900"></span>
                </span>
              </button>

              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={startRecording}
                  className="text-left font-black text-sm text-white hover:text-red-400 uppercase tracking-wide transition cursor-pointer"
                >
                  {t('report.recordStart')}
                </button>
                <p className="text-[11px] text-slate-400">
                  {t('report.voiceTip')}
                </p>
              </div>
            </div>

            {/* Quick Helper Badge */}
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 self-stretch sm:self-auto justify-center">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Mic Ready • 2 Min Max</span>
            </div>
          </div>
        )}

        {/* Error message if any */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-xs text-red-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">{errorMessage}</span>
              <p className="text-[11px] text-red-400/80">
                {language === 'ta'
                  ? 'நீங்கள் படிவத்தை கீழேயுள்ள பெட்டிகளில் நேரடியாக தட்டச்சு செய்தும் சமர்ப்பிக்கலாம்.'
                  : 'You can still fill out the report form manually below.'}
              </p>
            </div>
          </div>
        )}

        {/* Audio Player & Transcription Success Card */}
        {transcriptionResult && !isRecording && !isTranscribing && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
            {/* Success notification banner */}
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold">{t('report.voiceSuccess')}</span>
              </div>
              <button
                type="button"
                onClick={startRecording}
                className="text-[11px] font-bold text-emerald-300 hover:text-white underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                {t('report.voiceReRecord')}
              </button>
            </div>

            {/* Audio playback controls */}
            {audioUrl && (
              <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <audio
                  ref={audioElementRef}
                  src={audioUrl}
                  onEnded={handleAudioEnded}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow transition cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>
                  <span className="text-xs font-mono text-slate-300">
                    {isPlaying ? t('report.voicePause') : t('report.voicePlay')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{formatSeconds(recordingDuration)}</span>
                </div>
              </div>
            )}

            {/* AI Extracted Info Pills */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-red-400" />
                  {language === 'ta' ? 'AI கண்டறிந்த விவரங்கள்:' : 'AI Extracted Insights:'}
                </span>
                {transcriptionResult.detectedLanguage && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">
                    🗣️ {transcriptionResult.detectedLanguage}
                  </span>
                )}
              </div>

              {/* Full transcript quote */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-300 font-mono text-[11px] leading-relaxed">
                <span className="text-slate-500 block text-[10px] font-bold uppercase mb-0.5">
                  {language === 'ta' ? 'முழு உரை (Transcript):' : 'Voice Transcript:'}
                </span>
                "{transcriptionResult.fullTranscript}"
              </div>

              {/* Keywords & loss tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {transcriptionResult.suggestedCategory && (
                  <span className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500/30 text-red-300 font-mono text-[10px] font-bold flex items-center gap-1">
                    <Tag className="w-3 h-3 text-red-400" />
                    {transcriptionResult.suggestedCategory}
                  </span>
                )}
                {transcriptionResult.financialLossAmount ? (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
                    💰 Loss: {language === 'ta' ? `ரூ. ${transcriptionResult.financialLossAmount}` : `$${transcriptionResult.financialLossAmount}`}
                  </span>
                ) : null}
                {transcriptionResult.detectedKeywords?.map((kw, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
