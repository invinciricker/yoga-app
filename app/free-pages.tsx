/**
 * Free pages (/free-pages): the gold "New page" at the top, then the pages, newest first: the long
 * date, and the first two lines of the text. With none: "A blank page, whenever you like."
 */
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { longDay } from '@/journal/dates';
import { useJournal } from '@/journal/store';
import { freePages } from '@/journal/types';
import { routes, useBack } from '@/lib/nav';
import { strings } from '@/strings';
import { space } from '@/theme';
import { Arrive, Button, IconButton, ListCard, PressableScale, Screen, size, Text } from '@/ui';

export default function FreePagesScreen() {
  const router = useRouter();
  const back = useBack(routes.journal);
  const entries = useJournal((s) => s.entries);
  const pages = freePages(entries);

  return (
    <Screen contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <Text variant="h1" accessibilityRole="header">
          {strings.journal.freePages}
        </Text>
        <Button label={strings.journal.newPage} onPress={() => router.push(routes.freePage())} />
      </Arrive>

      <Arrive index={1}>
        {pages.length > 0 ? (
          <ListCard>
            {pages.map((page) => (
              <PressableScale
                key={page.id}
                onPress={() => router.push(routes.freePage({ entry: page.id }))}
                accessibilityLabel={`${longDay(page.day)}. ${(page.text ?? '').slice(0, 120)}`}
                style={styles.row}
              >
                <Text variant="meta" color="text.muted">
                  {longDay(page.day)}
                </Text>
                <Text variant="body" numberOfLines={2}>
                  {(page.text ?? '').trim()}
                </Text>
              </PressableScale>
            ))}
          </ListCard>
        ) : (
          <View style={styles.empty}>
            <Text variant="bodyLarge" color="text.secondary">
              {strings.journal.freeEmpty}
            </Text>
          </View>
        )}
      </Arrive>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xxl },
  header: { gap: space.xl },
  row: { minHeight: size.shelfRow, justifyContent: 'center', gap: space.xxs, paddingVertical: space.md, paddingHorizontal: space.lg },
  empty: { paddingVertical: space.md },
});
