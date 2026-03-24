import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const [loginVal, setLoginVal] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ login?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  function validate(): boolean {
    const e: typeof errors = {};
    if (!loginVal.trim()) e.login = 'Введите логин';
    if (!password) e.password = 'Введите пароль';
    else if (password.length < 4) e.password = 'Минимум 4 символа';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setApiError(null);
    setLoading(true);
    try {
      await login(loginVal.trim(), password);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setApiError('Неверный логин или пароль');
      } else if (err?.request && !err?.response) {
        setApiError('Сервер недоступен. Проверьте подключение.');
      } else {
        const data = err?.response?.data;
        setApiError(String(data?.error ?? data?.message ?? 'Произошла ошибка'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[s.flex, { backgroundColor: dark ? '#0f172a' : '#f0f4ff' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.logoRing}>
            <View style={s.logoInner}>
              <Text style={s.logoText}>CRM</Text>
            </View>
          </View>
          <Text style={[s.heroTitle, { color: dark ? '#f1f5f9' : '#1e293b' }]}>
            Добро пожаловать
          </Text>
          <Text style={[s.heroSub, { color: dark ? '#94a3b8' : '#64748b' }]}>
            Войдите для доступа к системе
          </Text>
        </View>

        {/* Card */}
        <View style={[s.card, { backgroundColor: dark ? '#1e293b' : '#ffffff' }]}>
          {/* Login field */}
          <View style={s.fieldWrap}>
            <Text style={[s.label, { color: dark ? '#94a3b8' : '#64748b' }]}>Логин</Text>
            <View
              style={[
                s.inputWrap,
                {
                  backgroundColor: dark ? '#0f172a' : '#f8fafc',
                  borderColor: errors.login
                    ? '#ef4444'
                    : dark
                    ? '#334155'
                    : '#e2e8f0',
                },
              ]}
            >
              <Ionicons name="person-outline" size={18} color={dark ? '#475569' : '#94a3b8'} />
              <TextInput
                style={[s.input, { color: dark ? '#f1f5f9' : '#1e293b' }]}
                value={loginVal}
                onChangeText={setLoginVal}
                placeholder="Ваш логин"
                placeholderTextColor={dark ? '#475569' : '#94a3b8'}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.login ? <Text style={s.error}>{errors.login}</Text> : null}
          </View>

          {/* Password field */}
          <View style={s.fieldWrap}>
            <Text style={[s.label, { color: dark ? '#94a3b8' : '#64748b' }]}>Пароль</Text>
            <View
              style={[
                s.inputWrap,
                {
                  backgroundColor: dark ? '#0f172a' : '#f8fafc',
                  borderColor: errors.password
                    ? '#ef4444'
                    : dark
                    ? '#334155'
                    : '#e2e8f0',
                },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={18} color={dark ? '#475569' : '#94a3b8'} />
              <TextInput
                style={[s.input, { color: dark ? '#f1f5f9' : '#1e293b' }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Ваш пароль"
                placeholderTextColor={dark ? '#475569' : '#94a3b8'}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={dark ? '#475569' : '#94a3b8'}
                />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={s.error}>{errors.password}</Text> : null}
          </View>

          {/* API error */}
          {apiError ? (
            <View style={s.apiErrorWrap}>
              <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
              <Text style={s.apiErrorText}>{apiError}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.btnText}>Войти</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider}>
            <View style={[s.dividerLine, { backgroundColor: dark ? '#334155' : '#e2e8f0' }]} />
            <Text style={[s.dividerText, { color: dark ? '#475569' : '#94a3b8' }]}>или</Text>
            <View style={[s.dividerLine, { backgroundColor: dark ? '#334155' : '#e2e8f0' }]} />
          </View>

          {/* Register link */}
          <TouchableOpacity
            style={[s.outlineBtn, { borderColor: dark ? '#334155' : '#e2e8f0' }]}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.7}
          >
            <Text style={[s.outlineBtnText, { color: dark ? '#94a3b8' : '#64748b' }]}>
              Создать аккаунт
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },

  hero: { alignItems: 'center', marginBottom: 28 },
  logoRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#3b82f620',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoText: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  heroTitle: { fontSize: 26, fontWeight: '700', marginBottom: 6 },
  heroSub: { fontSize: 15 },

  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },

  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, letterSpacing: 0.2 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
    height: 52,
  },
  input: { flex: 1, fontSize: 15 },
  error: { color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 2 },

  btn: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.65 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },

  outlineBtn: {
    borderWidth: 1.5,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineBtnText: { fontSize: 15, fontWeight: '600' },

  apiErrorWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  apiErrorText: { flex: 1, color: '#ef4444', fontSize: 13, fontWeight: '500' },
});
