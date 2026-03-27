import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth-context';
import { useTheme, palette } from '@/constants/design';

type FieldKey = 'firstName' | 'lastName' | 'email' | 'phone' | 'login' | 'password' | 'confirmPassword';

const FIELDS: {
  key: FieldKey;
  label: string;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  secure?: boolean;
  keyboard?: 'default' | 'email-address' | 'phone-pad';
  required?: boolean;
}[] = [
  { key: 'lastName',        label: 'Фамилия',            placeholder: 'Иванов',           icon: 'person-outline' },
  { key: 'firstName',       label: 'Имя',                placeholder: 'Иван',             icon: 'person-outline' },
  { key: 'email',           label: 'Email',              placeholder: 'user@example.com', icon: 'mail-outline',        keyboard: 'email-address' },
  { key: 'phone',           label: 'Телефон',            placeholder: '+7 900 000 00 00', icon: 'call-outline',        keyboard: 'phone-pad' },
  { key: 'login',           label: 'Логин',              placeholder: 'user123',          icon: 'at-outline',          required: true },
  { key: 'password',        label: 'Пароль',             placeholder: '••••••',           icon: 'lock-closed-outline', secure: true, required: true },
  { key: 'confirmPassword', label: 'Подтвердите пароль', placeholder: '••••••',           icon: 'lock-closed-outline', secure: true, required: true },
];

export default function RegisterScreen() {
  const t = useTheme();
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<Record<FieldKey, string>>({
    firstName: '', lastName: '', email: '', phone: '',
    login: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [visiblePwd, setVisiblePwd] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.login.trim()) e.login = 'Обязательное поле';
    if (!form.password) e.password = 'Обязательное поле';
    else if (form.password.length < 6) e.password = 'Минимум 6 символов';
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Пароли не совпадают';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Некорректный email';
    if (form.phone && !/^\+?[\d\s\-()]{7,}$/.test(form.phone)) e.phone = 'Некорректный номер';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setApiError(null);
    setLoading(true);
    try {
      await register({
        login: form.login.trim(),
        password: form.password,
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        email: form.email || null,
        phone: form.phone || null,
      });
      router.replace('/');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        setApiError('Пользователь с таким логином или email уже существует');
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

        <View style={s.header}>
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: t.card }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={t.sub} />
          </TouchableOpacity>
          <View style={s.headerText}>
            <Text style={[s.title, { color: t.text }]}>Регистрация</Text>
            <Text style={[s.subtitle, { color: t.sub }]}>Создайте аккаунт медицинского представителя</Text>
          </View>
        </View>

        <View style={[s.card, { backgroundColor: t.card }]}>
          {FIELDS.map(({ key, label, placeholder, icon, secure, keyboard, required }) => (
            <View key={key} style={s.fieldWrap}>
              <View style={s.labelRow}>
                <Text style={[s.label, { color: t.sub }]}>{label}</Text>
                {required && <Text style={s.required}>*</Text>}
              </View>
              <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: errors[key] ? palette.red : t.border }]}>
                <Ionicons name={icon} size={18} color={t.placeholder} />
                <TextInput
                  style={[s.input, { color: t.text }]}
                  value={form[key]}
                  onChangeText={(v) => {
                    setForm((f) => ({ ...f, [key]: v }));
                    setErrors((e) => ({ ...e, [key]: undefined }));
                  }}
                  placeholder={placeholder}
                  placeholderTextColor={t.placeholder}
                  secureTextEntry={secure && !visiblePwd[key]}
                  keyboardType={keyboard ?? 'default'}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {secure && (
                  <TouchableOpacity onPress={() => setVisiblePwd((v) => ({ ...v, [key]: !v[key] }))} hitSlop={8}>
                    <Ionicons name={visiblePwd[key] ? 'eye-off-outline' : 'eye-outline'} size={18} color={t.placeholder} />
                  </TouchableOpacity>
                )}
              </View>
              {errors[key] ? <Text style={s.error}>{errors[key]}</Text> : null}
            </View>
          ))}

          {apiError ? (
            <View style={[s.apiErrorWrap, { backgroundColor: `${palette.red}10`, borderColor: `${palette.red}30` }]}>
              <Ionicons name="alert-circle-outline" size={16} color={palette.red} />
              <Text style={[s.apiErrorText, { color: palette.red }]}>{apiError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={s.btnText}>Зарегистрироваться</Text>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={s.loginLink} onPress={() => router.replace('/(auth)/login')}>
            <Text style={[s.loginLinkText, { color: t.sub }]}>
              Уже есть аккаунт?{'  '}
              <Text style={{ color: palette.blue, fontWeight: '700' }}>Войти</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20, paddingTop: 56 },

  bgCircle1: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    top: -80, right: -60,
  },
  bgCircle2: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    bottom: 80, left: -50,
  },

  header: { marginBottom: 24, gap: 16 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  headerText: { gap: 4 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 15, lineHeight: 22 },

  card: {
    borderRadius: 24, padding: 24, marginBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },

  fieldWrap: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  required: { color: palette.red, fontSize: 13, fontWeight: '700' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, gap: 10, height: 52,
  },
  input: { flex: 1, fontSize: 15 },
  error: { color: palette.red, fontSize: 12, marginTop: 4, marginLeft: 2 },

  btn: {
    flexDirection: 'row', backgroundColor: palette.blue, borderRadius: 14,
    height: 54, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8,
    shadowColor: palette.blue, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  btnDisabled: { opacity: 0.65 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  loginLink: { alignItems: 'center', marginTop: 20, paddingBottom: 8 },
  loginLinkText: { fontSize: 14 },

  apiErrorWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12,
  },
  apiErrorText: { flex: 1, fontSize: 13, fontWeight: '500' },
});
