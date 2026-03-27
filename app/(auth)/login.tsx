import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth-context';
import { useTheme, palette } from '@/constants/design';

export default function LoginScreen() {
  const t = useTheme();
  const { login } = useAuth();
  const router = useRouter();

  const [loginVal, setLoginVal] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ login?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      router.replace('/');
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
      style={[s.flex, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.bgCircle1, { backgroundColor: `${palette.blue}10` }]} />
      <View style={[s.bgCircle2, { backgroundColor: `${palette.blue}07` }]} />

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.hero}>
          <View style={[s.logoRing, { backgroundColor: `${palette.blue}18` }]}>
            <View style={s.logoInner}>
              <Text style={s.logoText}>CRM</Text>
            </View>
          </View>
          <Text style={[s.heroTitle, { color: t.text }]}>Добро пожаловать</Text>
          <Text style={[s.heroSub, { color: t.sub }]}>Войдите для доступа к системе</Text>
        </View>

        <View style={[s.card, { backgroundColor: t.card }]}>

          <View style={s.fieldWrap}>
            <Text style={[s.label, { color: t.sub }]}>Логин</Text>
            <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: errors.login ? palette.red : t.border }]}>
              <Ionicons name="person-outline" size={18} color={t.placeholder} />
              <TextInput
                style={[s.input, { color: t.text }]}
                value={loginVal}
                onChangeText={(v) => { setLoginVal(v); setErrors((e) => ({ ...e, login: undefined })); }}
                placeholder="Ваш логин"
                placeholderTextColor={t.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {loginVal.length > 0 && (
                <TouchableOpacity onPress={() => setLoginVal('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={t.placeholder} />
                </TouchableOpacity>
              )}
            </View>
            {errors.login ? <Text style={s.error}>{errors.login}</Text> : null}
          </View>

          <View style={s.fieldWrap}>
            <Text style={[s.label, { color: t.sub }]}>Пароль</Text>
            <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: errors.password ? palette.red : t.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={t.placeholder} />
              <TextInput
                style={[s.input, { color: t.text }]}
                value={password}
                onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
                placeholder="Ваш пароль"
                placeholderTextColor={t.placeholder}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={t.placeholder} />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={s.error}>{errors.password}</Text> : null}
          </View>

          {apiError ? (
            <View style={[s.apiErrorWrap, { backgroundColor: `${palette.red}10`, borderColor: `${palette.red}30` }]}>
              <Ionicons name="alert-circle-outline" size={16} color={palette.red} />
              <Text style={[s.apiErrorText, { color: palette.red }]}>{apiError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={s.btnText}>Войти</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={[s.dividerLine, { backgroundColor: t.border }]} />
            <Text style={[s.dividerText, { color: t.placeholder }]}>или</Text>
            <View style={[s.dividerLine, { backgroundColor: t.border }]} />
          </View>
          
          <TouchableOpacity
            style={[s.outlineBtn, { borderColor: t.border }]}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add-outline" size={16} color={t.sub} />
            <Text style={[s.outlineBtnText, { color: t.sub }]}>Создать аккаунт</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },

  bgCircle1: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    top: -100, right: -80,
  },
  bgCircle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    bottom: 60, left: -60,
  },

  hero: { alignItems: 'center', marginBottom: 28 },
  logoRing: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  logoInner: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: palette.blue,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: palette.blue, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
  },
  logoText: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  heroTitle: { fontSize: 26, fontWeight: '700', marginBottom: 6 },
  heroSub: { fontSize: 15 },

  card: {
    borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },

  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, letterSpacing: 0.2 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, gap: 10, height: 52,
  },
  input: { flex: 1, fontSize: 15 },
  error: { color: palette.red, fontSize: 12, marginTop: 4, marginLeft: 2 },

  btn: {
    flexDirection: 'row', backgroundColor: palette.blue, borderRadius: 14,
    height: 52, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8,
    shadowColor: palette.blue, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  btnDisabled: { opacity: 0.65 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },

  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 14, height: 52,
  },
  outlineBtnText: { fontSize: 15, fontWeight: '600' },

  apiErrorWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12,
  },
  apiErrorText: { flex: 1, fontSize: 13, fontWeight: '500' },
});
