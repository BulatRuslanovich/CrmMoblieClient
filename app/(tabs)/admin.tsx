import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette } from '@/constants/design';
import { useAuth } from '@/store/auth-context';
import { usersApi } from '@/api/users';
import { specsApi } from '@/api/specs';
import { drugsApi } from '@/api/drugs';
import { policiesApi } from '@/api/policies';
import type { UserResponse, PolicyResponse } from '@/api/types';

type Section = 'users' | 'specs' | 'drugs';
type Theme = ReturnType<typeof useTheme>;

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

  const tabs: { key: Section; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'users', label: 'Пользователи', icon: 'people-outline' },
    { key: 'specs', label: 'Специальности', icon: 'school-outline' },
    { key: 'drugs', label: 'Препараты', icon: 'medkit-outline' },
  ];

  return (
    <View style={[s.flex, { backgroundColor: t.bg }]}>
      {/* Segment */}
      <View style={[s.segWrap, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
        {tabs.map((tab) => {
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

      {section === 'users' && <UsersSection t={t} />}
      {section === 'specs' && <SpecsSection t={t} />}
      {section === 'drugs' && <DrugsSection t={t} />}
    </View>
  );
}

/* ─── Users ─── */

function UsersSection({ t }: { t: Theme }) {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [policies, setPolicies] = useState<PolicyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [u, p] = await Promise.all([usersApi.getAll(), policiesApi.getAll()]);
      setUsers(u.data.items);
      setPolicies(p.data);
    } catch { Alert.alert('Ошибка', 'Не удалось загрузить пользователей'); }
    finally { setLoading(false); }
  }

  async function togglePolicy(userId: number, policyId: number, has: boolean) {
    const key = `${userId}-${policyId}`;
    setActionKey(key);

    try {
      if (has) {
        await usersApi.unlinkPolicy(userId, policyId);
      } else {
        await usersApi.linkPolicy(userId, policyId);
      }
      const { data } = await usersApi.getById(userId);
      setUsers((prev) => prev.map((u) => u.usrId === userId ? data : u));
    } catch (err: any) {
      Alert.alert('Ошибка', err?.response?.data?.message ?? 'Не удалось изменить роль');
    } finally { setActionKey(null); }
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator color={palette.blue} /></View>;
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(u) => String(u.usrId)}
      contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 32 }}
      renderItem={({ item: usr }) => {
        const isExpanded = expanded === usr.usrId;
        const name = [usr.firstName, usr.lastName].filter(Boolean).join(' ') || usr.login;
        const initial = (usr.firstName?.[0] ?? usr.login[0]).toUpperCase();
        return (
          <View style={[s.userCard, { backgroundColor: t.card }]}>
            <TouchableOpacity
              style={s.userHeader}
              onPress={() => setExpanded(isExpanded ? null : usr.usrId)}
              activeOpacity={0.8}
            >
              <View style={[s.userAvatar, { backgroundColor: `${palette.blue}18` }]}>
                <Text style={[s.userAvatarText, { color: palette.blue }]}>{initial}</Text>
              </View>
              <View style={s.userInfo}>
                <Text style={[s.userName, { color: t.text }]}>{name}</Text>
                <Text style={[s.userLogin, { color: t.sub }]}>@{usr.login}</Text>
              </View>
              {usr.policies.length > 0 && (
                <View style={[s.roleCount, { backgroundColor: `${palette.orange}15` }]}>
                  <Text style={[s.roleCountText, { color: palette.orange }]}>{usr.policies.length}</Text>
                </View>
              )}
              <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={t.placeholder} />
            </TouchableOpacity>

            {isExpanded && (
              <View style={[s.policiesBlock, { borderTopColor: t.border }]}>
                <Text style={[s.policiesTitle, { color: t.sub }]}>РОЛИ</Text>
                {policies.map((policy) => {
                  const has = usr.policies.includes(policy.policyName);
                  const key = `${usr.usrId}-${policy.policyId}`;
                  const busy = actionKey === key;
                  return (
                    <TouchableOpacity
                      key={policy.policyId}
                      style={s.policyRow}
                      onPress={() => !busy && togglePolicy(usr.usrId, policy.policyId, has)}
                      activeOpacity={0.7}
                      disabled={busy}
                    >
                      <View style={[
                        s.checkbox,
                        { borderColor: has ? palette.blue : t.border },
                        has && { backgroundColor: palette.blue },
                      ]}>
                        {has && <Ionicons name="checkmark" size={12} color="#fff" />}
                      </View>
                      <Text style={[s.policyName, { color: t.text }]}>{policy.policyName}</Text>
                      {busy && <ActivityIndicator size="small" color={palette.blue} style={{ marginLeft: 'auto' }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

/* ─── Specs ─── */

function SpecsSection({ t }: { t: Theme }) {
  const [specs, setSpecs] = useState<{ specId: number; specName: string }[]>([]);
  const [specName, setSpecName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSpecs(); }, []);

  async function loadSpecs() {
    try {
      const { data } = await specsApi.getAll();
      setSpecs(data);
    } catch { Alert.alert('Ошибка', 'Не удалось загрузить специальности'); }
    finally { setLoading(false); }
  }

  async function addSpec() {
    if (!specName.trim()) return;
    setSaving(true);
    try {
      const { data } = await specsApi.create(specName.trim());
      setSpecs((prev) => [...prev, data]);
      setSpecName('');
    } catch (err: any) {
      Alert.alert('Ошибка', err?.response?.data?.error ?? 'Не удалось добавить');
    } finally { setSaving(false); }
  }

  async function deleteSpec(id: number) {
    Alert.alert('Удалить специальность?', undefined, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          await specsApi.delete(id);
          setSpecs((prev) => prev.filter((sp) => sp.specId !== id));
        } catch (err: any) {
          Alert.alert('Ошибка', err?.response?.data?.error ?? 'Не удалось удалить');
        }
      }},
    ]);
  }

  return (
    <ScrollView contentContainerStyle={s.listContent}>
      <View style={[s.addRow, { backgroundColor: t.card, borderColor: t.border }]}>
        <Ionicons name="school-outline" size={18} color={t.placeholder} />
        <TextInput
          style={[s.addInput, { color: t.text }]}
          value={specName}
          onChangeText={setSpecName}
          placeholder="Название специальности"
          placeholderTextColor={t.placeholder}
          onSubmitEditing={addSpec}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: palette.blue }, (!specName.trim() || saving) && s.disabled]}
          onPress={addSpec}
          disabled={!specName.trim() || saving}
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="add" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={palette.blue} style={{ marginTop: 32 }} />
      ) : specs.length === 0 ? (
        <Text style={[s.emptyText, { color: t.sub }]}>Специальностей пока нет</Text>
      ) : (
        <View style={[s.listCard, { backgroundColor: t.card }]}>
          {specs.map((sp, i) => (
            <View
              key={sp.specId}
              style={[s.listItem, { borderBottomColor: t.border }, i < specs.length - 1 && { borderBottomWidth: 1 }]}
            >
              <View style={[s.listItemIcon, { backgroundColor: `${palette.blue}12` }]}>
                <Ionicons name="school-outline" size={15} color={palette.blue} />
              </View>
              <Text style={[s.listItemText, { color: t.text }]}>{sp.specName}</Text>
              <TouchableOpacity onPress={() => deleteSpec(sp.specId)} hitSlop={10}>
                <Ionicons name="trash-outline" size={18} color={palette.red} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/* ─── Drugs ─── */

function DrugsSection({ t }: { t: Theme }) {
  const [drugs, setDrugs] = useState<{ drugId: number; drugName: string; brand: string | null; form: string | null }[]>([]);
  const [form, setForm] = useState({ drugName: '', brand: '', form: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadDrugs(); }, []);

  async function loadDrugs() {
    try {
      const { data } = await drugsApi.getAll(0, 100);
      setDrugs(data.items);
    } catch { Alert.alert('Ошибка', 'Не удалось загрузить препараты'); }
    finally { setLoading(false); }
  }

  async function addDrug() {
    if (!form.drugName.trim()) return;
    setSaving(true);
    try {
      const { data } = await drugsApi.create({
        drugName: form.drugName.trim(),
        brand: form.brand.trim() || null,
        form: form.form.trim() || null,
        description: null,
      });
      setDrugs((prev) => [...prev, data]);
      setForm({ drugName: '', brand: '', form: '' });
    } catch (err: any) {
      Alert.alert('Ошибка', err?.response?.data?.error ?? 'Не удалось добавить');
    } finally { setSaving(false); }
  }

  async function deleteDrug(id: number) {
    Alert.alert('Удалить препарат?', undefined, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          await drugsApi.delete(id);
          setDrugs((prev) => prev.filter((d) => d.drugId !== id));
        } catch (err: any) {
          Alert.alert('Ошибка', err?.response?.data?.error ?? 'Не удалось удалить');
        }
      }},
    ]);
  }

  return (
    <ScrollView contentContainerStyle={s.listContent}>
      <View style={[s.drugForm, { backgroundColor: t.card }]}>
        {([
          { key: 'drugName' as const, placeholder: 'Название препарата *', icon: 'medkit-outline' as const },
          { key: 'brand' as const, placeholder: 'Бренд', icon: 'pricetag-outline' as const },
          { key: 'form' as const, placeholder: 'Форма выпуска', icon: 'flask-outline' as const },
        ]).map(({ key, placeholder, icon }, i) => (
          <View
            key={key}
            style={[s.drugFormField, i < 2 && { borderBottomColor: t.border, borderBottomWidth: 1 }]}
          >
            <Ionicons name={icon} size={16} color={t.placeholder} />
            <TextInput
              style={[s.addInput, { color: t.text }]}
              value={form[key]}
              onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
              placeholder={placeholder}
              placeholderTextColor={t.placeholder}
            />
          </View>
        ))}
        <TouchableOpacity
          style={[s.drugAddBtn, { backgroundColor: palette.green }, (!form.drugName.trim() || saving) && s.disabled]}
          onPress={addDrug}
          disabled={!form.drugName.trim() || saving}
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={s.drugAddBtnText}>Добавить препарат</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={palette.blue} style={{ marginTop: 32 }} />
      ) : drugs.length === 0 ? (
        <Text style={[s.emptyText, { color: t.sub }]}>Препаратов пока нет</Text>
      ) : (
        <View style={[s.listCard, { backgroundColor: t.card }]}>
          {drugs.map((d, i) => (
            <View
              key={d.drugId}
              style={[s.listItem, { borderBottomColor: t.border }, i < drugs.length - 1 && { borderBottomWidth: 1 }]}
            >
              <View style={[s.listItemIcon, { backgroundColor: `${palette.green}12` }]}>
                <Ionicons name="medkit-outline" size={15} color={palette.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.listItemText, { color: t.text }]}>{d.drugName}</Text>
                {(d.brand || d.form) && (
                  <Text style={[s.listItemSub, { color: t.sub }]}>
                    {[d.brand, d.form].filter(Boolean).join(' · ')}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => deleteDrug(d.drugId)} hitSlop={10}>
                <Ionicons name="trash-outline" size={18} color={palette.red} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  noAccessIcon: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  noAccessTitle: { fontSize: 18, fontWeight: '700' },
  noAccessSub: { fontSize: 14, textAlign: 'center' },

  segWrap: {
    flexDirection: 'row', borderBottomWidth: 1,
  },
  segBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 12, borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  segLabel: { fontSize: 12, fontWeight: '700' },

  /* Users */
  userCard: {
    borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  userHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  userAvatar: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { fontSize: 16, fontWeight: '800' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  userLogin: { fontSize: 12 },
  roleCount: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  roleCountText: { fontSize: 12, fontWeight: '800' },
  policiesBlock: { borderTopWidth: 1, padding: 14, gap: 10 },
  policiesTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 2 },
  policyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  policyName: { fontSize: 15, fontWeight: '500', flex: 1 },

  /* Common */
  listContent: { padding: 16, gap: 12, paddingBottom: 40 },
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, height: 52,
  },
  addInput: { flex: 1, fontSize: 15 },
  addBtn: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  listCard: {
    borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  listItemIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  listItemText: { fontSize: 15, fontWeight: '500', flex: 1 },
  listItemSub: { fontSize: 12, marginTop: 2 },
  emptyText: { textAlign: 'center', fontSize: 14, marginTop: 32 },
  disabled: { opacity: 0.5 },

  /* Drug form */
  drugForm: {
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  drugFormField: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 50 },
  drugAddBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 50, margin: 10, borderRadius: 12,
  },
  drugAddBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
