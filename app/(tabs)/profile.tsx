import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette } from '@/constants/design';
import { useAuth } from '@/store/auth-context';
import { usersApi } from '@/api/users';
import { activsApi } from '@/api/activs';

const AVATAR_KEY = 'profile_avatar_uri';

export default function ProfileScreen() {
  const t = useTheme();
  const { user, logout, refreshUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [showPwd, setShowPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [pwdErrors, setPwdErrors] = useState<Partial<typeof pwdForm>>({});
  const [savingPwd, setSavingPwd] = useState(false);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activCount, setActivCount] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
      });
    }
    AsyncStorage.getItem(AVATAR_KEY).then(setAvatarUri);
    activsApi.getAll(1, 1).then((r) => setActivCount(r.data.totalCount ?? r.data.items.length)).catch(() => {});
  }, [user]);

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Нет доступа', 'Необходим доступ к галерее'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      const uri = res.assets[0].uri;
      setAvatarUri(uri);
      await AsyncStorage.setItem(AVATAR_KEY, uri);
    }
  }

  async function saveProfile() {
    if (!user) return;
    setSavingProfile(true);
    try {
      await usersApi.update(user.usrId, {
        firstName: form.firstName || null, lastName: form.lastName || null,
        email: form.email || null, phone: form.phone || null,
      });
      await refreshUser();
      setEditing(false);
      Alert.alert('Сохранено', 'Профиль обновлён');
    } catch (err: any) {
      Alert.alert('Ошибка', err?.response?.data?.message ?? 'Не удалось сохранить');
    } finally { setSavingProfile(false); }
  }

  function validatePwd() {
    const e: typeof pwdErrors = {};
    if (!pwdForm.oldPassword) e.oldPassword = 'Введите текущий пароль';
    if (!pwdForm.newPassword) e.newPassword = 'Введите новый пароль';
    else if (pwdForm.newPassword.length < 6) e.newPassword = 'Минимум 6 символов';
    if (pwdForm.confirm !== pwdForm.newPassword) e.confirm = 'Пароли не совпадают';
    setPwdErrors(e);
    return Object.keys(e).length === 0;
  }

  async function savePassword() {
    if (!user || !validatePwd()) return;
    setSavingPwd(true);
    try {
      await usersApi.changePassword(user.usrId, { oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword });
      setShowPwd(false);
      setPwdForm({ oldPassword: '', newPassword: '', confirm: '' });
      Alert.alert('Готово', 'Пароль изменён');
    } catch (err: any) {
      Alert.alert('Ошибка', err?.response?.data?.message ?? 'Неверный пароль');
    } finally { setSavingPwd(false); }
  }

  async function handleLogout() {
    Alert.alert('Выход', 'Вы уверены?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти', style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try { await logout(); } finally { setLoggingOut(false); }
        },
      },
    ]);
  }

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.login || '—';
  const initials = ([user?.firstName, user?.lastName].filter(Boolean).map((n) => n![0]).join('') || (user?.login?.[0] ?? '?')).toUpperCase();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={s.content}>

      {/* ── Hero ── */}
      <View style={[s.hero, { backgroundColor: palette.blue }]}>
        <View style={s.heroCircle1} />
        <View style={s.heroCircle2} />
        <View style={s.heroCircle3} />

        <TouchableOpacity style={s.avatarWrap} onPress={pickAvatar} activeOpacity={0.85}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={s.avatarImg} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Text style={s.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={s.cameraBtn}>
            <Ionicons name="camera" size={13} color={palette.blue} />
          </View>
        </TouchableOpacity>

        <Text style={s.heroName}>{displayName}</Text>
        <Text style={s.heroLogin}>@{user?.login}</Text>

        {user?.policies?.length ? (
          <View style={s.policiesRow}>
            {user.policies.map((p, i) => (
              <View key={i} style={s.policyPill}>
                <Ionicons name="shield-checkmark" size={11} color="rgba(255,255,255,0.9)" />
                <Text style={s.policyText}>{p}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* ── Stats strip (overlaps hero) ── */}
      <View style={[s.statsStrip, { backgroundColor: t.card }]}>
        <StatItem label="ID" value={`#${user?.usrId ?? '—'}`} t={t} />
        <View style={[s.stripDiv, { backgroundColor: t.border }]} />
        <StatItem label="Визитов" value={activCount !== null ? String(activCount) : '…'} t={t} />
        <View style={[s.stripDiv, { backgroundColor: t.border }]} />
        <StatItem label="Ролей" value={String(user?.policies?.length ?? 0)} t={t} />
      </View>

      {/* ── Personal info ── */}
      <SectionCard t={t}>
        <SectionHeader
          icon="person-outline" title="Личные данные" iconColor={palette.blue}
          action={!editing ? (
            <TouchableOpacity
              style={[s.editBtn, { backgroundColor: `${palette.blue}15` }]}
              onPress={() => setEditing(true)}
            >
              <Ionicons name="pencil" size={13} color={palette.blue} />
              <Text style={[s.editBtnText, { color: palette.blue }]}>Изменить</Text>
            </TouchableOpacity>
          ) : null}
          t={t}
        />

        {editing ? (
          <>
            {([
              { key: 'lastName'  as const, label: 'Фамилия',  icon: 'person-outline'  },
              { key: 'firstName' as const, label: 'Имя',       icon: 'person-outline'  },
              { key: 'email'     as const, label: 'Email',     icon: 'mail-outline',    keyboard: 'email-address' as const },
              { key: 'phone'     as const, label: 'Телефон',   icon: 'call-outline',    keyboard: 'phone-pad'     as const },
            ]).map(({ key, label, icon, keyboard }) => (
              <View key={key} style={s.formField}>
                <Text style={[s.fieldLabel, { color: t.sub }]}>{label}</Text>
                <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: t.border }]}>
                  <Ionicons name={icon as any} size={16} color={t.placeholder} />
                  <TextInput
                    style={[s.input, { color: t.text }]}
                    value={form[key]}
                    onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                    placeholder={label}
                    placeholderTextColor={t.placeholder}
                    keyboardType={keyboard ?? 'default'}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ))}
            <View style={s.editActions}>
              <TouchableOpacity style={[s.cancelBtn, { borderColor: t.border }]} onPress={() => setEditing(false)}>
                <Text style={[s.cancelBtnText, { color: t.sub }]}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, { backgroundColor: palette.blue }, savingProfile && s.disabled]}
                onPress={saveProfile} disabled={savingProfile}
              >
                {savingProfile ? <ActivityIndicator color="#fff" size="small" /> : (
                  <Text style={s.saveBtnText}>Сохранить</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <InfoRow icon="person-outline"  label="Фамилия"  value={user?.lastName  ?? '—'} t={t} />
            <InfoRow icon="person-outline"  label="Имя"      value={user?.firstName ?? '—'} t={t} />
            <InfoRow icon="mail-outline"    label="Email"    value={user?.email     ?? '—'} t={t} />
            <InfoRow icon="call-outline"    label="Телефон"  value={user?.phone     ?? '—'} t={t} last />
          </>
        )}
      </SectionCard>

      {/* ── Password ── */}
      <SectionCard t={t}>
        <TouchableOpacity style={s.sectionToggle} onPress={() => setShowPwd((v) => !v)} activeOpacity={0.7}>
          <View style={[s.sectionIconWrap, { backgroundColor: `${palette.purple}15` }]}>
            <Ionicons name="lock-closed-outline" size={16} color={palette.purple} />
          </View>
          <Text style={[s.sectionToggleText, { color: t.text }]}>Сменить пароль</Text>
          <Ionicons name={showPwd ? 'chevron-up' : 'chevron-down'} size={18} color={t.placeholder} />
        </TouchableOpacity>

        {showPwd && (
          <View style={[s.pwdBlock, { borderTopColor: t.border }]}>
            {([
              { key: 'oldPassword' as const, label: 'Текущий пароль' },
              { key: 'newPassword' as const, label: 'Новый пароль' },
              { key: 'confirm'     as const, label: 'Подтвердите пароль' },
            ]).map(({ key, label }) => (
              <View key={key} style={s.formField}>
                <Text style={[s.fieldLabel, { color: t.sub }]}>{label}</Text>
                <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: pwdErrors[key] ? palette.red : t.border }]}>
                  <Ionicons name="lock-closed-outline" size={16} color={t.placeholder} />
                  <TextInput
                    style={[s.input, { color: t.text }]}
                    value={pwdForm[key]}
                    onChangeText={(v) => setPwdForm((f) => ({ ...f, [key]: v }))}
                    placeholder="••••••"
                    placeholderTextColor={t.placeholder}
                    secureTextEntry
                  />
                </View>
                {pwdErrors[key] ? <Text style={s.errText}>{pwdErrors[key]}</Text> : null}
              </View>
            ))}
            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: palette.purple, marginHorizontal: 16, marginBottom: 16 }, savingPwd && s.disabled]}
              onPress={savePassword} disabled={savingPwd}
            >
              {savingPwd ? <ActivityIndicator color="#fff" size="small" /> : (
                <Text style={s.saveBtnText}>Изменить пароль</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SectionCard>

      {/* ── Logout ── */}
      <TouchableOpacity
        style={[s.logoutBtn, { backgroundColor: t.card, borderColor: `${palette.red}30` }, loggingOut && s.disabled]}
        onPress={handleLogout} disabled={loggingOut} activeOpacity={0.8}
      >
        {loggingOut ? <ActivityIndicator color={palette.red} size="small" /> : (
          <>
            <View style={[s.logoutIcon, { backgroundColor: `${palette.red}12` }]}>
              <Ionicons name="log-out-outline" size={18} color={palette.red} />
            </View>
            <Text style={[s.logoutText, { color: palette.red }]}>Выйти из аккаунта</Text>
            <Ionicons name="chevron-forward" size={16} color={`${palette.red}80`} />
          </>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
}

// ── Sub-components ──────────────────────────────────────────

function SectionCard({ t, children }: { t: ReturnType<typeof useTheme>; children: React.ReactNode }) {
  return <View style={[s.card, { backgroundColor: t.card }]}>{children}</View>;
}

function SectionHeader({
  icon, title, iconColor, action, t,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  iconColor: string;
  action?: React.ReactNode;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={s.sectionHeader}>
      <View style={[s.sectionIconWrap, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
      <Text style={[s.sectionTitle, { color: t.sub }]}>{title.toUpperCase()}</Text>
      {action && <View style={{ marginLeft: 'auto' }}>{action}</View>}
    </View>
  );
}

function InfoRow({ icon, label, value, t, last }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string; value: string;
  t: ReturnType<typeof useTheme>; last?: boolean;
}) {
  return (
    <View style={[s.infoRow, !last && { borderBottomColor: t.border, borderBottomWidth: 1 }]}>
      <View style={s.infoLeft}>
        <Ionicons name={icon} size={14} color={t.placeholder} />
        <Text style={[s.infoLabel, { color: t.sub }]}>{label}</Text>
      </View>
      <Text style={[s.infoValue, { color: t.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function StatItem({ label, value, t }: { label: string; value: string; t: ReturnType<typeof useTheme> }) {
  return (
    <View style={s.statItem}>
      <Text style={[s.statValue, { color: t.text }]}>{value}</Text>
      <Text style={[s.statLabel, { color: t.sub }]}>{label}</Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────

const s = StyleSheet.create({
  content: { paddingBottom: 40 },

  hero: { paddingTop: 36, paddingBottom: 40, alignItems: 'center', gap: 6, overflow: 'hidden' },
  heroCircle1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -80, right: -60,
  },
  heroCircle2: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.06)', bottom: -40, left: -30,
  },
  heroCircle3: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)', top: 20, left: 40,
  },

  avatarWrap: { position: 'relative', marginBottom: 8 },
  avatarImg: { width: 96, height: 96, borderRadius: 32 },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontSize: 36, fontWeight: '800', color: '#fff' },
  cameraBtn: {
    position: 'absolute', bottom: -2, right: -2,
    width: 28, height: 28, borderRadius: 9,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },

  heroName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  heroLogin: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  policiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  policyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  policyText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  statsStrip: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: -20,
    borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 6,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 17, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500' },
  stripDiv: { width: 1, marginVertical: 4 },

  card: {
    margin: 16, marginBottom: 0, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    overflow: 'hidden',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 12 },
  sectionIconWrap: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },

  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  editBtnText: { fontSize: 13, fontWeight: '600' },

  formField: { paddingHorizontal: 16, marginBottom: 10 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, height: 46,
  },
  input: { flex: 1, fontSize: 15 },

  editActions: { flexDirection: 'row', gap: 10, padding: 16, paddingTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, height: 46, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  saveBtn: { flex: 1, borderRadius: 12, height: 46, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  errText: { color: palette.red, fontSize: 12, marginTop: 3 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },

  sectionToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  sectionToggleText: { flex: 1, fontSize: 15, fontWeight: '600' },
  pwdBlock: { borderTopWidth: 1, paddingTop: 12 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    margin: 16, marginTop: 12, borderRadius: 20, padding: 16, borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  logoutIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoutText: { flex: 1, fontSize: 15, fontWeight: '700' },
});
