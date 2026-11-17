/**
 * VideoPlayer, web version: a plain YouTube frame, so the web preview can show a lesson's video.
 * It uses YouTube's privacy-enhanced address (youtube-nocookie.com).
 * The phone version is VideoPlayer.tsx.
 */
import { StyleSheet, View } from 'react-native';

import { color } from '@/theme';

import { size } from './sizes';
import { canPlay, type VideoPlayerProps } from './video';

export function VideoPlayer({ video, seek }: VideoPlayerProps) {
  if (!canPlay(video)) return null;
  const start = seek ? `&start=${seek.seconds}` : '';
  const src = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0${start}`;
  return (
    <View style={styles.box}>
      {/* A new key makes a new frame: that is how a tap on a step of the flow moves the video. */}
      <iframe
        key={seek?.count ?? 0}
        src={src}
        title="YouTube"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        style={{ width: '100%', height: '100%', border: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: '100%', aspectRatio: size.videoAspect, backgroundColor: color.bg.sunken },
});
