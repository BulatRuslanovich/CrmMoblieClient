import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '@/api/auth';
import { useTheme, palette } from '@/constants/design';

export default function ResetPasswordScreen() {
  const t = useTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ code?: string; password?: string; confirm?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (code.trim().length !== 6) e.code = 'Введите 6-значный код';
    if (!password) e.password = 'Введите пароль';
    else if (password.length < 6) e.password = 'Минимум 6 символов';
    if (password !== confirmPassword) e.confirm = 'Пароли не совпадают';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleReset() {
    if (!validate()) return;
    setApiError(null);
    setLoading(true);
    try {
      await authApi.resetPassword(email, code.trim(), password);
      setSuccess(true);
    } catch (err: any) {
      const data = err?.response?.data;
      setApiError(String(data?.error ?? 'Неверный или истёкший код'));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={[s.flex, { backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <View style={[s.iconWrap, { backgroundColor: '#22c55e18' }]}>
          <Ionicons name="checkmark-circle-outline" size={48} color="#22c55e" />
        </View>
        <Text style={[s.title, { color: t.text }]}>Пароль изменён</Text>
        <Text style={[s.subtitle, { color: t.sub }]}>Теперь вы можете войти с новым паролем</Text>
        <TouchableOpacity
          style={[s.btn, { marginTop: 32 }]}
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={s.btnText}>Войти</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[s.flex, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.bgCircle, { backgroundColor: `${palette.blue}10` }]} />

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: t.card }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={t.sub} />
        </TouchableOpacity>

        <View style={[s.iconWrap, { backgroundColor: `${palette.blue}18` }]}>
          <Ionicons name="shield-checkmark-outline" size={40} color={palette.blue} />
        </View>

        <Text style={[s.title, { color: t.text }]}>Новый пароль</Text>
        <Text style={[s.subtitle, { color: t.sub }]}>
          Введите код из письма и придумайте новый пароль
        </Text>

        <View style={[s.card, { backgroundColor: t.card }]}>

          <View style={s.fieldWrap}>
            <Text style={[s.label, { color: t.sub }]}>Код из письма</Text>
            <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: errors.code ? palette.red : t.border }]}>
              <Ionicons name="key-outline" size={18} color={t.placeholder} />
              <TextInput
                style={[s.input, { color: t.text, letterSpacing: 8 }]}
                value={code}
                onChangeText={(v) => { setCode(v.replace(/\D/g, '').slice(0, 6)); setErrors(e => ({ ...e, code: undefined })); }}
                placeholder="000000"
                placeholderTextColor={t.placeholder}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            {errors.code ? <Text style={s.error}>{errors.code}</Text> : null}
          </View>

          <View style={s.fieldWrap}>
            <Text style={[s.label, { color: t.sub }]}>Новый пароль</Text>
            <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: errors.password ? palette.red : t.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={t.placeholder} />
              <TextInput
                style={[s.input, { color: t.text }]}
                value={password}
                onChangeText={(v) => { setPassword(v); setErrors(e => ({ ...e, password: undefined })); }}
                placeholder="••••••"
                placeholderTextColor={t.placeholder}
                secureTextEntry={!showPwd}
              />
              <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={8}>
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={t.placeholder} />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={s.error}>{errors.password}</Text> : null}
          </View>

          <View style={s.fieldWrap}>
            <Text style={[s.label, { color: t.sub }]}>Повторите пароль</Text>
            <View style={[s.inputWrap, { backgroundColor: t.inputBg, borderColor: errors.confirm ? palette.red : t.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={t.placeholder} />
              <TextInput
                style={[s.input, { color: t.text }]}
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setErrors(e => ({ ...e, confirm: undefined })); }}
                placeholder="••••••"
                placeholderTextColor={t.placeholder}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity onPress={() => setShowConfirm(v => !v)} hitSlop={8}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={t.placeholder} />
              </TouchableOpacity>
            </View>
            {errors.confirm ? <Text style={s.error}>{errors.confirm}</Text> : null}
          </View>

          {apiError ? (
            <View style={[s.errorWrap, { backgroundColor: `${palette.red}10`, borderColor: `${palette.red}30` }]}>
              <Ionicons name="alert-circle-outline" size={16} color={palette.red} />
              <Text style={[s.errorText, { color: palette.red }]}>{apiError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleReset}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={s.btnText}>Сбросить пароль</Text>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },

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
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28 },

  card: {
    borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },
  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, gap: 10, height: 52,
  },
  input: { flex: 1, fontSize: 15 },
  error: { color: palette.red, fontSize: 12, marginTop: 4, marginLeft: 2 },

  errorWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: '500' },

  btn: {
    flexDirection: 'row', backgroundColor: palette.blue, borderRadius: 14,
    height: 54, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8,
    shadowColor: palette.blue, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  btnDisabled: { opacity: 0.65 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
