/**
 * Maria's page, opened from "Meet Maria" on the billboard (docs/phases/phase-3.md, the "Studio"
 * mockup). From the top: her portrait with her name, her introduction, "Why yoga", her classes
 * with the place and the price, and how to reach her in one tap.
 *
 * The page follows the phone's theme; only the portrait stays dark, because it is a picture. Its
 * area is Home, so its overlines and small icons are gold (area.home).
 * Every block hides when its content is missing: with only a name, the page is the portrait alone.
 * The logic (days, times, links) is in src/lib/studio.ts, with its tests.
 */
import {
  ArrowRight,
  ChevronLeft,
  Feather,
  Globe,
  Heart,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Phone,
  Sparkles,
  Sun,
  Wind,
  type LucideIcon,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Studio } from '../shared/content-schema';

import { useContent } from '@/content/store';
import { nextClass, type StudioClass } from '@/lib/billboard';
import { openLink } from '@/lib/links';
import { routes, useBack } from '@/lib/nav';
import { classDays, classDetails, classTime, contactActions, mapsLink, type ContactAction, type ContactKind } from '@/lib/studio';
import { strings } from '@/strings';
import { layout, space, withAlpha } from '@/theme';
import { ThemeScope, useTheme } from '@/theme/ThemeProvider';
import {
  Arrive,
  Button,
  Card,
  Cover,
  IconButton,
  Instagram,
  ListCard,
  Overline,
  RichText,
  Screen,
  SectionHeader,
  size,
  Text,
} from '@/ui';

/** The icon of each "Why yoga" card. A word this version does not know gets the sparkles. */
const benefitIcons: Record<string, LucideIcon> = {
  moon: Moon,
  feather: Feather,
  wind: Wind,
  heart: Heart,
  sun: Sun,
  leaf: Leaf,
};

/** The icon and the words of each way to reach her. */
const contactLooks: Record<ContactKind, { icon: LucideIcon; label: (teacher: string) => string }> = {
  whatsapp: { icon: MessageCircle, label: strings.maria.message },
  email: { icon: Mail, label: () => strings.maria.email },
  phone: { icon: Phone, label: () => strings.maria.call },
  instagram: { icon: Instagram, label: () => strings.maria.instagram },
  website: { icon: Globe, label: () => strings.maria.website },
};

export default function MariaScreen() {
  const back = useBack(routes.home);
  const insets = useSafeAreaInsets();
  const content = useContent((s) => s.content);
  const studio = content.studio;
  const teacher = content.site.teacherFirstName;
  // The address of a link that would not open here, shown under the block it belongs to.
  const [notOpened, setNotOpened] = useState<{ where: 'place' | 'contact'; shown: string }>();

  const open = async (url: string, shown: string, where: 'place' | 'contact') => {
    setNotOpened(undefined);
    if (!(await openLink(url))) setNotOpened({ where, shown });
  };

  const now = new Date();
  const days = classDays(studio.classes, now);
  const next = nextClass(studio.classes, now)?.item;
  const contact = contactActions(studio.contact);
  const hasClassesBlock = days.length > 0 || !!studio.location || !!studio.pricing?.trim();

  // The blocks under the portrait, in order. A block with nothing in it is not in the list at all.
  const blocks: ReactNode[] = [];

  if (studio.body.length > 0) {
    blocks.push(<RichText key="intro" blocks={studio.body} ink="text.secondary" />);
  }

  if (studio.benefits.length > 0) {
    blocks.push(
      <View key="why" style={styles.block}>
        <SectionHeader title={strings.maria.whyYoga} />
        {/* The row runs to the right edge of the screen, past the gutter, the next card peeking. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleedRight} contentContainerStyle={styles.cards}>
          {studio.benefits.map((b, i) => (
            <Benefit key={i} icon={benefitIcons[b.icon] ?? Sparkles} title={b.title} text={b.text} />
          ))}
        </ScrollView>
      </View>,
    );
  }

  if (hasClassesBlock) {
    blocks.push(
      <View key="classes" style={styles.block}>
        <SectionHeader title={strings.maria.classesWith(teacher)} />
        {days.length > 0 ? (
          <ListCard>
            {days.flatMap((day) =>
              day.classes.map((item, i) => (
                <ClassRow
                  key={`${day.day}-${i}`}
                  // The day is written once, on its first class.
                  dayLabel={i === 0 ? day.label : undefined}
                  spokenDay={day.label}
                  item={item}
                  next={item === next}
                />
              )),
            )}
          </ListCard>
        ) : null}
        {studio.location ? (
          <Place
            location={studio.location}
            onOpen={() => void open(mapsLink(studio.location!), studio.location!.address, 'place')}
            notOpened={notOpened?.where === 'place' ? notOpened.shown : undefined}
          />
        ) : null}
        {studio.pricing?.trim() ? (
          <Text variant="body" color="text.secondary">
            {studio.pricing}
          </Text>
        ) : null}
      </View>,
    );
  }

  if (contact.main || contact.more.length > 0) {
    // The ghost buttons, two to a row.
    const pairs: ContactAction[][] = [];
    for (let i = 0; i < contact.more.length; i += 2) pairs.push(contact.more.slice(i, i + 2));
    blocks.push(
      <View key="contact" style={styles.contact}>
        {contact.main ? (
          <Button
            label={contactLooks[contact.main.kind].label(teacher)}
            icon={contactLooks[contact.main.kind].icon}
            onPress={() => void open(contact.main!.url, contact.main!.shown, 'contact')}
          />
        ) : null}
        {pairs.map((pair, i) => (
          <View key={i} style={styles.pair}>
            {pair.map((action) => (
              <Button
                key={action.kind}
                kind="ghost"
                label={contactLooks[action.kind].label(teacher)}
                icon={contactLooks[action.kind].icon}
                onPress={() => void open(action.url, action.shown, 'contact')}
                style={styles.half}
              />
            ))}
          </View>
        ))}
        {notOpened?.where === 'contact' ? <NotOpened shown={notOpened.shown} /> : null}
      </View>,
    );
  }

  return (
    <Screen bleed darkTop={size.portrait}>
      {/* The portrait: a picture, so it is the same in both themes. */}
      <ThemeScope scheme="dark">
        <Cover aura="saffron" image={studio.portrait} imagePosition="top" height={size.portrait} radius="none" scrim>
          <View style={[styles.coverTop, { top: insets.top + space.md }]}>
            <IconButton icon={ChevronLeft} kind="glass" accessibilityLabel={strings.common.back} onPress={back} />
          </View>
          <View style={styles.coverText}>
            <Overline tone="cover">{strings.maria.yourTeacher}</Overline>
            <Text variant="display" color="onCover.primary" accessibilityRole="header">
              {studio.name || teacher}
            </Text>
            {studio.tagline?.trim() ? (
              <Text variant="bodyLarge" color="onCover.secondary">
                {studio.tagline}
              </Text>
            ) : null}
          </View>
        </Cover>
      </ThemeScope>

      {blocks.length > 0 ? (
        <View style={styles.sections}>
          {blocks.map((block, i) => (
            <Arrive key={i} index={i}>
              {block}
            </Arrive>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

/** A card of "Why yoga": the icon in a soft gold disc, a title, a sentence. */
function Benefit({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  const { color } = useTheme();
  return (
    <Card style={styles.benefit}>
      <View style={[styles.disc, { backgroundColor: withAlpha(color.area.home, size.disc.alpha) }]}>
        <Icon size={size.icon.md} strokeWidth={size.stroke.regular} color={color.area.home} />
      </View>
      <Text variant="h3">{title}</Text>
      <Text variant="body" color="text.secondary">
        {text}
      </Text>
    </Card>
  );
}

type ClassRowProps = {
  /** Written only on the first class of a day. */
  dayLabel: string | undefined;
  /** Read aloud on every row, so a screen reader never loses the day. */
  spokenDay: string;
  item: StudioClass;
  /** The next class from now: it carries a small "Next". */
  next: boolean;
};

/** One class: the day and the time on the left, the name and its details on the right. */
function ClassRow({ dayLabel, spokenDay, item, next }: ClassRowProps) {
  const time = classTime(item);
  const details = classDetails(item);
  const spoken = [next ? strings.maria.next : undefined, spokenDay, time, item.name, details].filter(Boolean).join(', ');
  return (
    <View style={styles.classRow} accessible accessibilityLabel={spoken}>
      <View style={styles.classWhen}>
        {dayLabel ? <Text variant="title">{dayLabel}</Text> : null}
        <Text variant="meta" color="area.home" tabular>
          {time}
        </Text>
      </View>
      <View style={styles.classWhat}>
        {next ? <Overline tone="area">{strings.maria.next}</Overline> : null}
        <Text variant="title">{item.name}</Text>
        {details ? (
          <Text variant="meta" color="text.secondary" tabular>
            {details}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

type PlaceProps = {
  location: NonNullable<Studio['location']>;
  onOpen: () => void;
  notOpened: string | undefined;
};

/** Where the classes are: a pin, the place, its address, "Open in Maps". */
function Place({ location, onOpen, notOpened }: PlaceProps) {
  const { color } = useTheme();
  return (
    <View style={styles.place}>
      <View style={styles.pin}>
        <MapPin size={size.icon.lg} strokeWidth={size.stroke.regular} color={color.area.home} />
      </View>
      <View style={styles.placeText}>
        <Text variant="title">{location.name}</Text>
        <Text variant="body" color="text.secondary" selectable>
          {location.address}
        </Text>
        <Button kind="link" label={strings.maria.openInMaps} icon={ArrowRight} onPress={onOpen} style={styles.mapsLink} />
        {notOpened ? <NotOpened shown={notOpened} /> : null}
      </View>
    </View>
  );
}

/** One calm line when a link has nothing here to open it, then the address, to copy by hand. */
function NotOpened({ shown }: { shown: string }) {
  return (
    <View style={styles.notOpened} accessibilityLiveRegion="polite">
      <Text variant="meta" color="text.secondary">
        {strings.maria.notOpened}
      </Text>
      <Text variant="label" selectable>
        {shown}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  coverTop: { position: 'absolute', left: layout.gutter },
  coverText: { position: 'absolute', left: layout.gutter, right: layout.gutter, bottom: space.xl, gap: space.xs },

  sections: { paddingTop: space.xxl, paddingHorizontal: layout.gutter, gap: layout.sectionGap },
  block: { gap: space.md },

  // Why yoga
  bleedRight: { marginRight: -layout.gutter },
  cards: { gap: layout.cardGap, paddingRight: layout.gutter },
  benefit: { width: size.benefitCard, gap: space.sm },
  disc: {
    width: size.disc.size,
    height: size.disc.size,
    borderRadius: size.disc.size / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Classes
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  classWhen: { width: size.classDay, gap: space.xxs / 2 },
  classWhat: { flex: 1, gap: space.xxs / 2 },

  // Place
  place: { flexDirection: 'row', gap: space.sm, paddingTop: space.xxs, paddingHorizontal: space.xxs },
  pin: { paddingTop: space.xxs / 2 },
  placeText: { flex: 1, gap: space.xxs / 2 },
  mapsLink: { alignSelf: 'flex-start' },

  // Contact
  contact: { gap: layout.cardGap },
  pair: { flexDirection: 'row', gap: layout.cardGap },
  half: { flex: 1 },
  notOpened: { gap: space.xxs, paddingTop: space.xxs },
});
