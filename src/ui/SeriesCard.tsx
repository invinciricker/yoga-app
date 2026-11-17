/**
 * SeriesCard: a series as a wide cover with its name on it (in the onCover colours: covers are
 * pictures, the same in both themes).
 * The first one on Practice is large; the others are lower.
 * A series begun shows a thin progress line and "2 of 7 done" under its name; a finished one says
 * "All 7 done." (the screen gives `progress`).
 */
import { StyleSheet, View } from 'react-native';

import type { Series } from '../../shared/content-schema';

import { strings } from '@/strings';
import { space } from '@/theme';

import { Cover } from './Cover';
import { DraftChip } from './DraftChip';
import { Overline } from './Overline';
import { PressableScale } from './PressableScale';
import { ProgressLine } from './ProgressLine';
import { size } from './sizes';
import { Text } from './Text';

export type SeriesCardProps = {
  series: Series;
  onPress: () => void;
  large?: boolean;
  /** Its lessons still in the content, and how many of them are done. */
  progress?: { done: number; total: number };
};

export function SeriesCard({ series, onPress, large = false, progress }: SeriesCardProps) {
  // The lessons that can still be opened (a slug gone from the content is not counted).
  const count = strings.practice.seriesCount(progress?.total ?? series.lessons.length);
  const done = progress && progress.done > 0 ? strings.series.progress(progress.done, progress.total) : undefined;
  return (
    <PressableScale onPress={onPress} accessibilityLabel={[series.title, count, done].filter(Boolean).join(', ')}>
      <Cover
        aura={series.aura}
        image={series.cover}
        height={large ? size.seriesCard.large : size.seriesCard.small}
        radius={large ? 'xl' : 'lg'}
        scrim
      >
        <DraftChip item={series} onCover style={styles.draft} />
        <View style={styles.words}>
          <Overline tone="cover">{count}</Overline>
          <Text variant={large ? 'h2' : 'h3'} color="onCover.primary" numberOfLines={2}>
            {series.title}
          </Text>
          {progress ? <ProgressLine done={progress.done} total={progress.total} /> : null}
        </View>
      </Cover>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  words: { position: 'absolute', left: space.xl, right: space.xl, bottom: space.lg, gap: space.xs },
  draft: { position: 'absolute', top: space.md, left: space.md },
});
