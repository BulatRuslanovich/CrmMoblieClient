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
  { key: 'lastName', label: 'Фамилия', placeholder: 'Иванов', icon: 'person-outline' },
  { key: 'firstName', label: 'Имя', placeholder: 'Иван', icon: 'person-outline' },
  { key: 'email', label: 'Email', placeholder: 'user@example.com', icon: 'mail-outline', keyboard: 'email-address' },
  { key: 'phone', label: 'Телефон', placeholder: '+7 900 000 00 00', icon: 'call-outline', keyboard: 'phone-pad' },
  { key: 'login', label: 'Логин', placeholder: 'user123', icon: 'at-outline', required: true },
  { key: 'password', label: 'Пароль', placeholder: '••••••', icon: 'lock-closed-outline', secure: true, required: true },
  { key: 'confirmPassword', label: 'Подтвердите пароль', placeholder: '••••••', icon: 'lock-closed-outline', secure: true, required: true },
];

export default function RegisterScreen() {
  const [form, setForm] = useState<Record<FieldKey, string>>({
    firstName: '', lastName: '', email: '', phone: '',
    login: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [visiblePwd, setVisiblePwd] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

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
        setApiError('Пользователь с таким логином или email уже существует');  //TODO: надо разделить ошибку на логин и email, но пока так
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

  const bg = dark ? '#0f172a' : '#f0f4ff';
  const cardBg = dark ? '#1e293b' : '#ffffff';
  const borderColor = (key: FieldKey) =>
    errors[key] ? '#ef4444' : dark ? '#334155' : '#e2e8f0';
  const inputBg = dark ? '#0f172a' : '#f8fafc';

  return (
    <KeyboardAvoidingView
      style={[s.flex, { backgroundColor: bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: cardBg }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={dark ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
          <View style={s.headerText}>
            <Text style={[s.title, { color: dark ? '#f1f5f9' : '#1e293b' }]}>
              Регистрация
            </Text>
            <Text style={[s.subtitle, { color: dark ? '#94a3b8' : '#64748b' }]}>
              Создайте аккаунт медицинского представителя
            </Text>
          </View>
        </View>

        {/* Card */}
        <View style={[s.card, { backgroundColor: cardBg }]}>
          {FIELDS.map(({ key, label, placeholder, icon, secure, keyboard, required }) => (
            <View key={key} style={s.fieldWrap}>
              <View style={s.labelRow}>
                <Text style={[s.label, { color: dark ? '#94a3b8' : '#64748b' }]}>
                  {label}
                </Text>
                {required && <Text style={s.required}>*</Text>}
              </View>
              <View
                style={[
                  s.inputWrap,
                  { backgroundColor: inputBg, borderColor: borderColor(key) },
                ]}
              >
                <Ionicons name={icon} size={18} color={dark ? '#475569' : '#94a3b8'} />
                <TextInput
                  style={[s.input, { color: dark ? '#f1f5f9' : '#1e293b' }]}
                  value={form[key]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                  placeholder={placeholder}
                  placeholderTextColor={dark ? '#475569' : '#94a3b8'}
                  secureTextEntry={secure && !visiblePwd[key]}
                  keyboardType={keyboard ?? 'default'}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {secure && (
                  <TouchableOpacity
                    onPress={() => setVisiblePwd((v) => ({ ...v, [key]: !v[key] }))}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={visiblePwd[key] ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={dark ? '#475569' : '#94a3b8'}
                    />
                  </TouchableOpacity>
                )}
              </View>
              {errors[key] ? <Text style={s.error}>{errors[key]}</Text> : null}
            </View>
          ))}

          
          {apiError ? (
                     <View style={s.apiErrorWrap}>
                       <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                       <Text style={s.apiErrorText}>{apiError}</Text>
                     </View>
          ) : null}

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.btnText}>Зарегистрироваться</Text>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={s.loginLink} onPress={() => router.replace('/(auth)/login')}>
            <Text style={[s.loginLinkText, { color: dark ? '#94a3b8' : '#64748b' }]}>
              Уже есть аккаунт?{' '}
              <Text style={{ color: '#3b82f6', fontWeight: '700' }}>Войти</Text>
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

  header: { marginBottom: 24, gap: 16 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerText: { gap: 4 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 15, lineHeight: 22 },

  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },

  fieldWrap: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  required: { color: '#ef4444', fontSize: 13, fontWeight: '700' },
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
    height: 54,
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

  loginLink: { alignItems: 'center', marginTop: 20, paddingBottom: 8 },
  loginLinkText: { fontSize: 14 },

  apiErrorWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  apiErrorText: { flex: 1, color: '#ef4444', fontSize: 13, fontWeight: '500' },
});
