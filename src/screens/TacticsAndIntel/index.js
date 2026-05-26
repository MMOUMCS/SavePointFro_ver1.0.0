import { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// 아이콘 라이브러리 (기존에 쓰시던 것)
import { Bell, ChevronLeft, Settings } from 'lucide-react-native';

// 1. [추가] 밖으로 쪼갠 자식 화면들 가져오기
import GalleryScreen from './GallerySection';
import HighlightsScreen from './ReplaySection';
import WikiScreen from './WikiSection';

// 2. 외부 공통 컴포넌트 가져오기 (경로에 맞게 추가 확인 필요)
import BottomNavigation from '../../components/BottomNavigation';

// ==========================================
// 0. 테마 및 공통 스타일 정의 (index에서도 사용하므로 유지)
// ==========================================
const THEME = {
  bg: '#FFFFFF',
  white: '#FFFFFF',
  primary: '#4A7FA7',
  secondary: '#B3CFE5',
  accent: '#9BA986',
  textMain: '#1A3D63',
  textSub: '#6E8EA6',
  border: '#F0F4F8',
  gradPurple: ['#4A7FA7', '#B3CFE5'],
  gradMix: ['#B3CFE5', '#9BA986'],
  danger: '#FF6B6B',
};

// ==========================================
// 1. 메인 부모 컴포넌트 (App Shell)
// ==========================================
const TacticsIntelApp = (props) => {
  const { onNavigate, openModal } = props;
  const [activeTab, setActiveTab] = useState('wiki');

  return (
    <SafeAreaView style={mainStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <View style={mainStyles.container}>
        <View style={mainStyles.header}>
          <View style={mainStyles.topBar}>
            <TouchableOpacity style={mainStyles.iconButton}>
              <ChevronLeft size={24} color={THEME.textMain} />
            </TouchableOpacity>
            <Text style={mainStyles.headerTitle}>Tactics & Intel</Text>
            <View style={mainStyles.headerIcons}>
              <TouchableOpacity style={mainStyles.iconButton} onPress={() => onNavigate('Notifications')}>
                <Bell size={24} color={THEME.textMain} />
              </TouchableOpacity>
              <TouchableOpacity style={mainStyles.iconButton}>
                <Settings size={24} color={THEME.textMain} onPress={() => onNavigate('Settings')} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={mainStyles.tabBar}>
            {['wiki', 'gallery', 'replay'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[mainStyles.tabItem, activeTab === tab && mainStyles.activeTabItem]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[mainStyles.tabText, activeTab === tab && mainStyles.activeTabText]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
                {activeTab === tab && <View style={mainStyles.activeTabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={mainStyles.contentArea}>
          {/* 자식 컴포넌트 공백 에러 방지를 위해 띄어쓰기 살짝 수정했습니다. */}
          {activeTab === 'wiki' && <WikiScreen {...props} />}
          {activeTab === 'gallery' && <GalleryScreen />}
          {activeTab === 'replay' && <HighlightsScreen />}
        </View>
      </View>
      <BottomNavigation 
        activeTab="Home"
        onNavigate={onNavigate} 
      />
    </SafeAreaView>
  );
};

// 3. [추가] 외부에서 내보낼 수 있도록 export 설정
export default TacticsIntelApp;

// 4. [추가] 메인 껍데기에 필요한 스타일 정의 (기존 1300줄짜리 파일 밑에서 잘라오기!)
const mainStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },
  container: { flex: 1 },
  header: { backgroundColor: THEME.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.textMain },
  headerIcons: { flexDirection: 'row' },
  iconButton: { marginLeft: 16 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: THEME.border },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  activeTabItem: {},
  tabText: { fontSize: 14, color: THEME.textSub },
  activeTabText: { fontWeight: 'bold', color: THEME.textMain },
  activeTabIndicator: { position: 'absolute', bottom: 0, left: '25%', right: '25%', height: 3, backgroundColor: THEME.primary, borderRadius: 1.5 },
  contentArea: { flex: 1 },
});