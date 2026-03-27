import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth-context';
import { authApi } from '@/api/auth';
import { useTheme, palette } from '@/constants/design';

export default function VerifyEmailScreen() {
  const t = useTheme();
  const { confirmEmail } = useAuth();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  async function handleConfirm() {
    if (code.trim().length !== 6) {
      setError('Введите 6-значный код');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await confirmEmail(email, code.trim());
      router.replace('/');
    } catch (err: any) {
      const data = err?.response?.data;
      setError(String(data?.error ?? 'Неверный или истёкший код'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendSent(false);
    setResendLoading(true);
    try {
      await authApi.resendConfirmation(email);
      setResendSent(true);
    } catch {
      setError('Не удалось отправить код повторно');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[s.flex, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.bgCircle, { backgroundColor: `${palette.blue}10` }]} />

      <View style={s.container}>
        <View style={[s.iconWrap, { backgroundColor: `${palette.blue}18` }]}>
          <Ionicons name="mail-outline" size={40} color={palette.blue} />
        </View>

        <Text style={[s.title, { color: t.text }]}>Подтвердите email</Text>
        <Text style={[s.subtitle, { color: t.sub }]}>
          Мы отправили 6-значный код на{'\n'}
          <Text style={{ color: t.text, fontWeight: '700' }}>{email}</Text>
        </Text>

        <View style={[s.card, { backgroundColor: t.card }]}>
          <Text style={[s.label, { color: t.sub }]}>Код из письма</Text>
          <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: error ? palette.red : t.border }]}>
            <Ionicons name="key-outline" size={18} color={t.placeholder} />
            <TextInput
              style={[s.input, { color: t.text, letterSpacing: 8 }]}
              value={code}
              onChangeText={(v) => { setCode(v.replace(/\D/g, '').slice(0, 6)); setError(null); }}
              placeholder="000000"
              placeholderTextColor={t.placeholder}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>
          {error ? (
            <View style={[s.errorWrap, { backgroundColor: `${palette.red}10`, borderColor: `${palette.red}30` }]}>
              <Ionicons name="alert-circle-outline" size={16} color={palette.red} />
              <Text style={[s.errorText, { color: palette.red }]}>{error}</Text>
            </View>
          ) : null}

          {resendSent ? (
            <View style={[s.successWrap, { backgroundColor: `${palette.green ?? '#22c55e'}10`, borderColor: `${palette.green ?? '#22c55e'}30` }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color={palette.green ?? '#22c55e'} />
              <Text style={[s.errorText, { color: palette.green ?? '#22c55e' }]}>Код отправлен повторно</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={s.btnText}>Подтвердить</Text>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={s.resendBtn}
            onPress={handleResend}
            disabled={resendLoading}
          >
            {resendLoading
              ? <ActivityIndicator size="small" color={palette.blue} />
              : <Text style={[s.resendText, { color: palette.blue }]}>Отправить код повторно</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={s.backLink} onPress={() => router.replace('/(auth)/login')}>
            <Ionicons name="arrow-back-outline" size={16} color={t.sub} />
            <Text style={[s.backLinkText, { color: t.sub }]}>Вернуться к входу</Text>
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

  iconWrap: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28 },

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
  input: { flex: 1, fontSize: 22, fontWeight: '700' },

  errorWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12,
  },
  successWrap: {
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

  resendBtn: { alignItems: 'center', marginTop: 16, paddingVertical: 8 },
  resendText: { fontSize: 14, fontWeight: '600' },

  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  backLinkText: { fontSize: 14 },
});
