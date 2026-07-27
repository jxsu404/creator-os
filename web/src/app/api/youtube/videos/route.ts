import { NextResponse } from "next/server";
import {
  fetchYoutubeUploads,
  fetchYoutubeVideoDetails,
  resolveYoutubeChannel,
} from "@/lib/youtube";
import { unauthorizedApiResponse } from "@/lib/supabase/require-api-user";

export async function POST(request: Request) {
  try {
    const denied = await unauthorizedApiResponse();
    if (denied) return denied;

    const body = await request.json();
    const channelInput =
      typeof body.channelInput === "string" ? body.channelInput : "";
    const channelId =
      typeof body.channelId === "string" ? body.channelId : "";
    const uploadsPlaylistId =
      typeof body.uploadsPlaylistId === "string"
        ? body.uploadsPlaylistId
        : "";
    const videoId =
      typeof body.videoId === "string" ? body.videoId.trim() : "";

    // Refresh de un solo video (detalle)
    if (videoId) {
      const details = await fetchYoutubeVideoDetails([videoId]);
      const video = details.get(videoId);
      if (!video?.id) {
        return NextResponse.json(
          { error: "No encontré ese video." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        video: {
          id: video.id,
          title: video.title || "Video",
          url: video.url || `https://www.youtube.com/watch?v=${video.id}`,
          publishedAt: video.publishedAt || "",
          thumbnailUrl: video.thumbnailUrl || "",
          duration: video.duration,
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          commentCount: video.commentCount,
        },
        fetchedAt: new Date().toISOString(),
      });
    }

    let resolved: {
      channelId: string;
      title: string;
      handle?: string;
      uploadsPlaylistId: string;
      subscriberCount?: number;
      videoCount?: number;
    };

    if (uploadsPlaylistId && channelId) {
      resolved = {
        channelId,
        title: typeof body.channelTitle === "string" ? body.channelTitle : "",
        handle:
          typeof body.channelHandle === "string"
            ? body.channelHandle
            : undefined,
        uploadsPlaylistId,
        subscriberCount:
          typeof body.subscriberCount === "number"
            ? body.subscriberCount
            : undefined,
        videoCount:
          typeof body.videoCount === "number" ? body.videoCount : undefined,
      };
    } else if (channelInput.trim()) {
      resolved = await resolveYoutubeChannel(channelInput);
    } else {
      return NextResponse.json(
        { error: "Falta canal de YouTube." },
        { status: 400 }
      );
    }

    const videos = await fetchYoutubeUploads(resolved.uploadsPlaylistId, 8);

    return NextResponse.json({
      channel: {
        channelId: resolved.channelId,
        title: resolved.title,
        handle: resolved.handle,
        uploadsPlaylistId: resolved.uploadsPlaylistId,
        subscriberCount: resolved.subscriberCount,
        videoCount: resolved.videoCount,
      },
      videos,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al consultar YouTube.";
    const status = message.includes("YOUTUBE_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
