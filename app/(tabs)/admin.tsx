import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette } from '@/constants/design';
import { useAuth } from '@/store/auth-context';
import { UsersSection } from '@/components/admin/UsersSection';
import { SpecsSection } from '@/components/admin/SpecsSection';
import { DrugsSection } from '@/components/admin/DrugsSection';

type Section = 'users' | 'specs' | 'drugs';

const TABS: { key: Section; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'users', label: 'Пользователи', icon: 'people-outline' },
  { key: 'specs', label: 'Специальности', icon: 'school-outline' },
  { key: 'drugs', label: 'Препараты',     icon: 'medkit-outline' },
];

export default function AdminScreen() {
  const t = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.policies.includes('Admin') ?? false;
  const [section, setSection] = useState<Section>('users');

  if (!isAdmin) {
    return (
      <View style={[s.center, { backgroundColor: t.bg }]}>
        <View style={[s.noAccessIcon, { backgroundColor: `${palette.orange}12` }]}>
          <Ionicons name="shield-outline" size={40} color={palette.orange} />
        </View>
        <Text style={[s.noAccessTitle, { color: t.text }]}>Нет доступа</Text>
        <Text style={[s.noAccessSub, { color: t.sub }]}>Раздел доступен только администраторам</Text>
      </View>
    );
  }

  return (
    <View style={[s.flex, { backgroundColor: t.bg }]}>
      <View style={[s.segWrap, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
        {TABS.map((tab) => {
          const active = section === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[s.segBtn, active && { borderBottomColor: palette.blue, borderBottomWidth: 2.5 }]}
              onPress={() => setSection(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons name={tab.icon} size={15} color={active ? palette.blue : t.placeholder} />
              <Text style={[s.segLabel, { color: active ? palette.blue : t.sub }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {section === 'users' && <UsersSection />}
      {section === 'specs' && <SpecsSection />}
      {section === 'drugs' && <DrugsSection />}
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  noAccessIcon: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  noAccessTitle: { fontSize: 18, fontWeight: '700' },
  noAccessSub: { fontSize: 14, textAlign: 'center' },
  segWrap: { flexDirection: 'row', borderBottomWidth: 1 },
  segBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 12, borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  segLabel: { fontSize: 12, fontWeight: '700' },
});
