// setting 파일로 분리했음 지워도 됨!
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const THEME = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  textMain: '#191F28',
  textSub: '#8B95A1',
  textMuted: '#B0B8C1',
  border: '#F2F4F6',
  primary: '#3182F6',
  primaryLight: '#EBF3FF',
  primaryDark: '#1B64DA',
  danger: '#F04452',
  dangerLight: '#FFF0F1',
  success: '#05C072',
  successLight: '#E8FAF3',
  warning: '#FF9500',
  warningLight: '#FFF5E6',
  divider: '#E5E8EB',
};

// ─── Icons (emoji/text fallback for RN without react-native-svg) ──────────────
const IconMap = {
  back: '‹',
  chevronRight: '›',
  user: '👤',
  lock: '🔒',
  bell: '🔔',
  help: '❓',
  info: 'ℹ️',
  logout: '🚪',
  camera: '📷',
  check: '✓',
  eye: '👁',
  eyeOff: '🙈',
  message: '💬',
  star: '⭐',
  bug: '🐛',
  globe: '🌐',
  shield: '🛡',
  phone: '📞',
  moon: '🌙',
};

const Icon = ({ name, size = 18, color = THEME.primary, style }) => {
  const isArrow = name === 'back' || name === 'chevronRight';
  return (
    <Text style={[
      {
        fontSize: isArrow ? size + 8 : size,
        color,
        lineHeight: isArrow ? size + 12 : size + 4,
        textAlign: 'center',
      },
      style,
    ]}>
      {IconMap[name] || '•'}
    </Text>
  );
};

// ─── Toggle (using RN Switch) ─────────────────────────────────────────────────
const Toggle = ({ value, onChange }) => (
  <Switch
    value={value}
    onValueChange={onChange}
    trackColor={{ false: '#E5E8EB', true: THEME.primary }}
    thumbColor="#ffffff"
    ios_backgroundColor="#E5E8EB"
  />
);

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = ({ title, onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.headerBackBtn}>
      <Icon name="back" size={22} color={THEME.textMain} />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={{ width: 40 }} />
  </View>
);

// ─── InputField ───────────────────────────────────────────────────────────────
const InputField = ({ label, value, onChange, placeholder, secureTextEntry = false, hint }) => {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={{ position: 'relative' }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={THEME.textMuted}
          secureTextEntry={secureTextEntry && !show}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            { borderColor: focused ? THEME.primary : THEME.divider },
            secureTextEntry && { paddingRight: 48 },
          ]}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShow(!show)}
            style={styles.eyeBtn}
          >
            <Icon name={show ? 'eyeOff' : 'eye'} size={16} color={THEME.textSub} />
          </TouchableOpacity>
        )}
      </View>
      {!!hint && (
        <Text style={[
          styles.inputHint,
          { color: hint.startsWith('✓') ? THEME.success : THEME.danger },
        ]}>
          {hint}
        </Text>
      )}
    </View>
  );
};

// ─── PrimaryBtn ───────────────────────────────────────────────────────────────
const PrimaryBtn = ({ label, onPress, disabled, danger }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      styles.primaryBtn,
      danger && { backgroundColor: THEME.danger },
      disabled && { backgroundColor: THEME.border },
    ]}
    activeOpacity={0.85}
  >
    <Text style={[styles.primaryBtnText, disabled && { color: THEME.textMuted }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── SCREEN: Profile Edit ─────────────────────────────────────────────────────
const ProfileEditScreen = ({ onBack }) => {
  const [name, setName] = useState('김민준');
  const [email, setEmail] = useState('minjun@email.com');
  const [bio, setBio] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={styles.screen}>
      <Header title="프로필 수정" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{name[0] || '?'}</Text>
            <View style={styles.cameraBtn}>
              <Icon name="camera" size={12} color="#fff" />
            </View>
          </View>
          <Text style={styles.changePhotoText}>사진 변경</Text>
        </View>

        <InputField label="이름" value={name} onChange={setName} placeholder="이름을 입력하세요" />
        <InputField label="이메일" value={email} onChange={setEmail} placeholder="이메일을 입력하세요" hint="이메일은 로그인 ID로 사용됩니다" />

        <View style={{ marginBottom: 18 }}>
          <Text style={styles.inputLabel}>소개</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="나를 소개해보세요 (선택)"
            placeholderTextColor={THEME.textMuted}
            multiline
            numberOfLines={3}
            style={styles.textarea}
          />
          <Text style={styles.charCount}>{bio.length}/100</Text>
        </View>

        <PrimaryBtn label={saved ? '✓ 저장됨' : '변경사항 저장'} onPress={handleSave} />
      </ScrollView>
    </View>
  );
};

// ─── SCREEN: Password Change ──────────────────────────────────────────────────
const PasswordScreen = ({ onBack }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const isMatch = next && confirm && next === confirm;
  const isStrong = next.length >= 8;
  const canSubmit = current && isMatch && isStrong;

  const strength = next.length === 0 ? 0 : next.length < 6 ? 1 : next.length < 10 ? 2 : 3;
  const strengthLabel = ['', '약함', '보통', '강함'][strength];
  const strengthColor = ['', THEME.danger, THEME.warning, THEME.success][strength];

  const confirmHint = confirm
    ? isMatch ? '✓ 비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'
    : '';

  return (
    <View style={styles.screen}>
      <Header title="비밀번호 변경" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoBanner}>
          <Icon name="shield" size={18} color={THEME.primary} />
          <Text style={styles.infoBannerText}>
            보안을 위해 주기적으로 비밀번호를 변경해주세요.{'\n'}
            영문, 숫자, 특수문자 조합 8자 이상을 권장합니다.
          </Text>
        </View>

        <InputField
          label="현재 비밀번호"
          value={current}
          onChange={setCurrent}
          placeholder="현재 비밀번호 입력"
          secureTextEntry
        />
        <InputField
          label="새 비밀번호"
          value={next}
          onChange={setNext}
          placeholder="새 비밀번호 입력 (8자 이상)"
          secureTextEntry
        />

        {next.length > 0 && (
          <View style={{ marginTop: -10, marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', gap: 4, marginBottom: 6 }}>
              {[1, 2, 3].map(i => (
                <View key={i} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  backgroundColor: i <= strength ? strengthColor : THEME.border,
                }} />
              ))}
            </View>
            <Text style={{ fontSize: 12, color: strengthColor, fontWeight: '600' }}>{strengthLabel}</Text>
          </View>
        )}

        <InputField
          label="새 비밀번호 확인"
          value={confirm}
          onChange={setConfirm}
          placeholder="새 비밀번호 재입력"
          secureTextEntry
          hint={confirmHint}
        />

        <PrimaryBtn label="비밀번호 변경" onPress={() => {}} disabled={!canSubmit} />
      </ScrollView>
    </View>
  );
};

// ─── SCREEN: Notifications ────────────────────────────────────────────────────
const Notification = ({ onBack }) => {
  const [settings, setSettings] = useState({
    pushAll: true,
    newMessage: true,
    comment: true,
    like: false,
    mention: true,
    marketing: false,
    nightQuiet: true,
    email: false,
  });

  const toggle = key => setSettings(s => ({ ...s, [key]: !s[key] }));

  const Section = ({ title, children }) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );

  const Row = ({ label, sub, value, onToggle, last }) => (
    <View style={[styles.notifRow, !last && styles.rowBorder]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Toggle value={value} onChange={onToggle} />
    </View>
  );

  return (
    <View style={styles.screen}>
      <Header title="알림 설정" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Section title="전체 알림">
          <Row label="푸시 알림" sub="모든 알림을 한 번에 켜고 끕니다" value={settings.pushAll} onToggle={() => toggle('pushAll')} last />
        </Section>
        <Section title="활동 알림">
          <Row label="새 메시지" value={settings.newMessage} onToggle={() => toggle('newMessage')} />
          <Row label="댓글" value={settings.comment} onToggle={() => toggle('comment')} />
          <Row label="좋아요" value={settings.like} onToggle={() => toggle('like')} />
          <Row label="멘션" sub="나를 언급한 경우 알림" value={settings.mention} onToggle={() => toggle('mention')} last />
        </Section>
        <Section title="기타">
          <Row label="야간 방해 금지" sub="오후 10시 ~ 오전 8시" value={settings.nightQuiet} onToggle={() => toggle('nightQuiet')} />
          <Row label="마케팅 알림" sub="이벤트 및 혜택 정보" value={settings.marketing} onToggle={() => toggle('marketing')} />
          <Row label="이메일 수신" value={settings.email} onToggle={() => toggle('email')} last />
        </Section>
      </ScrollView>
    </View>
  );
};

// ─── SCREEN: Help & Support ───────────────────────────────────────────────────
const HelpScreen = ({ onBack }) => {
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState(null);

  const faqs = [
    { q: '비밀번호를 잊어버렸어요', a: '로그인 화면에서 "비밀번호 찾기"를 눌러 이메일로 재설정 링크를 받을 수 있습니다.' },
    { q: '회원 탈퇴는 어떻게 하나요?', a: '설정 > 계정 > 회원 탈퇴에서 진행할 수 있습니다. 탈퇴 후 30일간 계정이 보관됩니다.' },
    { q: '알림이 오지 않아요', a: '기기의 알림 권한을 확인하고, 앱 내 알림 설정에서 원하는 항목이 켜져 있는지 확인해주세요.' },
    { q: '결제 취소는 어떻게 하나요?', a: '결제일로부터 7일 이내에 고객센터로 문의해주시면 처리해드립니다.' },
  ];

  const contacts = [
    { icon: 'message', label: '1:1 채팅 문의', sub: '평균 응답 5분', color: THEME.primary, bg: THEME.primaryLight },
    { icon: 'phone', label: '전화 문의', sub: '평일 09~18시', color: THEME.success, bg: THEME.successLight },
    { icon: 'bug', label: '버그 신고', sub: '불편함 개선', color: THEME.warning, bg: THEME.warningLight },
  ];

  return (
    <View style={styles.screen}>
      <Header title="문의 & 서포트" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Contact options */}
        <View style={styles.contactGrid}>
          {contacts.map(({ icon, label, sub, color, bg }) => {
            const isSelected = selected === label;
            return (
              <TouchableOpacity
                key={label}
                onPress={() => setSelected(label)}
                style={[
                  styles.contactCard,
                  { backgroundColor: isSelected ? color : bg },
                  isSelected && { borderColor: color },
                ]}
                activeOpacity={0.85}
              >
                <View style={[styles.contactIconBox, { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : THEME.card }]}>
                  <Icon name={icon} size={20} color={isSelected ? '#fff' : color} />
                </View>
                <Text style={[styles.contactLabel, { color: isSelected ? '#fff' : THEME.textMain }]}>{label}</Text>
                <Text style={[styles.contactSub, { color: isSelected ? 'rgba(255,255,255,0.8)' : THEME.textSub }]}>{sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>자주 묻는 질문</Text>
        <View style={styles.card}>
          {faqs.map(({ q, a }, i) => (
            <View key={i} style={i < faqs.length - 1 ? styles.rowBorder : null}>
              <TouchableOpacity
                onPress={() => setExpanded(expanded === i ? null : i)}
                style={styles.faqRow}
                activeOpacity={0.7}
              >
                <Text style={[styles.rowLabel, { flex: 1 }]}>{q}</Text>
                <Text style={[styles.chevronText, { transform: [{ rotate: expanded === i ? '90deg' : '0deg' }] }]}>›</Text>
              </TouchableOpacity>
              {expanded === i && (
                <Text style={styles.faqAnswer}>{a}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// ─── SCREEN: App Info ─────────────────────────────────────────────────────────
const AppInfoScreen = ({ onBack }) => {
  const items = [
    { label: '버전', value: '2.4.1 (최신)' },
    { label: '개발사', value: '(주) 앱컴퍼니' },
    { label: '출시일', value: '2023년 3월 15일' },
    { label: '업데이트', value: '2024년 12월 28일' },
  ];

  const links = [
    { icon: 'globe', label: '공식 웹사이트' },
    { icon: 'shield', label: '개인정보 처리방침' },
    { icon: 'info', label: '이용 약관' },
    { icon: 'star', label: '앱 평가하기' },
  ];

  return (
    <View style={styles.screen}>
      <Header title="앱 정보" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* App Icon */}
        <View style={styles.appIconContainer}>
          <View style={styles.appIconBox}>
            <Text style={{ fontSize: 42 }}>⚡</Text>
          </View>
          <Text style={styles.appName}>MyApp</Text>
          <Text style={styles.appVersion}>v2.4.1</Text>
          <View style={styles.latestBadge}>
            <Text style={styles.latestBadgeText}>✓ 최신 버전</Text>
          </View>
        </View>

        {/* Info table */}
        <View style={[styles.card, { marginBottom: 24 }]}>
          {items.map(({ label, value }, i) => (
            <View key={i} style={[styles.infoRow, i < items.length - 1 && styles.rowBorder]}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Links */}
        <Text style={styles.sectionTitle}>법적 정보 & 링크</Text>
        <View style={styles.card}>
          {links.map(({ icon, label }, i) => (
            <TouchableOpacity key={i} style={[styles.linkRow, i < links.length - 1 && styles.rowBorder]} activeOpacity={0.7}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.linkIconBox}>
                  <Icon name={icon} size={18} color={THEME.primary} />
                </View>
                <Text style={styles.linkLabel}>{label}</Text>
              </View>
              <Icon name="chevronRight" size={18} color={THEME.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.copyright}>© 2024 AppCompany Inc. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
};

// ─── MAIN: Settings Screen ────────────────────────────────────────────────────
const SettingsScreen = ({ onGoBack }) => {
  const [screen, setScreen] = useState('settings');
  const [darkMode, setDarkMode] = useState(false);

  if (screen === 'profile') return <ProfileEditScreen onBack={() => setScreen('settings')} />;
  if (screen === 'password') return <PasswordScreen onBack={() => setScreen('settings')} />;
  if (screen === 'notification') return <NotificationScreen onBack={() => setScreen('settings')} />;
  if (screen === 'help') return <HelpScreen onBack={() => setScreen('settings')} />;
  if (screen === 'appinfo') return <AppInfoScreen onBack={() => setScreen('settings')} />;

  const Section = ({ title, children }) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );

  const Item = ({ icon, label, bg, color, onPress, toggle, toggleVal, onToggle, last, badge, danger }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !onToggle}
      style={[styles.settingItem, !last && styles.rowBorder]}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={[styles.settingIconBox, { backgroundColor: bg || THEME.primaryLight }]}>
          <Icon name={icon} size={18} color={color || THEME.primary} />
        </View>
        <View style={{ marginLeft: 14 }}>
          <Text style={[styles.settingLabel, danger && { color: THEME.danger }]}>{label}</Text>
          {!!badge && <Text style={styles.settingBadge}>{badge}</Text>}
        </View>
      </View>
      {toggle
        ? <Toggle value={toggleVal} onChange={onToggle} />
        : !danger && <Icon name="chevronRight" size={18} color={THEME.textMuted} />
      }
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <Header title="설정" onBack={onGoBack} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile card */}
        <TouchableOpacity onPress={() => setScreen('profile')} style={styles.profileCard} activeOpacity={0.85}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>김</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>김민준</Text>
            <Text style={styles.profileEmail}>minjun@email.com</Text>
          </View>
          <Icon name="chevronRight" size={20} color={THEME.textMuted} />
        </TouchableOpacity>

        <Section title="계정">
          <Item icon="user" label="프로필 수정" onPress={() => setScreen('profile')} />
          <Item icon="lock" label="비밀번호 변경" onPress={() => setScreen('password')} />
          <Item icon="bell" label="알림" badge="3개 미읽음" onPress={() => setScreen('notification')} last />
        </Section>

        <Section title="설정">
          <Item
            icon="moon"
            label="다크 모드"
            toggle
            toggleVal={darkMode}
            onToggle={() => setDarkMode(!darkMode)}
            bg={darkMode ? '#2D2D3E' : '#F0F0FA'}
            color={darkMode ? '#A78BFA' : '#7C6FF7'}
            last
          />
        </Section>

        <Section title="지원">
          <Item icon="help" label="문의 & 서포트" onPress={() => setScreen('help')} />
          <Item icon="info" label="앱 정보" badge="v2.4.1" onPress={() => setScreen('appinfo')} last />
        </Section>

        <View style={[styles.card, { marginBottom: 32 }]}>
          <Item icon="logout" label="로그아웃" bg={THEME.dangerLight} color={THEME.danger} danger last />
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.card} />
      <SettingsScreen onGoBack={() => {}} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  screen: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: THEME.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: THEME.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.textMain,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    overflow: 'hidden',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
    letterSpacing: 0.5,
  },

  // InputField
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textSub,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: THEME.card,
    fontSize: 15,
    color: THEME.textMain,
    paddingHorizontal: 16,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 4,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 6,
  },
  textarea: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: THEME.divider,
    backgroundColor: THEME.card,
    fontSize: 15,
    color: THEME.textMain,
    padding: 14,
    textAlignVertical: 'top',
    minHeight: 90,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 4,
  },

  // PrimaryBtn
  primaryBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Profile Edit
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: '700',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: THEME.primary,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 13,
    color: THEME.primary,
    fontWeight: '600',
  },

  // Password
  infoBanner: {
    backgroundColor: THEME.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: THEME.primary,
    lineHeight: 20,
  },

  // Notification
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.textMain,
  },
  rowSub: {
    fontSize: 12,
    color: THEME.textSub,
    marginTop: 2,
  },

  // Help
  contactGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  contactCard: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  contactIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  contactSub: {
    fontSize: 11,
    textAlign: 'center',
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 18,
  },
  chevronText: {
    fontSize: 24,
    color: THEME.textSub,
    lineHeight: 28,
  },
  faqAnswer: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    fontSize: 13,
    color: THEME.textSub,
    lineHeight: 22,
  },

  // App Info
  appIconContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  appIconBox: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.textMain,
  },
  appVersion: {
    fontSize: 13,
    color: THEME.textSub,
    marginTop: 4,
  },
  latestBadge: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: THEME.successLight,
  },
  latestBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.success,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textSub,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textMain,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  linkIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.textMain,
  },
  copyright: {
    textAlign: 'center',
    marginTop: 32,
    color: THEME.textMuted,
    fontSize: 12,
  },

  // Settings
  profileCard: {
    backgroundColor: THEME.card,
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  profileAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.textMain,
  },
  profileEmail: {
    fontSize: 13,
    color: THEME.textSub,
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  settingIconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.textMain,
  },
  settingBadge: {
    fontSize: 11,
    color: THEME.primary,
    fontWeight: '600',
    marginTop: 1,
  },
});