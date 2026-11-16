/**
 * Design gallery: every part of src/ui on one page, to check the look.
 * Reached from the bottom of Today in the preview app only.
 */
import { useRouter } from 'expo-router';
import { Bookmark, BookOpen, ChevronLeft, MapPin, Play, Sun } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { strings } from '@/strings';
import { auraNames, color, layout, radius, space, type } from '@/theme';
import {
  Arrive,
  Button,
  Card,
  Chip,
  Cover,
  IconButton,
  Overline,
  Screen,
  SectionHeader,
  size,
  TabBar,
  Text,
  type TabItem,
} from '@/ui';

const g = strings.gallery;

type Variant = keyof typeof type;
const variants = Object.keys(type) as Variant[];

// Every colour token, flattened to "group.name" → value.
const swatches: { name: string; value: string }[] = [
  ...Object.entries(color.bg).map(([k, v]) => ({ name: `bg.${k}`, value: v })),
  ...Object.entries(color.border).map(([k, v]) => ({ name: `border.${k}`, value: v })),
  ...Object.entries(color.text).map(([k, v]) => ({ name: `text.${k}`, value: v })),
  ...Object.entries(color.accent).map(([k, v]) => ({ name: `accent.${k}`, value: v })),
  ...Object.entries(color.support).map(([k, v]) => ({ name: `support.${k}`, value: v })),
  { name: 'scrim', value: color.scrim },
  { name: 'glass', value: color.glass },
  { name: 'glassBorder', value: color.glassBorder },
];

const tabItems: TabItem[] = [
  { key: 'today', label: strings.tabs.today, icon: Sun },
  { key: 'practice', label: strings.tabs.practice, icon: Play },
  { key: 'journal', label: strings.tabs.journal, icon: BookOpen },
  { key: 'studio', label: strings.tabs.studio, icon: MapPin },
];

/** One labelled block of the gallery. */
function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.block}>
      <Overline tone="muted">{label}</Overline>
      {children}
    </View>
  );
}

export default function GalleryScreen() {
  const router = useRouter();
  const [chipOn, setChipOn] = useState(true);
  const [tab, setTab] = useState('today');
  const noop = () => {};

  return (
    <Screen contentStyle={styles.sections}>
      <Arrive style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={() => router.back()} />
        <Text variant="h1" accessibilityRole="header">
          {g.title}
        </Text>
      </Arrive>

      <Block label={g.type}>
        {variants.map((v) => (
          <View key={v} style={styles.typeRow}>
            <Text variant="meta" color="text.muted">
              {v}
            </Text>
            <Text variant={v}>{g.typeSample}</Text>
          </View>
        ))}
        <View style={styles.typeRow}>
          <Text variant="meta" color="text.muted">
            display, italic
          </Text>
          <Text variant="display" italic color="text.secondary">
            {g.italicSample}
          </Text>
        </View>
      </Block>

      <Block label={g.colours}>
        <View style={styles.swatches}>
          {swatches.map((s) => (
            <View key={s.name} style={styles.swatchRow}>
              <View style={[styles.swatch, { backgroundColor: s.value }]} />
              <View>
                <Text variant="meta">{s.name}</Text>
                <Text variant="meta" color="text.muted">
                  {s.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Block>

      <Block label={g.buttons}>
        <Button label={g.primary} icon={Play} onPress={noop} />
        <Button label={g.disabled} disabled onPress={noop} />
        <Button kind="ghost" label={g.ghost} icon={MapPin} onPress={noop} />
        <Button kind="ghost" label={g.disabled} disabled onPress={noop} />
        <Button kind="quiet" label={g.quiet} onPress={noop} />
        <Button kind="quiet" label={g.disabled} disabled onPress={noop} />
      </Block>

      <Block label={g.iconButtons}>
        <View style={styles.row}>
          <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={noop} />
          <IconButton icon={Bookmark} accessibilityLabel={g.save} disabled onPress={noop} />
          <Cover aura="dusk" width={size.thumb * 2} height={size.thumb} radius="md" style={styles.glassDemo}>
            <IconButton kind="glass" icon={Bookmark} accessibilityLabel={g.save} onPress={noop} />
          </Cover>
        </View>
      </Block>

      <Block label={g.chips}>
        <View style={styles.row}>
          <Chip label={g.chipSelected} selected={chipOn} onPress={() => setChipOn(!chipOn)} />
          <Chip label={g.chipUnselected} selected={!chipOn} onPress={() => setChipOn(!chipOn)} />
          <Chip label={g.chipDisabled} disabled onPress={noop} />
          <Chip label={g.chipStatic} />
        </View>
      </Block>

      <Block label={g.card}>
        <Card style={styles.cardGap}>
          <Text variant="h3">{g.cardTitle}</Text>
          <Text variant="body" color="text.secondary">
            {g.cardBody}
          </Text>
        </Card>
        <Card padding="xl">
          <Text variant="quote">{g.italicSample}</Text>
        </Card>
      </Block>

      <Block label={g.sectionHeader}>
        <SectionHeader title={g.sectionTitle} actionLabel={strings.common.seeAll} onAction={noop} />
      </Block>

      <Block label={g.aurasHero}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.bleedContent}>
          {auraNames.map((name) => (
            <View key={name} style={styles.auraItem}>
              <Cover aura={name} width={size.hero.width} height={size.hero.height} radius="xl" />
              <Text variant="meta" color="text.muted">
                {name}
              </Text>
            </View>
          ))}
        </ScrollView>
      </Block>

      <Block label={g.aurasThumb}>
        <View style={styles.thumbs}>
          {auraNames.map((name) => (
            <View key={name} style={styles.auraItem}>
              <Cover aura={name} width={size.thumb} height={size.thumb} radius="md" />
              <Text variant="meta" color="text.muted">
                {name}
              </Text>
            </View>
          ))}
        </View>
      </Block>

      <Block label={g.cover}>
        <Cover aura="forest" height={size.hero.height} radius="xl" scrim>
          <View style={styles.coverText}>
            <Overline>{g.coverOverline}</Overline>
            <Text variant="h1">{g.coverTitle}</Text>
            <Text variant="body" color="text.secondary">
              {g.coverBody}
            </Text>
          </View>
        </Cover>
      </Block>

      <Block label={g.tabBar}>
        <TabBar items={tabItems} activeKey={tab} onSelect={setTab} floating={false} />
      </Block>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: layout.sectionGap },
  header: { gap: space.lg },
  block: { gap: space.md },
  typeRow: { gap: space.xxs },
  cardGap: { gap: space.xs },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.sm },
  swatchRow: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: space.sm },
  swatch: {
    width: size.swatch,
    height: size.swatch,
    borderRadius: radius.sm,
    borderWidth: size.stroke.hairline,
    borderColor: color.border.strong,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
  glassDemo: { alignItems: 'center', justifyContent: 'center' },
  // The row of big auras runs to the screen edges, past the gutter.
  bleed: { marginHorizontal: -layout.gutter },
  bleedContent: { paddingHorizontal: layout.gutter, gap: layout.cardGap },
  auraItem: { gap: space.xs },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  coverText: { position: 'absolute', left: space.xl, right: space.xl, bottom: space.xl, gap: space.xs },
});
