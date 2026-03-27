import { Tabs } from 'expo-router';
import { useTheme, palette } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { useAuth } from '@/store/auth-context';

export default function TabLayout() {
  const t = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.policies.includes('Admin') ?? false;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.blue,
        tabBarInactiveTintColor: t.placeholder,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 28 : 12,
          marginHorizontal: 16,
          backgroundColor: t.card,
          borderRadius: 24,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: t.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: t.bg },
        headerShadowVisible: false,
        headerTintColor: t.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="activs"
        options={{
          title: 'Визиты',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'clipboard' : 'clipboard-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="orgs"
        options={{
          title: 'Организации',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'business' : 'business-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="physes"
        options={{
          title: 'Врачи',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'people' : 'people-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Админ',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} color={color} focused={focused} />
          ),
          tabBarActiveTintColor: palette.orange,
          tabBarButton: isAdmin ? undefined : () => null,
          tabBarItemStyle: isAdmin ? undefined : { display: 'none', width: 0 },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'person-circle' : 'person-circle-outline'} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}) {
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: focused ? `${color}20` : 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}
