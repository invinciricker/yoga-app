/**
 * VideoPlayer: plays the video of a lesson, in place of its cover.
 *
 * It takes the "video" value from the content and looks at its provider:
 *   youtube  played with YouTube's own player inside a small web view;
 *   file     not built yet (later phase): nothing is drawn.
 * It starts playing as soon as it appears (it only appears after the person pressed play),
 * keeps the screen awake while the video runs, and tells the lesson when the video cannot play and
 * when it reaches its end (the lesson then opens its closing screen).
 *
 * This is the phone version. The web preview uses VideoPlayer.web.tsx.
 */
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import YoutubePlayer, { type YoutubeIframeRef } from 'react-native-youtube-iframe';

import { makeStyles } from '@/theme/ThemeProvider';

import { size } from './sizes';
import { canPlay, type VideoPlayerProps } from './video';

const AWAKE_TAG = 'ywm-video'; // our own tag, so we never switch off someone else's request

export function VideoPlayer({ video, seek, onError, onEnd }: VideoPlayerProps) {
  const styles = useStyles();
  const player = useRef<YoutubeIframeRef>(null);
  const [width, setWidth] = useState(0);
  const [ready, setReady] = useState(false);
  // True while the video really runs (YouTube tells us).
  const [running, setRunning] = useState(false);
  // When the person pauses with YouTube's own button, we remember which "go to" request was the
  // last one at that moment. A newer request (a tap on a step of the flow) means: play again.
  const [pausedAtCount, setPausedAtCount] = useState<number | null>(null);
  const seekCount = seek?.count ?? 0;
  const play = pausedAtCount === null || pausedAtCount !== seekCount;

  // Keep the screen awake while the video really runs, and let it sleep again afterwards.
  useEffect(() => {
    if (!running) return;
    activateKeepAwakeAsync(AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(AWAKE_TAG).catch(() => {});
    };
  }, [running]);

  // A step of the flow was tapped: go there (as soon as the player is ready).
  useEffect(() => {
    if (ready && seek) player.current?.seekTo(seek.seconds, true);
  }, [ready, seek]);

  const onChangeState = useCallback(
    (state: string) => {
      if (state === 'playing') {
        setRunning(true);
        setPausedAtCount(null);
      } else if (state === 'paused' || state === 'ended') {
        setRunning(false);
        setPausedAtCount(seekCount);
        if (state === 'ended') onEnd?.();
      }
    },
    [seekCount, onEnd],
  );

  if (!canPlay(video)) return null;

  return (
    <View style={styles.box} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <YoutubePlayer
          ref={player}
          width={width}
          height={width / size.videoAspect}
          videoId={video.id}
          play={play}
          onReady={() => setReady(true)}
          onChangeState={onChangeState}
          onError={onError}
          initialPlayerParams={{ rel: false, modestbranding: true }}
          webViewProps={{
            // The page itself could not load: no network, most of the time.
            onError,
            onHttpError: onError,
            renderError: () => <View style={[StyleSheet.absoluteFill, styles.blank]} />,
          }}
        />
      ) : null}
    </View>
  );
}

// The player is always dark: the lesson draws it inside <ThemeScope scheme="dark">.
const useStyles = makeStyles((color) =>
  StyleSheet.create({
    // 16:9, square corners, on the darkest ground (the letterbox).
    box: { width: '100%', aspectRatio: size.videoAspect, backgroundColor: color.bg.sunken },
    blank: { backgroundColor: color.bg.sunken },
  }),
);
