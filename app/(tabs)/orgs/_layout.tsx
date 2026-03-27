import { Stack } from 'expo-router';
import { useStackScreenOptions } from '@/constants/design';

export default function OrgsLayout() {
  const screenOptions = useStackScreenOptions();

  return (
    <Stack screenOptions={screenOptions}
    >
      <Stack.Screen name="index" options={{ title: 'Организации' }} />
      <Stack.Screen name="[id]" options={{ title: 'Организация' }} />
      <Stack.Screen name="create" options={{ title: 'Новая организация' }} />
    </Stack>
  );
}
