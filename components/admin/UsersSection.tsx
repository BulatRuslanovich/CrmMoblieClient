import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette, TAB_BAR_CLEARANCE } from '@/constants/design';
import { usersApi } from '@/api/users';
import { policiesApi } from '@/api/policies';
import type { UserResponse, PolicyResponse } from '@/api/types';

export function UsersSection() {
  const t = useTheme();
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
      contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: TAB_BAR_CLEARANCE }}
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

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  policyName: { fontSize: 15, fontWeight: '500', flex: 1 },
});
