/**
 * What the video player needs to know, shared by its phone version (VideoPlayer.tsx) and its
 * web version (VideoPlayer.web.tsx).
 */
import type { Video } from '../../shared/content-schema';

/** A video the app can play today: one that lives on YouTube. */
export type YouTubeVideo = Extract<Video, { provider: 'youtube' }>;

/**
 * Can this lesson's video be played in the app?
 * "file" videos (our own hosting, with offline download) arrive in a later phase: until then
 * such a lesson simply shows its cover without a play button.
 */
export function canPlay(video: Video | undefined): video is YouTubeVideo {
  return video?.provider === 'youtube';
}

/** The address of a video on YouTube itself, for "Open in YouTube". */
export function youTubeUrl(video: YouTubeVideo, seconds = 0): string {
  return `https://www.youtube.com/watch?v=${video.id}${seconds > 0 ? `&t=${seconds}s` : ''}`;
}

/** "Go to this moment". The counter makes two taps on the same step two different requests. */
export type SeekRequest = { seconds: number; count: number };

export type VideoPlayerProps = {
  video: Video;
  /** Set by the lesson when a step of the flow is tapped. */
  seek?: SeekRequest;
  /** The video cannot be shown: removed, embedding switched off, or no network. */
  onError: () => void;
};
