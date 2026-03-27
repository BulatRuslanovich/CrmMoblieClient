import { Stack } from 'expo-router';
import { useStackScreenOptions } from '@/constants/design';

export default function PhysesLayout() {
  const screenOptions = useStackScreenOptions();

  return (
    <Stack screenOptions={screenOptions}
    >
      <Stack.Screen name="index" options={{ title: 'Врачи' }} />
      <Stack.Screen name="[id]" options={{ title: 'Врач' }} />
      <Stack.Screen name="create" options={{ title: 'Новый врач' }} />
    </Stack>
  );
}
