/**
 * You → About: the app's name, who it is for, the "look after yourself" notice (Google expects one
 * in a fitness app, so it stays easy to find), which copy of the app this is, the welcome again,
 * and the open-source licences.
 */
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useContent } from '@/content/store';
import { buildInfo } from '@/lib/buildInfo';
import { routes, useBack } from '@/lib/nav';
import { usePrefs } from '@/lib/prefs';
import { isPreview } from '@/lib/variant';
import { versionLines } from '@/lib/version';
import { strings } from '@/strings';
import { space } from '@/theme';
import { Arrive, Button, Card, IconButton, ListCard, Screen, SettingsRow, Text } from '@/ui';

// Which copy of the app this is does not change while it runs.
const version = versionLines(buildInfo(), isPreview);

export default function AboutScreen() {
  const router = useRouter();
  const back = useBack(routes.me);
  const site = useContent((s) => s.content.site);

  const welcomeAgain = () => {
    usePrefs.getState().forgetWelcome();
    router.push(routes.welcome);
  };

  return (
    <Screen contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <View style={styles.title}>
          <Text variant="h1" accessibilityRole="header">
            {site.appName}
          </Text>
          <Text variant="bodyLarge" color="text.secondary">
            {strings.about.sentence(site.teacherFirstName)}
          </Text>
        </View>
      </Arrive>

      <Arrive index={1}>
        <Card padding="xl" style={styles.care}>
          <Text variant="h3" accessibilityRole="header">
            {strings.about.careTitle}
          </Text>
          <Text variant="body" color="text.secondary">
            {strings.about.care}
          </Text>
        </Card>
      </Arrive>

      <Arrive index={2} style={styles.block}>
        <View style={styles.version} accessible>
          {version.map((line, i) => (
            <Text key={i} variant="meta" color={i === 0 ? 'text.primary' : 'text.secondary'} tabular selectable>
              {line}
            </Text>
          ))}
        </View>
        <Button kind="quiet" label={strings.about.welcomeAgain} onPress={welcomeAgain} style={styles.quiet} />
      </Arrive>

      <Arrive index={3}>
        <ListCard>
          <SettingsRow label={strings.about.licences} onPress={() => router.push(routes.licences)} />
        </ListCard>
      </Arrive>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xxl },
  header: { gap: space.xl },
  title: { gap: space.sm },
  care: { gap: space.sm },
  block: { gap: space.xs },
  version: { gap: space.xxs / 2 },
  // The quiet button's words line up with the text above.
  quiet: { alignSelf: 'flex-start', marginLeft: -space.md },
});
