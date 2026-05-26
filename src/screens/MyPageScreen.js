import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ChevronRight, Lock, LogOut, Settings } from 'lucide-react-native';
import { useState } from 'react';
import { Dimensions, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import CustomAlert from '../components/CustomAlert';
import { useTheme } from '../components/ThemeContext';
import { useUser } from '../components/UserContext';

const { width } = Dimensions.get('window');

const MyPageScreen = ({ onNavigate }) => {
  const { userData, setUserData } = useUser();
  const { theme } = useTheme();

  // 테마 상태에 맞는 스타일 동적 생성
  const styles = createStyles(theme);

  //  로그아웃 CustomAlert 상태
  const [logoutAlertVisible, setLogoutAlertVisible] = useState(false);

  const userDisplay = {
    name: userData?.username || "사용자",
    email: userData?.email || "@gamer_ab",
    avatar: userData?.profileImageUrl || "https://via.placeholder.com/150"
  };

  const colors = {
    primary: theme.primary || '#4A7FA7',
    secondary: theme.secondary || '#B3CFE5',
    textMain: theme.textMain || '#1A3D63',
    textSub: theme.textSub || '#6E8EA6',
    gradPurple: theme.dark ? ['#2D4A6B', '#1E324A'] : ['#4A7FA7', '#B3CFE5'],
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.background || '#FFFFFF'} />
      
      <View style={styles.headerRow}>
        <View style={{width: 24}} />
        <Text style={styles.headerTitle}>My Page</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => onNavigate('Settings')}>
          <Settings size={22} color={colors.textMain} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: userDisplay.avatar }} style={styles.avatar} />
            <View style={styles.statusDot} />
          </View>
          
          <Text style={styles.username}>{userDisplay.name}</Text>
          <Text style={styles.userHandle}>{userDisplay.email}</Text>

          <LinearGradient
            colors={colors.gradPurple}
            start={{x: 0, y: 0}} end={{x: 1, y: 0}}
            style={styles.rankBadge}
          >
            <Text style={styles.rankText}>Diamond Duo</Text>
          </LinearGradient>
        </View>

        {/* 1. 흰색이던 배경을 스타일 정의에서 theme.card로 제어함 */}
        <View style={styles.menuContainer}>
          {/*  환경설정 Switch → ChevronRight + TouchableOpacity로 변경 */}
          <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('Settings')}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, {backgroundColor: theme.dark ? '#1E293B' : '#E3F2FD'}]}>
                <Settings size={20} color={colors.primary} />
              </View>
              <Text style={styles.menuText}>환경설정</Text>
            </View>
            <ChevronRight size={20} color={colors.textSub} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, {backgroundColor: theme.dark ? '#2E1A47' : '#F3E5F5'}]}>
                <Lock size={20} color="#AB47BC" />
              </View>
              <Text style={styles.menuText}>잠금 설정</Text>
            </View>
            <ChevronRight size={20} color={colors.textSub} />
          </View>

          <View style={styles.divider} />

          {/*  알람 Switch → ChevronRight + TouchableOpacity로 변경 */}
          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, {backgroundColor: theme.dark ? '#1A3322' : '#E8F5E9'}]}>
                <Bell size={20} color="#66BB6A" />
              </View>
              <Text style={styles.menuText}>알람</Text>
            </View>
            <ChevronRight size={20} color={colors.textSub} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, {backgroundColor: theme.dark ? '#33241A' : '#FFF3E0'}]}>
                <Moon size={20} color="#FFA726" />
              </View>
              <Text style={styles.menuText}>다크 테마</Text>
            </View>
            <ChevronRight size={20} color={colors.textSub} />
          </View> */}
        </View>

        {/* 로그아웃 버튼 - CustomAlert로 변경 */}
        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={() => setLogoutAlertVisible(true)}
        >
          <LogOut size={20} color="#E57373" />
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

        <View style={{height: 120}} /> 
      </ScrollView>

      <CustomAlert
  isVisible={logoutAlertVisible}
  title="로그아웃"
  message="정말 로그아웃 하시겠어요?"
  
  //  '확인'을 누르면 작동할 기존 로직
  onConfirm={async () => {
    try {
      setLogoutAlertVisible(false);
      await AsyncStorage.clear();
      setUserData(null);
      onNavigate('Landing');
    } catch (e) {
      console.error("로그아웃 오류:", e);
    }
  }}
  
  //  '취소(아니오)' 버튼을 누르면 부드럽게 창만 닫히게 처리!
  onCancel={() => setLogoutAlertVisible(false)}
  onClose={() => setLogoutAlertVisible(false)}
/>

      <BottomNavigation activeTab="MyPage" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

// ── 테마 기반 동적 스타일 생성 함수 ────────────────────────────────
const createStyles = (theme) => {
  const bg = theme.background || '#FFFFFF';
  const textMain = theme.textMain || '#1A3D63';
  const textSub = theme.textSub || '#6E8EA6';
  const border = theme.border || '#F0F4F8';
  const card = theme.card || '#FFFFFF'; // ⭐ 다크모드일 때 어두운 카드로 매핑됨
  const primary = theme.primary || '#4A7FA7';

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: bg,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: 20,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      marginTop: 10,
      marginBottom: 30,
    },
    headerTitle: {
      fontSize: 20,
      color: textMain,
      fontWeight: '700',
    },
    iconBtn: {
      padding: 8,
    },
    profileSection: {
      alignItems: 'center',
      marginBottom: 40,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 16,
      shadowColor: primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: theme.dark ? 0.4 : 0.2,
      shadowRadius: 15,
      elevation: 5,
    },
    avatar: {
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 4,
      borderColor: card, // ⭐ 흰색(#fff) 대신 테마 카드색 적용
      backgroundColor: theme.dark ? '#334155' : '#f0f0f0',
    },
    statusDot: {
      position: 'absolute',
      bottom: 5,
      right: 5,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#4ADE80',
      borderWidth: 3,
      borderColor: card, // ⭐ 흰색(#fff) 대신 테마 카드색 적용
    },
    username: {
      fontSize: 24,
      fontWeight: '800',
      color: textMain,
      marginBottom: 4,
    },
    userHandle: {
      fontSize: 14,
      color: textSub,
      marginBottom: 16,
    },
    rankBadge: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      shadowColor: primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    },
    rankText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    menuContainer: {
      backgroundColor: card, // ⭐ 흰색(#fff) 대신 테마 카드색 적용 완료!
      borderRadius: 24,
      padding: 10,
      borderWidth: 1,
      borderColor: border,
      shadowColor: primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.dark ? 0.15 : 0.05,
      shadowRadius: 10,
      elevation: 2,
      marginBottom: 25,
    },
    menuItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 10,
    },
    menuLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    menuIconBox: {
      width: 36,
      height: 36,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuText: {
      fontSize: 16,
      fontWeight: '600',
      color: textMain,
    },
    divider: {
      height: 1,
      backgroundColor: border,
      marginHorizontal: 10,
    },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 15,
      backgroundColor: theme.dark ? '#2D1F1F' : '#FEF2F2',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.dark ? '#4C2424' : '#FEE2E2',
    },
    logoutText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#E57373',
    },
  });
};

export default MyPageScreen;