import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Alert, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette } from '@/constants/design';
import { STATUSES } from '@/constants/activs';
import { activsApi } from '@/api/activs';
import type { ActivResponse } from '@/api/types';
import { useAuth } from '@/store/auth-context';


function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function ActivDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const isAdmin = user?.policies.includes('Admin') ?? false;

  const numId = Number(id);

  const [activ, setActiv] = useState<ActivResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (isNaN(numId)) {
      router.back();
      return;
    }
    try {
      const { data } = await activsApi.getById(numId);
      setActiv(data);
      navigation.setOptions({
        title: data.orgName,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(tabs)/activs/edit', params: { id } })}
            hitSlop={8}
            style={{ marginRight: 4 }}
          >
            <Ionicons name="create-outline" size={22} color={palette.blue} />
          </TouchableOpacity>
        ),
      });
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить визит');
      router.back();
    } finally { setLoading(false); }
  }, [numId, id, navigation, router]);

  useEffect(() => { load(); }, [load]);

  async function handleOpenVisit() {
    if (!activ) return;
    setActionLoading(true);
    try {
      await activsApi.update(numId, {
        statusId: STATUSES[1].statusId, start: new Date().toISOString(),
        end: activ.end, description: activ.description, result: activ.result,
      });
      await load();
    } catch { Alert.alert('Ошибка', 'Не удалось открыть визит'); }
    finally { setActionLoading(false); }
  }

  async function handleSaveVisit() {
    if (!activ) return;
    setActionLoading(true);
    try {
      await activsApi.update(numId, {
        statusId: STATUSES[2].statusId, start: activ.start,
        end: activ.end, description: activ.description, result: activ.result,
      });
      await load();
    } catch { Alert.alert('Ошибка', 'Не удалось сохранить визит'); }
    finally { setActionLoading(false); }
  }

  async function handleCloseVisit() {
    if (!activ) return;
    setActionLoading(true);
    try {
      await activsApi.update(numId, {
        statusId: STATUSES[3].statusId, start: activ.start,
        end: new Date().toISOString(), description: activ.description, result: activ.result,
      });
      await load();
    } catch { Alert.alert('Ошибка', 'Не удалось закрыть визит'); }
    finally { setActionLoading(false); }
  }

  async function handleDelete() {
    Alert.alert('Удалить визит?', 'Это действие необратимо.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try { await activsApi.delete(numId); router.back(); }
          catch { Alert.alert('Ошибка', 'Не удалось удалить'); }
          finally { setDeleting(false); }
        },
      },
    ]);
  }

  if (loading) return (
    <View style={[s.center, { backgroundColor: t.bg }]}>
      <ActivityIndicator size="large" color={palette.blue} />
    </View>
  );
  if (!activ) return null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={s.content}>
      <View style={[s.heroCard, { backgroundColor: palette.blue }]}>
        <View style={s.heroIcon}>
          <Ionicons name="business" size={28} color={palette.blue} />
        </View>
        <Text style={s.heroOrg}>{activ.orgName}</Text>
        <View style={s.heroBadge}>
          <Text style={s.heroBadgeText}>{activ.statusName}</Text>
        </View>
        <Text style={s.heroUser}>@{activ.usrLogin}</Text>
      </View>

      <InfoCard t={t}>
        <CardHeader icon="time-outline" title="Время визита" t={t} />
        <Row label="Начало" value={fmtDate(activ.start)} t={t} />
        <Row label="Конец" value={fmtDate(activ.end)} t={t} last />
      </InfoCard>

      {activ.description ? (
        <InfoCard t={t}>
          <CardHeader icon="document-text-outline" title="Описание" t={t} />
          <Text style={[s.bodyText, { color: t.text }]}>{activ.description}</Text>
        </InfoCard>
      ) : null}

      {activ.result ? (
        <InfoCard t={t}>
          <CardHeader icon="checkmark-circle-outline" title="Результат" t={t} />
          <Text style={[s.bodyText, { color: t.text }]}>{activ.result}</Text>
        </InfoCard>
      ) : null}

      {activ.drugs.length > 0 ? (
        <InfoCard t={t}>
          <CardHeader icon="medkit-outline" title="Препараты" t={t} />
          <View style={s.drugsGrid}>
            {activ.drugs.map((d, i) => (
              <View key={i} style={[s.drugChip, { backgroundColor: `${palette.green}15` }]}>
                <Ionicons name="medical" size={12} color={palette.green} />
                <Text style={[s.drugChipText, { color: palette.green }]}>{d}</Text>
              </View>
            ))}
          </View>
        </InfoCard>
      ) : null}

      <InfoCard t={t}>
        <CardHeader icon="information-circle-outline" title="Информация" t={t} />
        <Row label="ID визита" value={`#${activ.activId}`} t={t} />
      </InfoCard>

      {activ.statusName === 'Запланирован' && (
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: palette.orange }, actionLoading && s.disabled]}
          onPress={handleOpenVisit}
          disabled={actionLoading}
          activeOpacity={0.85}
        >
          {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="play-circle" size={20} color="#fff" />
              <Text style={s.actionBtnText}>Открыть визит</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {activ.statusName === 'Открыт' && (
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnHalf, { backgroundColor: palette.purple }, actionLoading && s.disabled]}
            onPress={handleSaveVisit}
            disabled={actionLoading}
            activeOpacity={0.85}
          >
            {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Ionicons name="save" size={18} color="#fff" />
                <Text style={s.actionBtnText}>Сохранить</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnHalf, { backgroundColor: palette.green }, actionLoading && s.disabled]}
            onPress={handleCloseVisit}
            disabled={actionLoading}
            activeOpacity={0.85}
          >
            {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Ionicons name="checkmark-done-circle" size={18} color="#fff" />
                <Text style={s.actionBtnText}>Закрыть визит</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isAdmin && <TouchableOpacity
        style={[s.deleteBtn, deleting && s.disabled]}
        onPress={handleDelete}
        disabled={deleting}
        activeOpacity={0.85}
      >
        {deleting ? <ActivityIndicator color="#fff" size="small" /> : (
          <>
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={s.deleteBtnText}>Удалить визит</Text>
          </>
        )}
      </TouchableOpacity>}
    </ScrollView>
  );
}

function InfoCard({ t, children }: { t: ReturnType<typeof useTheme>; children: React.ReactNode }) {
  return (
    <View style={[s.card, { backgroundColor: t.card }]}>
      {children}
    </View>
  );
}

function CardHeader({
  icon, title, t,
}: { icon: keyof typeof Ionicons.glyphMap; title: string; t: ReturnType<typeof useTheme> }) {
  return (
    <View style={s.cardHeader}>
      <Ionicons name={icon} size={15} color={t.sub} />
      <Text style={[s.cardHeaderText, { color: t.sub }]}>{title.toUpperCase()}</Text>
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
  content: { padding: 16, gap: 12, paddingBottom: 100 },

  heroCard: { borderRadius: 22, padding: 24, alignItems: 'center', gap: 8 },
  heroIcon: {
    width: 58, height: 58, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  heroOrg: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
  },
  heroBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  heroUser: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },

  card: {
    borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  cardHeaderText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '600', textAlign: 'right', maxWidth: '58%' },
  bodyText: { fontSize: 15, lineHeight: 22 },

  drugsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  drugChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  drugChipText: { fontSize: 13, fontWeight: '600' },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    borderRadius: 16, height: 52,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  actionBtnHalf: { flex: 1 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  deleteBtn: {
    backgroundColor: palette.red, borderRadius: 16, height: 52,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: palette.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  disabled: { opacity: 0.6 },
  deleteBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
