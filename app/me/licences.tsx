/**
 * You → About → Open-source licences: the libraries the app ships with and its two typefaces,
 * each with the name of its licence. The list is made from the installed packages by
 * "npm run legal" (src/legal/licences.json); the checks fail when a library is missing from it.
 */
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { licences } from '@/legal';
import { routes, useBack } from '@/lib/nav';
import { strings } from '@/strings';
import { space } from '@/theme';
import { Arrive, IconButton, ListCard, Screen, SectionHeader, Text } from '@/ui';

function Rows({ items }: { items: { name: string; licence: string }[] }) {
  return (
    <ListCard>
      {items.map((item) => (
        <View key={item.name} style={styles.row} accessible accessibilityLabel={`${item.name}, ${item.licence}`}>
          <Text variant="label">{item.name}</Text>
          <Text variant="meta" color="text.secondary">
            {item.licence}
          </Text>
        </View>
      ))}
    </ListCard>
  );
}

export default function LicencesScreen() {
  const back = useBack(routes.about);
  return (
    <Screen contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <Text variant="h1" accessibilityRole="header">
          {strings.licences.title}
        </Text>
        <Text variant="body" color="text.secondary">
          {strings.licences.sentence}
        </Text>
      </Arrive>
      <Arrive index={1} style={styles.block}>
        <SectionHeader title={strings.licences.fonts} />
        <Rows items={licences.fonts} />
      </Arrive>
      <Arrive index={2} style={styles.block}>
        <SectionHeader title={strings.licences.libraries} />
        <Rows items={licences.libraries} />
      </Arrive>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xxl },
  header: { gap: space.md },
  block: { gap: space.md },
  row: { paddingVertical: space.sm, paddingHorizontal: space.lg, gap: space.xxs / 2 },
});
