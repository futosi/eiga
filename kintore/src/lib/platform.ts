import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

const native = Platform.OS !== 'web';

/** Alert.alert は Web では動かないので window.confirm にフォールバックする */
export function confirm(
  title: string,
  message: string,
  onOk: () => void,
  okLabel = 'OK',
  destructive = false,
) {
  if (!native) {
    if (window.confirm(`${title}\n${message}`)) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: 'キャンセル', style: 'cancel' },
    { text: okLabel, style: destructive ? 'destructive' : 'default', onPress: onOk },
  ]);
}

export function notify(title: string, message = '') {
  if (!native) window.alert(message ? `${title}\n${message}` : title);
  else Alert.alert(title, message);
}

export function tap() {
  if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function success() {
  if (native) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

// ---- 休憩タイマーのローカル通知（アプリがバックグラウンドでも鳴らす） ----

const REST_ID = 'rest-timer';

export function setupNotifications() {
  if (!native) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: false,
    }),
  });
}

async function ensurePermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function scheduleRestNotification(seconds: number) {
  if (!native) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(REST_ID).catch(() => {});
    if (seconds < 1 || !(await ensurePermission())) return;
    await Notifications.scheduleNotificationAsync({
      identifier: REST_ID,
      content: { title: '休憩終了', body: '次のセットを始めましょう 💪', sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.round(seconds),
      },
    });
  } catch {
    // 通知が使えなくても記録機能には影響させない
  }
}

export async function cancelRestNotification() {
  if (!native) return;
  await Notifications.cancelScheduledNotificationAsync(REST_ID).catch(() => {});
}
