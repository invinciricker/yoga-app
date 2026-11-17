/**
 * Design gallery: every part of src/ui on one page, to check the look.
 * Reached from You in the preview app only. The control at the top draws the whole page in the
 * app's theme (System) or forces Light or Dark, without changing the app's setting.
 * "Show sample progress" fills the person's candles, a series, a saved lesson and an answer in
 * memory only (src/practice/demo.ts), to look at Today, Practice and You with progress in them.
 */
import { useRouter } from 'expo-router';
import { ArrowRight, Bookmark, ChevronDown, ChevronLeft, Feather, House, MapPin, Moon, Play, Wind } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useContent } from '@/content/store';
import { useWeek } from '@/day/hooks';
import { addDays, week } from '@/day/record';
import { useDays } from '@/day/store';
import { setSampleProgress } from '@/practice/demo';
import { strings } from '@/strings';
import { areas, auraNames, layout, radius, space, type, type Area, type Palette, type Scheme } from '@/theme';
import { makeStyles, ThemeScope, useTheme } from '@/theme/ThemeProvider';
import {
  AnswerChoice,
  AreaCard,
  Arrive,
  Button,
  Card,
  Chip,
  Cover,
  DoneTick,
  DraftChip,
  EmptyState,
  IconButton,
  LessonCard,
  LessonRow,
  ListCard,
  NoteCard,
  OfflineNote,
  Overline,
  PlayButton,
  RichText,
  Screen,
  SearchField,
  SectionHeader,
  SeriesCard,
  SettingsRow,
  size,
  Skeleton,
  TabBar,
  Text,
  WeekCard,
  type TabItem,
} from '@/ui';

const g = strings.gallery;

type Variant = keyof typeof type;
const variants = Object.keys(type) as Variant[];

/** Every colour of a palette (and the cover colours), flattened to "group.name" → value. */
function swatchesOf(color: Palette, onCover: Record<string, string>): { name: string; value: string }[] {
  const groups = ['bg', 'border', 'text', 'accent', 'support', 'area', 'areaSoft'] as const;
  return [
    ...groups.flatMap((group) => Object.entries(color[group]).map(([k, v]) => ({ name: `${group}.${k}`, value: v }))),
    ...Object.entries(onCover).map(([k, v]) => ({ name: `onCover.${k}`, value: v })),
    { name: 'scrim', value: color.scrim },
    { name: 'glass', value: color.glass },
    { name: 'glassBorder', value: color.glassBorder },
  ];
}

const tabItems: TabItem[] = [
  { key: 'home', label: strings.tabs.home, icon: House, area: 'home' },
  { key: 'practice', label: strings.tabs.practice, icon: Play, area: 'move' },
  { key: 'breathe', label: strings.tabs.breathe, icon: Wind, area: 'breathe' },
  { key: 'meditate', label: strings.tabs.meditate, icon: Moon, area: 'sit' },
  { key: 'journal', label: strings.tabs.journal, icon: Feather, area: 'write' },
];

const areaCards: { area: Exclude<Area, 'home'>; icon: typeof Play }[] = [
  { area: 'move', icon: Play },
  { area: 'breathe', icon: Wind },
  { area: 'sit', icon: Moon },
  { area: 'write', icon: Feather },
];

type Choice = 'system' | Scheme;
const choices: { key: Choice; label: string }[] = [
  { key: 'system', label: strings.me.system },
  { key: 'light', label: strings.me.light },
  { key: 'dark', label: strings.me.dark },
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
  const [choice, setChoice] = useState<Choice>('system');
  const page = <GalleryPage choice={choice} onChoose={setChoice} />;
  return choice === 'system' ? page : <ThemeScope scheme={choice}>{page}</ThemeScope>;
}

function GalleryPage({ choice, onChoose }: { choice: Choice; onChoose: (c: Choice) => void }) {
  const router = useRouter();
  const { color, onCover, scheme } = useTheme();
  const local = useStyles();
  const [chipOn, setChipOn] = useState(true);
  const [switchOn, setSwitchOn] = useState(true);
  const [query, setQuery] = useState('');
  const content = useContent((state) => state.content);
  const lesson = content.lessons[0];
  const series = content.series[0];
  const tip = content.journal.find((entry) => entry.kind === 'tip');
  const note = content.journal.find((entry) => entry.kind === 'note');
  const [tab, setTab] = useState('home');
  const noop = () => {};
  const sample = useDays((s) => s.sample);
  const weekCard = useWeek();
  const [answer, setAnswer] = useState<'gentle' | 'right' | 'much'>('right');
  const [feeling, setFeeling] = useState<string | undefined>('calmer');
  // A week with nothing done yet, for the card's other states (today is Wednesday 18 Nov 2026).
  const emptyWeek = week([], '2026-11-18');
  const goneOut = week([{ day: addDays('2026-11-18', -3), kind: 'move', ref: 'x', minutes: 1, at: '' }], '2026-11-18');

  return (
    <Screen contentStyle={styles.sections}>
      <Arrive style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={() => router.back()} />
        <Text variant="h1" accessibilityRole="header">
          {g.title}
        </Text>
      </Arrive>

      <Block label={`${g.theme} · ${scheme}`}>
        <View style={styles.row}>
          {choices.map((c) => (
            <Chip key={c.key} label={c.label} selected={choice === c.key} onPress={() => onChoose(c.key)} />
          ))}
        </View>
      </Block>

      <Block label={g.sample}>
        <ListCard>
          <SettingsRow label={g.sampleSwitch} line={g.sampleLine} value={sample} onValueChange={setSampleProgress} />
        </ListCard>
      </Block>

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
          {swatchesOf(color, onCover).map((s) => (
            <View key={s.name} style={styles.swatchRow}>
              <View style={[local.swatch, { backgroundColor: s.value }]} />
              <View style={styles.swatchWords}>
                <Text variant="meta">{s.name}</Text>
                <Text variant="meta" color="text.muted">
                  {s.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Block>

      <Block label={g.areaColours}>
        <View style={styles.row}>
          {areas.map((area) => (
            <Overline key={area} tone="area" area={area}>
              {area}
            </Overline>
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
        <View style={styles.row}>
          <Button label={strings.today.begin} icon={Play} iconFilled shape="pill" onPress={noop} />
          <PlayButton accessibilityLabel={strings.lesson.play} onPress={noop} />
          <Button kind="link" label={strings.today.readNote} icon={ArrowRight} onPress={noop} />
        </View>
        <Cover aura="saffron" height={size.hero.width / 2} radius="lg" style={styles.glassDemo}>
          <View style={styles.row}>
            <Button kind="glass" label={strings.home.meet(content.site.teacherFirstName)} icon={ArrowRight} onPress={noop} />
            <Button kind="glass" small label={strings.home.today} icon={ChevronDown} onPress={noop} />
          </View>
        </Cover>
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

      <Block label={g.settingsRows}>
        <ListCard>
          <SettingsRow label={g.switchRow} line={g.switchLine} value={switchOn} onValueChange={setSwitchOn} />
          <SettingsRow label={g.linkRow} onPress={noop} />
        </ListCard>
      </Block>

      <Block label={g.areaCards}>
        {areaCards.map(({ area, icon }) => (
          <AreaCard key={area} area={area} icon={icon} {...g.areaSamples[area]} onPress={noop} />
        ))}
      </Block>

      <Block label={g.weekCard}>
        <WeekCard days={weekCard.days} streak={weekCard.streak} ever={weekCard.ever} />
        <WeekCard days={goneOut} streak={0} ever />
        <WeekCard days={emptyWeek} streak={0} ever={false} />
      </Block>

      <Block label={g.choices}>
        {(['gentle', 'right', 'much'] as const).map((d) => (
          <AnswerChoice
            key={d}
            title={strings.done.difficulty[d].title}
            line={strings.done.difficulty[d].line}
            selected={answer === d}
            onPress={() => setAnswer(d)}
          />
        ))}
        <View style={styles.row}>
          {(['calmer', 'energised', 'stronger', 'tired'] as const).map((f) => (
            <Chip
              key={f}
              look="soft"
              label={strings.done.feelings[f]}
              selected={feeling === f}
              onPress={() => setFeeling(feeling === f ? undefined : f)}
            />
          ))}
        </View>
        <Button kind="danger" label={strings.deleteData.delete} onPress={noop} />
      </Block>

      <Block label={g.marks}>
        <View style={styles.row}>
          <DoneTick />
          <IconButton icon={Bookmark} accessibilityLabel={strings.lesson.unsave} active onPress={noop} />
          <Cover aura="dusk" width={size.thumb * 2} height={size.thumb} radius="md" style={styles.glassDemo}>
            <IconButton kind="glass" icon={Bookmark} accessibilityLabel={strings.lesson.unsave} active onPress={noop} />
          </Cover>
        </View>
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
            <Overline tone="cover">{g.coverOverline}</Overline>
            <Text variant="h1" color="onCover.primary">
              {g.coverTitle}
            </Text>
            <Text variant="body" color="onCover.secondary">
              {g.coverBody}
            </Text>
          </View>
        </Cover>
      </Block>

      {/* The parts that show content, drawn with the first items of the real content. */}
      {lesson ? (
        <Block label={g.lessonParts}>
          <LessonCard lesson={lesson} onPress={noop} />
          <LessonRow lesson={lesson} onPress={noop} />
          <LessonRow lesson={lesson} number={1} onPress={noop} />
        </Block>
      ) : null}
      {series ? (
        <Block label={g.seriesParts}>
          <SeriesCard series={series} large onPress={noop} />
          <SeriesCard series={series} onPress={noop} />
        </Block>
      ) : null}
      {series ? (
        <Block label={g.progress}>
          <SeriesCard series={series} large progress={{ done: 2, total: 7 }} onPress={noop} />
          <SeriesCard series={series} progress={{ done: 7, total: 7 }} onPress={noop} />
        </Block>
      ) : null}
      {tip || note ? (
        <Block label={g.notesParts}>
          {note ? <NoteCard entry={note} onPress={noop} /> : null}
          {tip ? <NoteCard entry={tip} onPress={noop} /> : null}
        </Block>
      ) : null}
      {note ? (
        <Block label={g.richText}>
          <RichText blocks={note.body} />
        </Block>
      ) : null}

      <Block label={g.search}>
        <SearchField value={query} onChangeText={setQuery} placeholder={strings.practice.search} clearLabel={strings.practice.clearSearch} />
      </Block>

      <Block label={g.states}>
        <OfflineNote />
        <DraftChip item={{ draft: true }} />
        <Skeleton height={size.thumb} radius="md" />
        <EmptyState sentence={strings.practice.noMatch} actionLabel={strings.common.clear} onAction={noop} />
      </Block>

      <Block label={g.tabBar}>
        <TabBar items={tabItems} activeKey={tab} onSelect={setTab} floating={false} />
      </Block>
    </Screen>
  );
}

const useStyles = makeStyles((color) =>
  StyleSheet.create({
    swatch: {
      width: size.swatch,
      height: size.swatch,
      borderRadius: radius.sm,
      borderWidth: size.stroke.hairline,
      borderColor: color.border.strong,
    },
  }),
);

const styles = StyleSheet.create({
  sections: { gap: layout.sectionGap },
  header: { gap: space.lg },
  block: { gap: space.md },
  typeRow: { gap: space.xxs },
  cardGap: { gap: space.xs },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.sm },
  swatchRow: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: space.sm },
  swatchWords: { flexShrink: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
  glassDemo: { alignItems: 'center', justifyContent: 'center' },
  // The row of big auras runs to the screen edges, past the gutter.
  bleed: { marginHorizontal: -layout.gutter },
  bleedContent: { paddingHorizontal: layout.gutter, gap: layout.cardGap },
  auraItem: { gap: space.xs },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  coverText: { position: 'absolute', left: space.xl, right: space.xl, bottom: space.xl, gap: space.xs },
});
