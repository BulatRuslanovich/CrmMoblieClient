import { Stack } from 'expo-router';
import { useTheme } from '@/constants/design';

export default function ActivsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Визиты' }} />
      <Stack.Screen name="[id]" options={{ title: 'Детали визита' }} />
      <Stack.Screen name="create" options={{ title: 'Новый визит' }} />
      <Stack.Screen name="edit" options={{ title: 'Редактировать визит' }} />
    </Stack>
  );
}
