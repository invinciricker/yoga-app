/**
 * You → Delete my data: a page of its own, not a system pop-up. It erases the record of the day
 * (the candles, the lessons done), the saved lessons and answers, and everything in the journal
 * from this phone: the keys ywm:days:v1, ywm:practice:v1 and every ywm:journal:v1:… key, nothing
 * else. The settings stay. Then back to Home, where every screen shows its empty state at once,
 * without a restart.
 */
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useDays } from '@/day/store';
import { useJournal } from '@/journal/store';
import { tick } from '@/lib/haptics';
import { routes, useBack } from '@/lib/nav';
import { usePractice } from '@/practice/store';
import { strings } from '@/strings';
import { space } from '@/theme';
import { Arrive, Button, IconButton, Screen, Text } from '@/ui';

export default function DeleteDataScreen() {
  const router = useRouter();
  const back = useBack(routes.me);

  const erase = () => {
    tick(); // a light tick in the hand
    // The stores empty at once (every screen follows); the phone forgets in the background.
    void useDays.getState().clear();
    void usePractice.getState().clear();
    void useJournal.getState().clear();
    if (router.canDismiss()) router.dismissAll();
    router.navigate(routes.home);
  };

  return (
    <Screen contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <Text variant="h1" accessibilityRole="header">
          {strings.deleteData.title}
        </Text>
        <Text variant="bodyLarge" color="text.secondary">
          {strings.deleteData.sentence}
        </Text>
      </Arrive>

      <Arrive index={1}>
        <View style={styles.buttons}>
          <Button kind="danger" label={strings.deleteData.delete} onPress={erase} />
          <Button kind="quiet" label={strings.deleteData.keep} onPress={back} />
        </View>
      </Arrive>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xxl },
  header: { gap: space.xl },
  buttons: { gap: space.xs },
});
