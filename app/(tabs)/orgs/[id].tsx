import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Linking, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette } from '@/constants/design';
import { orgsApi } from '@/api/orgs';
import type { OrgResponse } from '@/api/types';

export default function OrgDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const navigation = useNavigation();

  const [org, setOrg] = useState<OrgResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await orgsApi.getById(Number(id));
      setOrg(data);
      navigation.setOptions({ title: data.orgName });
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить организацию');
    } finally { setLoading(false); }
  }, [id, navigation]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <View style={[s.center, { backgroundColor: t.bg }]}>
      <ActivityIndicator size="large" color={palette.green} />
    </View>
  );
  if (!org) return null;

  const initials = org.orgName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={s.content}>
      <View style={[s.hero, { backgroundColor: t.card }]}>
        <View style={[s.heroAvatar, { backgroundColor: `${palette.green}18` }]}>
          <Text style={[s.heroAvatarText, { color: palette.green }]}>{initials}</Text>
        </View>
        <Text style={[s.heroName, { color: t.text }]}>{org.orgName}</Text>
        <View style={[s.typeBadge, { backgroundColor: `${palette.green}15` }]}>
          <Ionicons name="pricetag-outline" size={11} color={palette.green} />
          <Text style={[s.typeText, { color: palette.green }]}>{org.orgTypeName}</Text>
        </View>
      </View>

      {org.inn && (
        <InfoCard t={t} icon="document-outline" title="Реквизиты">
          <Row label="ИНН" value={org.inn} t={t} last />
        </InfoCard>
      )}

      {(org.address || org.latitude) && (
        <InfoCard t={t} icon="location-outline" title="Местоположение">
          {org.address && (
            <View style={s.addrBlock}>
              <Text style={[s.addrText, { color: t.text }]}>{org.address}</Text>
            </View>
          )}
          {org.latitude && org.longitude && (
            <TouchableOpacity
              style={[s.mapBtn, { backgroundColor: `${palette.blue}12` }]}
              onPress={() => Linking.openURL(`https://maps.google.com/?q=${org.latitude},${org.longitude}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate-outline" size={16} color={palette.blue} />
              <Text style={[s.mapBtnText, { color: palette.blue }]}>Открыть на карте</Text>
              <View style={s.coords}>
                <Text style={[s.coordsText, { color: t.sub }]}>
                  {Number(org.latitude).toFixed(4)}, {Number(org.longitude).toFixed(4)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </InfoCard>
      )}

      <InfoCard t={t} icon="information-circle-outline" title="Дополнительно">
        <Row label="ID организации" value={`#${org.orgId}`} t={t} />
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

function Row({ label, value, t, last }: {
  label: string; value: string;
  t: ReturnType<typeof useTheme>; last?: boolean;
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
  heroAvatar: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  heroAvatarText: { fontSize: 26, fontWeight: '800' },
  heroName: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  typeText: { fontSize: 12, fontWeight: '700' },

  card: {
    borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '600', textAlign: 'right', maxWidth: '55%' },

  addrBlock: { marginBottom: 12 },
  addrText: { fontSize: 15, lineHeight: 22 },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14,
  },
  mapBtnText: { fontSize: 14, fontWeight: '700', flex: 1 },
  coords: {},
  coordsText: { fontSize: 12 },
});
