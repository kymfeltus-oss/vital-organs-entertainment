/** Plain-language replacements for volunteer-facing broadcast UI copy. */

export function toLaymanCheckLabel(label: string): string {
  const normalized = label.trim();
  if (/encoder|vmix/i.test(normalized)) return "Main Video Software";
  if (/rtmp|pull|ingest|hls/i.test(normalized)) return "Camera Stream Link";
  if (/latency/i.test(normalized)) return "Video Delay";
  if (/dropped frame/i.test(normalized)) return "Blurry or Stuttering Video";
  return normalized;
}

export function toLaymanCheckMessage(message: string): string {
  let text = message.trim();
  if (!text) return text;

  const replacements: Array<[RegExp, string]> = [
    [/vMix encoder unreachable/gi, "Main Video Software is Closed"],
    [/vMix unreachable/gi, "Main Video Software is Closed"],
    [/vMix API unreachable/gi, "Main Video Software is Closed"],
    [/vMix state unavailable/gi, "Main Video Software is Closed — open it on the production computer"],
    [/RTMP pull/gi, "private camera stream"],
    [/RTMP ingest/gi, "private camera upload link"],
    [/HLS preview/gi, "web preview link"],
    [/Dropped Frames Warning/gi, "Warning: Blurry or Stuttering Video"],
    [/Latency Delay/gi, "Warning: Video is Lagging Behind"],
    [/encoder unreachable/gi, "Main Video Software is Closed"],
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  return text;
}

export function videoQualityLabel(signalStrength: number): string {
  if (signalStrength >= 70) return "Video Quality: Clear (HD)";
  if (signalStrength >= 40) return "Video Quality: Fair";
  return "Video Quality: Weak — check connection";
}

export function technicalVideoHint(
  connectionType: string,
  signalStrength: number,
  vmixInputNumber?: number,
): string {
  const parts = [`Signal ${signalStrength}%`, connectionType.toUpperCase()];
  if (vmixInputNumber) parts.push(`Input ${vmixInputNumber}`);
  return parts.join(" · ");
}
