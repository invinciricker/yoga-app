/**
 * SeriesCard: a series as a wide cover with its name on it.
 * The first one on Practice is large; the others are lower.
 * (The progress line "2 of 7 done" arrives in Phase 3, with marking lessons done.)
 */
import { StyleSheet, View } from 'react-native';

import type { Series } from '../../shared/content-schema';

import { strings } from '@/strings';
import { space } from '@/theme';

import { Cover } from './Cover';
import { DraftChip } from './DraftChip';
import { Overline } from './Overline';
import { PressableScale } from './PressableScale';
import { size } from './sizes';
import { Text } from './Text';

export type SeriesCardProps = { series: Series; onPress: () => void; large?: boolean };

export function SeriesCard({ series, onPress, large = false }: SeriesCardProps) {
  const count = strings.practice.seriesCount(series.lessons.length);
  return (
    <PressableScale onPress={onPress} accessibilityLabel={`${series.title}, ${count}`}>
      <Cover
        aura={series.aura}
        image={series.cover}
        height={large ? size.seriesCard.large : size.seriesCard.small}
        radius={large ? 'xl' : 'lg'}
        scrim
      >
        <DraftChip item={series} style={styles.draft} />
        <View style={styles.words}>
          <Overline>{count}</Overline>
          <Text variant={large ? 'h2' : 'h3'} numberOfLines={2}>
            {series.title}
          </Text>
        </View>
      </Cover>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  words: { position: 'absolute', left: space.xl, right: space.xl, bottom: space.lg, gap: space.xs },
  draft: { position: 'absolute', top: space.md, left: space.md },
});
