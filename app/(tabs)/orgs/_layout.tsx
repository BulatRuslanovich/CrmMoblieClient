import { Stack } from 'expo-router';
import { useTheme } from '@/constants/design';

export default function OrgsLayout() {
  const t = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerShadowVisible: false,
        headerTintColor: t.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Организации' }} />
      <Stack.Screen name="[id]" options={{ title: 'Организация' }} />
      <Stack.Screen name="create" options={{ title: 'Новая организация' }} />
    </Stack>
  );
}
