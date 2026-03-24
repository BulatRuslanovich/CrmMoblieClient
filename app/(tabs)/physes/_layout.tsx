import { Stack } from 'expo-router';
import { useTheme } from '@/constants/design';

export default function PhysesLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Врачи' }} />
      <Stack.Screen name="[id]" options={{ title: 'Врач' }} />
      <Stack.Screen name="create" options={{ title: 'Новый врач' }} />
    </Stack>
  );
}
