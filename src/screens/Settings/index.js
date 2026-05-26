import { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../components/ThemeContext'; // 전역 테마 상태를 사용하기 위한 임포트 추가
import { useUser } from '../../components/UserContext';
import { Header, Icon, Toggle } from './components';
import { styles } from './styles';

// 서브 스크린 임포트
import { AppInfoScreen } from './AppInfo';
import { HelpScreen } from './HelpSupport';
import { NotificationSettingScreen } from './NotificationSettingScreen';
import { PasswordScreen } from './PasswordChange';
import { ProfileEditScreen } from './ProfileEdit';

export default function SettingsScreen({ onGoBack }) {
  const { userData } = useUser();
  const { theme, toggleTheme } = useTheme(); // 전역 테마 데이터와 테마 변경 함수 가져오기
  const [screen, setScreen] = useState('settings');

  // 유저 정보가 없을 때를 대비한 기본값 세팅
  const userDisplay = {
    name: userData?.username || "사용자",
    email: userData?.email || "@gamer_ab",
    avatar: userData?.profileImageUrl || "https://via.placeholder.com/150"
  };

  if (screen === 'profile') return <ProfileEditScreen onBack={() => setScreen('settings')} />;
  if (screen === 'password') return <PasswordScreen onBack={() => setScreen('settings')} />;
  if (screen === 'notification') return <NotificationSettingScreen onBack={() => setScreen('settings')} />;
  if (screen === 'help') return <HelpScreen onBack={() => setScreen('settings')} />;
  if (screen === 'appinfo') return <AppInfoScreen onBack={() => setScreen('settings')} />;

  const Section = ({ title, children }) => (
    <View style={{ marginBottom: 24 }}>
      {/* 텍스트 색상을 현재 테마의 메인 텍스트 색상으로 적용 */}
      <Text style={[styles.sectionTitle, { color: theme.textMain }]}>{title}</Text>
      {/* 카드 배경색을 현재 테마의 카드 배경색으로 적용 */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>{children}</View>
    </View>
  );

  const Item = ({ icon, label, bg, color, onPress, toggle, toggleVal, onToggle, last, badge, danger }) => (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={!onPress && !onToggle} 
      /* 하단 구분선 색상을 현재 테마의 border 색상으로 적용 */
      style={[styles.settingItem, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }]} 
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={[styles.settingIconBox, { backgroundColor: bg || theme.primaryLight }]}>
          <Icon name={icon} size={18} color={color || theme.primary} />
        </View>
        <View style={{ marginLeft: 14 }}>
          {/* 아이템 라벨 텍스트 색상 분기 처리 */}
          <Text style={[styles.settingLabel, { color: danger ? theme.danger : theme.textMain }]}>{label}</Text>
          {!!badge && <Text style={styles.settingBadge}>{badge}</Text>}
        </View>
      </View>
      {toggle ? (
        <Toggle value={toggleVal} onChange={onToggle} />
      ) : (
        !danger && <Icon name="chevronRight" size={18} color={theme.textMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    /* 전체 화면 배경색을 현재 테마의 bg 색상으로 적용 */
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <Header title="설정" onBack={onGoBack} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 프로필 카드 배경색을 현재 테마의 card 배경색으로 적용 */}
        <TouchableOpacity 
          onPress={() => setScreen('profile')} 
          style={[styles.profileCard, { backgroundColor: theme.card }]} 
          activeOpacity={0.85}
        >
          <View style={styles.profileAvatar}>
            <Image 
              source={{ uri: userDisplay.avatar }} 
              style={{ width: '100%', height: '100%', borderRadius: 999 }} 
            />
          </View>
          <View style={{ flex: 1 }}>
            {/* 프로필 이름과 이메일 텍스트 색상 적용 */}
            <Text style={[styles.profileName, { color: theme.textMain }]}>{userDisplay.name}</Text>
            <Text style={[styles.profileEmail, { color: theme.textSub }]}>{userDisplay.email}</Text>
          </View>
          <Icon name="chevronRight" size={20} color={theme.textMuted} />
        </TouchableOpacity>

        <Section title="계정">
          <Item icon="user" label="프로필 수정" onPress={() => setScreen('profile')} />
          <Item icon="lock" label="비밀번호 변경" onPress={() => setScreen('password')} />
          <Item icon="bell" label="알림" badge="3개 미읽음" onPress={() => setScreen('notification')} last />
        </Section>

        <Section title="설정">
          {/* 다크 모드 아이템 스위치 값과 토글 함수를 전역 테마 상태와 직접 연결 */}
          <Item 
            icon="moon" 
            label="다크 모드" 
            toggle 
            toggleVal={theme.mode === 'dark'} 
            onToggle={toggleTheme} 
            bg={theme.mode === 'dark' ? '#2D2D3E' : '#F0F0FA'} 
            color={theme.mode === 'dark' ? '#A78BFA' : '#7C6FF7'} 
            last 
          />
        </Section>

        <Section title="지원">
          <Item icon="help" label="문의 & 서포트" onPress={() => setScreen('help')} />
          <Item icon="info" label="앱 정보" badge="v1.1.1" onPress={() => setScreen('appinfo')} last />
        </Section>

        {/* 로그아웃 버튼 영역 배경색 처리 */}
        <View style={[styles.card, { marginBottom: 32, backgroundColor: theme.card }]}>
          <Item icon="logout" label="로그아웃" bg={theme.dangerLight} color={theme.danger} danger last />
        </View>
      </ScrollView>
    </View>
  );
}