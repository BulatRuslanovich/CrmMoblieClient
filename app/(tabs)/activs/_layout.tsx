import { Stack } from 'expo-router';
import { useStackScreenOptions } from '@/constants/design';

export default function ActivsLayout() {
  const screenOptions = useStackScreenOptions();

  return (
    <Stack screenOptions={screenOptions}
    >
      <Stack.Screen name="index" options={{ title: 'Визиты' }} />
      <Stack.Screen name="[id]" options={{ title: 'Детали визита' }} />
      <Stack.Screen name="create" options={{ title: 'Новый визит' }} />
      <Stack.Screen name="edit" options={{ title: 'Редактировать визит' }} />
    </Stack>
  );
}
