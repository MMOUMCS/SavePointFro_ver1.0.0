import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../components/ThemeContext'; // 고정 테마를 지우고 전역 테마 훅 임포트
import { Header, Icon } from './components';
import { styles } from './styles';

export const AppInfoScreen = ({ onBack }) => {
  const { theme } = useTheme(); // 전역 테마 상태 가져오기

  const items = [
    { label: '버전', value: '1.1.1 (최신)' }, { label: '개발사', value: '(주) 앱컴퍼니' },
    { label: '출시일', value: '2026년 5월 16일' }, { label: '업데이트', value: '2026년 5월 16일' },
  ];

  const links = [
    { icon: 'globe', label: '공식 웹사이트' }, { icon: 'shield', label: '개인정보 처리방침' },
    { icon: 'info', label: '이용 약관' }, { icon: 'star', label: '앱 평가하기' },
  ];

  return (
    /* 전체 화면 배경색을 현재 테마의 bg 색상으로 연동 */
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <Header title="앱 정보" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.appIconContainer}>
          <View style={styles.appIconBox}><Text style={{ fontSize: 42 }}>⚡</Text></View>
          {/* 앱 이름 텍스트 색상을 현재 테마의 textMain 색상으로 연동 */}
          <Text style={[styles.appName, { color: theme.textMain }]}>SavePoint</Text>
          {/* 앱 버전 텍스트 색상을 현재 테마의 textSub 색상으로 연동 */}
          <Text style={[styles.appVersion, { color: theme.textSub }]}>v1.1.1</Text>
          <View style={styles.latestBadge}><Text style={styles.latestBadgeText}>✓ 최신 버전</Text></View>
        </View>

        {/* 카드 배경색을 현재 테마의 card 색상으로 연동 */}
        <View style={[styles.card, { backgroundColor: theme.card, marginBottom: 24 }]}>
          {items.map(({ label, value }, i) => (
            <View key={i} style={[styles.infoRow, i < items.length - 1 && styles.rowBorder]}>
              {/* 각 텍스트 컬럼들의 색상을 테마에 맞게 매핑 */}
              <Text style={[styles.infoLabel, { color: theme.textSub }]}>{label}</Text>
              <Text style={[styles.infoValue, { color: theme.textMain }]}>{value}</Text>
            </View>
          ))}
        </View>

        {/* 섹션 타이틀 텍스트 색상을 현재 테마의 textMain 색상으로 연동 */}
        <Text style={[styles.sectionTitle, { color: theme.textMain }]}>법적 정보 & 링크</Text>
        {/* 카드 배경색을 현재 테마의 card 색상으로 연동 */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          {links.map(({ icon, label }, i) => (
            <TouchableOpacity key={i} style={[styles.linkRow, i < links.length - 1 && styles.rowBorder]} activeOpacity={0.7}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.linkIconBox}><Icon name={icon} size={18} color={theme.primary} /></View>
                {/* 링크 라벨 텍스트 색상을 현재 테마의 textMain 색상으로 연동 */}
                <Text style={[styles.linkLabel, { color: theme.textMain }]}>{label}</Text>
              </View>
              {/* 화살표 아이콘 색상을 현재 테마의 textMuted(또는 textSub) 색상으로 연동 */}
              <Icon name="chevronRight" size={18} color={theme.textMuted || theme.textSub} />
            </TouchableOpacity>
          ))}
        </View>
        {/* 카피라이트 텍스트 색상을 현재 테마의 textMuted(또는 textSub) 색상으로 연동 */}
        <Text style={[styles.copyright, { color: theme.textMuted || theme.textSub }]}>© 2026 AppCompany Inc. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
};