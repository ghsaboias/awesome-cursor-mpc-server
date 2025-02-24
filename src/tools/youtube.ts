import fetch from "node-fetch";
import { z } from "zod";

export const youtubeToolName = "youtube";
export const youtubeToolDescription =
    "Interact with YouTube to search videos, get video information, and retrieve transcripts.";

// Schema for the YouTube tool parameters
export const YoutubeToolSchema = z.object({
    action: z.enum(['search', 'info']),
    query: z.string().optional(),
    videoId: z.string().optional(),
    maxResults: z.number().optional().default(5)
});

function getApiKey(): string {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        throw new Error("YOUTUBE_API_KEY environment variable is not set");
    }
    return apiKey;
}

export async function runYoutubeTool(
    args: z.infer<typeof YoutubeToolSchema>
) {
    try {
        switch (args.action) {
            case 'search':
                return await searchVideos(args);
            case 'info':
                return await getVideoInfo(args);
            default:
                throw new Error(`Unknown action: ${args.action}`);
        }
    } catch (error: any) {
        return {
            content: [{
                type: "text",
                text: `Error: ${error.message || error}`
            }]
        };
    }
}

async function searchVideos(args: z.infer<typeof YoutubeToolSchema>) {
    if (!args.query) {
        throw new Error("Query is required for search action");
    }

    const params = new URLSearchParams({
        part: 'snippet',
        q: args.query,
        maxResults: args.maxResults.toString(),
        type: 'video',
        key: getApiKey()
    });

    const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${params}`
    );

    if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json() as {
        items: Array<{
            id: { videoId: string },
            snippet: {
                title: string,
                description: string,
                channelTitle: string,
                publishedAt: string
            }
        }>
    };

    const results = data.items.map((item: any) => ({
        title: item.snippet.title,
        description: item.snippet.description,
        videoId: item.id.videoId,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt
    }));

    return {
        content: [{
            type: "text",
            text: JSON.stringify(results, null, 2)
        }]
    };
}

async function getVideoInfo(args: z.infer<typeof YoutubeToolSchema>) {
    if (!args.videoId) {
        throw new Error("Video ID is required for info action");
    }

    const params = new URLSearchParams({
        part: 'snippet,statistics,contentDetails',
        id: args.videoId,
        key: getApiKey()
    });

    const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?${params}`
    );

    if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json() as {
        items?: Array<{
            snippet: {
                title: string,
                description: string,
                channelTitle: string,
                publishedAt: string
            },
            statistics: {
                viewCount: string,
                likeCount: string,
                commentCount: string
            },
            contentDetails: {
                duration: string
            }
        }>
    };

    if (!data.items || data.items.length === 0) {
        throw new Error("Video not found");
    }

    const video = data.items[0];
    const info = {
        title: video.snippet.title,
        description: video.snippet.description,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        viewCount: video.statistics.viewCount,
        likeCount: video.statistics.likeCount,
        commentCount: video.statistics.commentCount,
        duration: video.contentDetails.duration
    };

    return {
        content: [{
            type: "text",
            text: JSON.stringify(info, null, 2)
        }]
    };
} 