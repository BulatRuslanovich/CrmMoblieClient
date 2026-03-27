import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '@/api/auth';
import { useTheme, palette } from '@/constants/design';

export default function ForgotPasswordScreen() {
  const t = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!email.trim()) { setError('Введите email'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Некорректный email'); return false; }
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      router.push({ pathname: '/(auth)/reset-password', params: { email: email.trim() } });
    } catch (err: any) {
      if (err?.request && !err?.response) {
        setError('Сервер недоступен. Проверьте подключение.');
      } else {
        const data = err?.response?.data;
        setError(String(data?.error ?? 'Произошла ошибка'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[s.flex, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.bgCircle, { backgroundColor: `${palette.blue}10` }]} />

      <View style={s.container}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: t.card }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={t.sub} />
        </TouchableOpacity>

        <View style={[s.iconWrap, { backgroundColor: `${palette.blue}18` }]}>
          <Ionicons name="lock-open-outline" size={40} color={palette.blue} />
        </View>

        <Text style={[s.title, { color: t.text }]}>Восстановление пароля</Text>
        <Text style={[s.subtitle, { color: t.sub }]}>
          Введите email, привязанный к вашему аккаунту, и мы отправим код для сброса пароля
        </Text>

        <View style={[s.card, { backgroundColor: t.card }]}>
          <Text style={[s.label, { color: t.sub }]}>Email</Text>
          <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: error ? palette.red : t.border }]}>
            <Ionicons name="mail-outline" size={18} color={t.placeholder} />
            <TextInput
              style={[s.input, { color: t.text }]}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(null); }}
              placeholder="user@example.com"
              placeholderTextColor={t.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </View>
          {error ? (
            <View style={[s.errorWrap, { backgroundColor: `${palette.red}10`, borderColor: `${palette.red}30` }]}>
              <Ionicons name="alert-circle-outline" size={16} color={palette.red} />
              <Text style={[s.errorText, { color: palette.red }]}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={s.btnText}>Отправить код</Text>
                <Ionicons name="send-outline" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={s.loginLink} onPress={() => router.replace('/(auth)/login')}>
            <Text style={[s.loginLinkText, { color: t.sub }]}>
              Вспомнили пароль?{'  '}
              <Text style={{ color: palette.blue, fontWeight: '700' }}>Войти</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: 20 },

  bgCircle: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    top: -80, right: -60,
  },

  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-start',
    marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  iconWrap: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28, color: '#6B7280' },

  card: {
    borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, gap: 10, height: 52,
    marginBottom: 12,
  },
  input: { flex: 1, fontSize: 15 },

  errorWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: '500' },

  btn: {
    flexDirection: 'row', backgroundColor: palette.blue, borderRadius: 14,
    height: 54, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4,
    shadowColor: palette.blue, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  btnDisabled: { opacity: 0.65 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { fontSize: 14 },
});
