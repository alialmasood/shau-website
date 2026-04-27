/** استخراج معرف فيديو يوتيوب وروابط التضمين (مثل الأخبار). */

export function normalizeYouTubeId(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  const trimmed = String(rawUrl).trim();
  if (!trimmed) return null;

  let urlToParse = trimmed;
  if (!/^https?:\/\//i.test(urlToParse)) {
    urlToParse = `https://${urlToParse}`;
  }

  try {
    const u = new URL(urlToParse);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id || null;
    }

    if (host.endsWith("youtube.com")) {
      if (u.pathname === "/watch") {
        return u.searchParams.get("v");
      }
      if (u.pathname.startsWith("/embed/")) {
        return u.pathname.replace("/embed/", "").split("/")[0] || null;
      }
      if (u.pathname.startsWith("/shorts/")) {
        return u.pathname.replace("/shorts/", "").split("/")[0] || null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function youtubeEmbedSrc(
  videoId: string,
  opts?: { autoplay?: boolean; mute?: boolean }
): string {
  const autoplay = opts?.autoplay !== false;
  const mute = opts?.mute !== false;
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1${autoplay ? "&autoplay=1" : ""}${mute ? "&mute=1" : ""}`;
}

export function isYouTubeUrl(url: string): boolean {
  return /(^https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url);
}
