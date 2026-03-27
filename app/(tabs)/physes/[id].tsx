import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Linking, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette } from '@/constants/design';
import { avatarColor } from '@/utils/avatarColor';
import { physesApi } from '@/api/physes';
import type { PhysResponse } from '@/api/types';


export default function PhysDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const navigation = useNavigation();

  const [phys, setPhys] = useState<PhysResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await physesApi.getById(Number(id));
      setPhys(data);
      navigation.setOptions({ title: [data.lastName, data.firstName].filter(Boolean).join(' ') });
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить данные врача');
    } finally { setLoading(false); }
  }, [id, navigation]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <View style={[s.center, { backgroundColor: t.bg }]}>
      <ActivityIndicator size="large" color={palette.orange} />
    </View>
  );
  if (!phys) return null;

  const fullName = [phys.lastName, phys.firstName, phys.middleName].filter(Boolean).join(' ');
  const initials = [phys.lastName, phys.firstName].filter(Boolean).map((n) => n![0].toUpperCase()).join('') || '?';
  const color = avatarColor(phys.lastName);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={s.content}>
      <View style={[s.hero, { backgroundColor: t.card }]}>
        <View style={[s.heroAvatar, { backgroundColor: `${color}20` }]}>
          <Text style={[s.heroAvatarText, { color }]}>{initials}</Text>
        </View>
        <Text style={[s.heroName, { color: t.text }]}>{fullName}</Text>
        {phys.specName ? (
          <View style={[s.specBadge, { backgroundColor: `${palette.orange}15` }]}>
            <Text style={[s.specText, { color: palette.orange }]}>{phys.specName}</Text>
          </View>
        ) : null}
        {phys.position ? (
          <View style={s.posRow}>
            <Ionicons name="briefcase-outline" size={13} color={t.sub} />
            <Text style={[s.posText, { color: t.sub }]}>{phys.position}</Text>
          </View>
        ) : null}
      </View>

      {(phys.phone || phys.email) && (
        <InfoCard t={t} icon="call-outline" title="Контакты">
          {phys.phone && (
            <ContactRow
              icon="call-outline"
              value={phys.phone}
              onPress={() => Linking.openURL(`tel:${phys.phone}`)}
              color={palette.green}
              t={t}
            />
          )}
          {phys.email && (
            <ContactRow
              icon="mail-outline"
              value={phys.email}
              onPress={() => Linking.openURL(`mailto:${phys.email}`)}
              color={palette.blue}
              t={t}
              last
            />
          )}
        </InfoCard>
      )}

      {phys.orgs.length > 0 && (
        <InfoCard t={t} icon="business-outline" title="Организации">
          <View style={s.orgsGrid}>
            {phys.orgs.map((org, i) => (
              <View key={i} style={[s.orgChip, { backgroundColor: `${palette.green}12` }]}>
                <Ionicons name="business-outline" size={13} color={palette.green} />
                <Text style={[s.orgChipText, { color: t.text }]}>{org}</Text>
              </View>
            ))}
          </View>
        </InfoCard>
      )}

      <InfoCard t={t} icon="information-circle-outline" title="Дополнительно">
        <Row label="ID врача" value={`#${phys.physId}`} t={t} />
      </InfoCard>
    </ScrollView>
  );
}

function InfoCard({
  t, icon, title, children,
}: {
  t: ReturnType<typeof useTheme>;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[s.card, { backgroundColor: t.card }]}>
      <View style={s.cardHeader}>
        <Ionicons name={icon} size={14} color={t.sub} />
        <Text style={[s.cardTitle, { color: t.sub }]}>{title.toUpperCase()}</Text>
      </View>
      {children}
    </View>
  );
}

function ContactRow({
  icon, value, onPress, color, t, last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string; onPress: () => void; color: string;
  t: ReturnType<typeof useTheme>; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.contactRow, !last && { borderBottomColor: t.border, borderBottomWidth: 1 }]}
      onPress={onPress} activeOpacity={0.7}
    >
      <View style={[s.contactIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[s.contactText, { color }]}>{value}</Text>
      <Ionicons name="arrow-forward-circle-outline" size={18} color={color} />
    </TouchableOpacity>
  );
}

function Row({ label, value, t, last }: {
  label: string; value: string; t: ReturnType<typeof useTheme>; last?: boolean;
}) {
  return (
    <View style={[s.row, !last && { borderBottomColor: t.border, borderBottomWidth: 1 }]}>
      <Text style={[s.rowLabel, { color: t.sub }]}>{label}</Text>
      <Text style={[s.rowValue, { color: t.text }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, gap: 12, paddingBottom: 32 },

  hero: {
    borderRadius: 22, padding: 24, alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  heroAvatar: { width: 80, height: 80, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  heroAvatarText: { fontSize: 30, fontWeight: '800' },
  heroName: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  specBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  specText: { fontSize: 13, fontWeight: '700' },
  posRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  posText: { fontSize: 14 },

  card: {
    borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },

  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  contactIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  contactText: { flex: 1, fontSize: 15, fontWeight: '500' },

  orgsGrid: { gap: 8 },
  orgChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
  },
  orgChipText: { fontSize: 14, fontWeight: '500', flex: 1 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '600', textAlign: 'right', maxWidth: '55%' },
});
