function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]!));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function blobToWavDataUrl(blob: Blob): Promise<string> {
  const arrayBuf = await blob.arrayBuffer();
  const audioCtx = new AudioContext();
  try {
    const decoded = await audioCtx.decodeAudioData(arrayBuf.slice(0));
    const channel = decoded.getChannelData(0);
    const targetRate = 16000;
    const ratio = decoded.sampleRate / targetRate;
    const length = Math.floor(channel.length / ratio);
    const samples = new Float32Array(length);
    for (let i = 0; i < length; i++) samples[i] = channel[Math.floor(i * ratio)] ?? 0;
    return `data:audio/wav;base64,${arrayBufferToBase64(encodeWav(samples, targetRate))}`;
  } finally {
    await audioCtx.close();
  }
}

export type MicRecorderControls = { stop: () => Promise<string>; cancel: () => void };

export async function startMicRecording(): Promise<MicRecorderControls> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "";
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.start(200);
  const stopTracks = () => stream.getTracks().forEach((t) => t.stop());
  return {
    cancel: () => {
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        /* ignore */
      }
      stopTracks();
    },
    stop: () =>
      new Promise((resolve, reject) => {
        recorder.onstop = () => {
          stopTracks();
          const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
          blobToWavDataUrl(blob).then(resolve).catch(reject);
        };
        recorder.onerror = () => {
          stopTracks();
          reject(new Error("Recording failed"));
        };
        if (recorder.state !== "inactive") recorder.stop();
        else reject(new Error("Recorder inactive"));
      }),
  };
}
