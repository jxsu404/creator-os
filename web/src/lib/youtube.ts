export interface YoutubeVideo {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  thumbnailUrl: string;
  /** ISO 8601 duration from contentDetails, e.g. PT4M13S */
  duration?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
}

export interface YoutubeChannelInfo {
  channelId: string;
  title: string;
  handle?: string;
  subscriberCount?: number;
  videoCount?: number;
}

function apiKey(): string {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Falta YOUTUBE_API_KEY. Añádela en .env.local (Google Cloud → YouTube Data API v3)."
    );
  }
  return key;
}

/** Extrae channel ID, handle @x o URL de canal. */
export function parseYoutubeInput(raw: string): {
  type: "id" | "handle" | "url";
  value: string;
} {
  const input = raw.trim();
  if (!input) throw new Error("Pega un handle (@canal), URL o channel ID.");

  if (/^UC[\w-]{20,}$/.test(input)) {
    return { type: "id", value: input };
  }

  const handleMatch = input.match(/@([\w.-]+)/);
  if (handleMatch) {
    return { type: "handle", value: handleMatch[1] };
  }

  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    if (!url.hostname.includes("youtube.com") && !url.hostname.includes("youtu.be")) {
      throw new Error("URL no válida de YouTube.");
    }
    const at = url.pathname.match(/\/@([\w.-]+)/);
    if (at) return { type: "handle", value: at[1] };
    const ch = url.pathname.match(/\/channel\/(UC[\w-]{20,})/);
    if (ch) return { type: "id", value: ch[1] };
    const user = url.pathname.match(/\/(?:c|user)\/([\w.-]+)/);
    if (user) return { type: "handle", value: user[1] };
  } catch {
    /* fall through */
  }

  if (/^[\w.-]+$/.test(input)) {
    return { type: "handle", value: input.replace(/^@/, "") };
  }

  throw new Error("No pude leer ese canal. Usa @handle, URL o ID (UC…).");
}

async function ytGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  url.searchParams.set("key", apiKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  const data = await res.json();
  if (!res.ok) {
    const msg =
      data?.error?.message ||
      `YouTube API error (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

function parseCount(raw: string | undefined): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export async function resolveYoutubeChannel(
  raw: string
): Promise<YoutubeChannelInfo & { uploadsPlaylistId: string }> {
  const parsed = parseYoutubeInput(raw);

  type ChannelsResponse = {
    items?: Array<{
      id: string;
      snippet?: { title?: string; customUrl?: string };
      contentDetails?: { relatedPlaylists?: { uploads?: string } };
      statistics?: {
        subscriberCount?: string;
        videoCount?: string;
        hiddenSubscriberCount?: boolean;
      };
    }>;
  };

  let data: ChannelsResponse;
  if (parsed.type === "id") {
    data = await ytGet<ChannelsResponse>("channels", {
      part: "snippet,contentDetails,statistics",
      id: parsed.value,
    });
  } else {
    data = await ytGet<ChannelsResponse>("channels", {
      part: "snippet,contentDetails,statistics",
      forHandle: parsed.value,
    });
    if (!data.items?.length) {
      data = await ytGet<ChannelsResponse>("channels", {
        part: "snippet,contentDetails,statistics",
        forUsername: parsed.value,
      });
    }
  }

  const item = data.items?.[0];
  if (!item?.id) {
    throw new Error("No encontré ese canal. Revisa el handle o la URL.");
  }
  const uploads = item.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) {
    throw new Error("El canal no tiene playlist de uploads legible.");
  }

  const hidden = item.statistics?.hiddenSubscriberCount;
  return {
    channelId: item.id,
    title: item.snippet?.title || "Canal",
    handle: item.snippet?.customUrl,
    uploadsPlaylistId: uploads,
    subscriberCount: hidden
      ? undefined
      : parseCount(item.statistics?.subscriberCount),
    videoCount: parseCount(item.statistics?.videoCount),
  };
}

/** Enriquecer IDs con statistics + duration (1 cuota, hasta 50 IDs). */
export async function fetchYoutubeVideoDetails(
  ids: string[]
): Promise<Map<string, Partial<YoutubeVideo>>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, Partial<YoutubeVideo>>();
  if (unique.length === 0) return map;

  type VideosResponse = {
    items?: Array<{
      id?: string;
      snippet?: {
        title?: string;
        publishedAt?: string;
        description?: string;
        thumbnails?: {
          medium?: { url?: string };
          high?: { url?: string };
          default?: { url?: string };
        };
      };
      contentDetails?: { duration?: string };
      statistics?: {
        viewCount?: string;
        likeCount?: string;
        commentCount?: string;
      };
    }>;
  };

  // Batch de 50 (límite API)
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    const data = await ytGet<VideosResponse>("videos", {
      part: "snippet,contentDetails,statistics",
      id: chunk.join(","),
    });
    for (const item of data.items || []) {
      if (!item.id) continue;
      map.set(item.id, {
        id: item.id,
        title: item.snippet?.title,
        publishedAt: item.snippet?.publishedAt,
        thumbnailUrl:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        duration: item.contentDetails?.duration,
        viewCount: parseCount(item.statistics?.viewCount),
        likeCount: parseCount(item.statistics?.likeCount),
        commentCount: parseCount(item.statistics?.commentCount),
      });
    }
  }

  return map;
}

export async function fetchYoutubeUploads(
  uploadsPlaylistId: string,
  max = 8
): Promise<YoutubeVideo[]> {
  type PlaylistResponse = {
    items?: Array<{
      snippet?: {
        title?: string;
        publishedAt?: string;
        resourceId?: { videoId?: string };
        thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
      };
    }>;
  };

  const data = await ytGet<PlaylistResponse>("playlistItems", {
    part: "snippet",
    playlistId: uploadsPlaylistId,
    maxResults: String(Math.min(Math.max(max, 1), 15)),
  });

  const base = (data.items || [])
    .map((item) => {
      const id = item.snippet?.resourceId?.videoId;
      if (!id) return null;
      return {
        id,
        title: item.snippet?.title || "Video",
        url: `https://www.youtube.com/watch?v=${id}`,
        publishedAt: item.snippet?.publishedAt || "",
        thumbnailUrl:
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          "",
      } satisfies YoutubeVideo;
    })
    .filter(Boolean) as YoutubeVideo[];

  const details = await fetchYoutubeVideoDetails(base.map((v) => v.id));
  return base.map((v) => {
    const d = details.get(v.id);
    if (!d) return v;
    return {
      ...v,
      title: d.title || v.title,
      publishedAt: d.publishedAt || v.publishedAt,
      thumbnailUrl: d.thumbnailUrl || v.thumbnailUrl,
      duration: d.duration,
      viewCount: d.viewCount,
      likeCount: d.likeCount,
      commentCount: d.commentCount,
    };
  });
}
