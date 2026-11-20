/**
 * ShelfRow: one row of a shelf (the Journal's, and Breathe's from Phase 7). A small disc (an aura,
 * or an icon in the area's colour), a title, a line ("Page 6 of 28", "In 4 · Out 6"), the draft
 * chip on a draft, and on the right a chevron, or a small ghost button ("New page") that does its
 * own thing. At least 72 high; the whole row opens its page. Put rows in a <ListCard>.
 */
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { radius, space, withAlpha, type Area, type AuraName } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

import { Button } from './Button';
import { Cover } from './Cover';
import { DraftChip } from './DraftChip';
import { PressableScale } from './PressableScale';
import { size } from './sizes';
import { Text } from './Text';

export type ShelfRowProps = {
  title: string;
  line: string;
  onPress: () => void;
  /** The disc: a journal's aura… */
  aura?: AuraName;
  /** …or an icon on the area's soft colour. */
  icon?: LucideIcon;
  area?: Area;
  /** A small button in place of the chevron. */
  action?: { label: string; onPress: () => void };
  /** What the row shows, when it may be a draft: the draft chip appears under the line (preview app only). */
  item?: { draft?: boolean };
};

export function ShelfRow({ title, line, onPress, aura, icon: Icon, area = 'write', action, item }: ShelfRowProps) {
  const { color } = useTheme();
  const ink = color.area[area];
  return (
    <PressableScale onPress={onPress} accessibilityLabel={`${title}, ${line}`} style={styles.row}>
      {aura ? (
        <Cover aura={aura} width={size.shelfDisc} height={size.shelfDisc} radius="pill" />
      ) : Icon ? (
        <View style={[styles.disc, { backgroundColor: withAlpha(ink, size.noteDisc) }]}>
          <Icon size={size.icon.md} strokeWidth={size.stroke.regular} color={ink} />
        </View>
      ) : null}
      <View style={styles.words}>
        <Text variant="title">{title}</Text>
        <Text variant="meta" color="text.secondary">
          {line}
        </Text>
        {item ? <DraftChip item={item} style={styles.draft} /> : null}
      </View>
      {action ? (
        <Button kind="ghost" small label={action.label} onPress={action.onPress} />
      ) : (
        <ChevronRight size={size.icon.md} strokeWidth={size.stroke.regular} color={color.text.muted} />
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.shelfRow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
  },
  disc: {
    width: size.shelfDisc,
    height: size.shelfDisc,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: { flex: 1, gap: space.xxs / 2 },
  draft: { marginTop: space.xxs },
});
