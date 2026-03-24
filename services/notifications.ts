import { Platform } from 'react-native';

async function getNotifications() {
  if (Platform.OS === 'web') return null;
  return import('expo-notifications');
}

export async function setupNotificationHandler(): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleActivityReminder(
  orgName: string,
  startDate: Date
): Promise<string | null> {
  const Notifications = await getNotifications();
  if (!Notifications) return null;
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  const trigger = new Date(startDate);
  trigger.setMinutes(trigger.getMinutes() - 30);
  if (trigger <= new Date()) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Напоминание о визите',
      body: `Через 30 минут у вас визит в "${orgName}"`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
    },
  });
  return id;
}

export async function sendInstantNotification(title: string, body: string): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}
