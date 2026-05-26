import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Device from 'expo-device';

// FIXME: 임시로 가짜 객체 사용 중. 실제 푸시 알림 테스트 시 삭제 필요.
const Notifications = {
  setNotificationHandler: () => {},
  addNotificationReceivedListener: () => ({ remove: () => {} }),
  addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
  getPermissionsAsync: async () => ({ status: 'granted' }),
  requestPermissionsAsync: async () => ({ status: 'granted' }),
  getExpoPushTokenAsync: async () => ({ data: 'dummy-token' }),
};

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../../src/components/ThemeContext'; // 테마 전역 컨텍스트 관련 임포트 추가
import { UserProvider, useUser } from '../../src/components/UserContext';

// --- [화면 컴포넌트들 import] ---
import AddScheduleModal from '../../src/screens/AddScheduleModal';
import BattleDataScreen from '../../src/screens/BattleDataScreen';
import LandingScreen from '../../src/screens/LandingScreen';
import LoginScreen from '../../src/screens/LoginScreen';
import MainScreen from '../../src/screens/MainScreen';
import MyPageScreen from '../../src/screens/MyPageScreen';
import NotificationScreen from '../../src/screens/NotificationScreen';
import ProfileSetupScreen from '../../src/screens/ProfileSetupScreen';
import SettingsScreen from '../../src/screens/Settings';
import SignUpScreen from '../../src/screens/SignUpScreen';
import TacticsIntelApp from '../../src/screens/TacticsAndIntel';
import UploadScreen from '../../src/screens/UploadScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, 
    },
  },
});

// 실제 로직을 담당하는 컴포넌트
const MainAppContent = () => {
  const { userData, setUserData } = useUser(); //1. 자동 로그인을 위해 유저 전역 상태 가로채기
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [screenStack, setScreenStack] = useState(['Landing']);
  const [modalVisible, setModalVisible] = useState(false);
  const activeScreen = screenStack[screenStack.length - 1];
  const [refreshHandler, setRefreshHandler] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); // 2. 앱 최초 구동 체크 중인지 알려주는 상태

  // useTheme 훅을 사용하여 전역 테마 데이터와 테마 모드를 가져옵니다.
  const { theme, themeMode } = useTheme();

  // 유저 데이터 상시 감시(만료토큰 처리)
  useEffect(() => {
  // 앱 초기화 중이 아닌데 userData가 null이 되었다는 건 '로그아웃'이나 '토큰 만료' 상황임!
  if (!isInitializing && !userData) {
    setIsLoggedIn(false);
    setScreenStack(['Login']); //  로그인 화면으로 강제 압송
  }
}, [userData, isInitializing]);

  // 3. 앱 켜지자마자 자동 로그인 세션이 있는지 검사하는 이펙트 추가!
  useEffect(() => {
    const checkSavedSession = async () => {
      try {
        const savedData = await AsyncStorage.getItem('userData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setUserData(parsedData); // UserContext에 복원

          // 로그인 성공 때 하시던 커플 유무 로직이랑 똑같이 분기 처리해 줍니다!
          if (parsedData && parsedData.coupleId !== null && parsedData.coupleId !== undefined) {
            setIsLoggedIn(true);
            setScreenStack(['Home']); // 하이패스로 홈 화면 진입!
          } else {
            setScreenStack(['ProfileSetup']); // 커플 ID 없으면 설정 화면으로!
          }
        }
      } catch (error) {
        console.error('자동 로그인 세션 로드 실패:', error);
      } finally {
        setIsInitializing(false); // 세션 체크가 끝났으니 초기화 로딩 해제!
      }
    };

    checkSavedSession();
  }, [setUserData]);

  useEffect(() => {
    async function preparePushNotifications() {
      if (!Device.isDevice) {
        console.log('실제 폰 아니면 푸시 알람 테스트 안 될 수도 있음');
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('아... 권한 거절');
        return;
      }

      try {
        const token = await messaging().getToken();
        console.log(" 토큰 복사!! ", token);
      } catch (error) {
        console.log('토큰 따다가 에러 :', error);
      }
    }

    preparePushNotifications();
  }, []);

  const handleNavigate = (nextScreen) => {
    const mainTabs = ['Home', 'Battle', 'Tactics', 'MyPage'];
    if (mainTabs.includes(nextScreen)) {
      setScreenStack([nextScreen]); 
    } else {
      setScreenStack((prev) => [...prev, nextScreen]);
    }
  };

  const handleGoBack = () => {
    if (screenStack.length > 1) setScreenStack((prev) => prev.slice(0, -1));
  };

  const handleLoginSuccess = async (data) => {
    setIsLoading(true); 

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));

      if (data && data.coupleId !== null && data.coupleId !== undefined) {
        setIsLoggedIn(true); 
        handleNavigate('Home'); 
      } else {
        handleNavigate('ProfileSetup');
      }
    } catch (error) {
      console.error("로그인 처리 중 에러 발생:", error);
    } finally {
      setIsLoading(false); 
    }
  };

  const handleProfileSetupComplete = () => {
    setIsLoggedIn(true);
    handleNavigate('Home');
  };

  // 하위 컴포넌트들에 전달할 공통 프로퍼티 설정
  const commonProps = { 
    onNavigate: handleNavigate, 
    onGoBack: handleGoBack, 
    openModal: () => setModalVisible(true),
    setIsLoading: setIsLoading
  };

  // 현재 활성화된 화면에 따른 렌더링 로직
  const renderScreen = () => {
    switch (activeScreen) {
      case 'Landing': return <LandingScreen {...commonProps} />;
      case 'Login': return <LoginScreen {...commonProps} isLoading={isLoading} onLoginSuccess={handleLoginSuccess} />;
      case 'SignUp': return <SignUpScreen {...commonProps} />;
      case 'ProfileSetup': return <ProfileSetupScreen {...commonProps} onComplete={handleProfileSetupComplete} />;
      case 'Home': return <MainScreen {...commonProps} />;
      case 'Battle': return <BattleDataScreen {...commonProps} />;
      case 'Tactics': return <TacticsIntelApp {...commonProps} />;
      case 'MyPage': return <MyPageScreen {...commonProps} />;
      case 'Settings': return <SettingsScreen {...commonProps} />;
      case 'Notifications': return <NotificationScreen {...commonProps} />;
      case 'Upload': return <UploadScreen {...commonProps} />;
      case 'WikiScreen': return <WikiScreen {...commonProps} />;
      default: return <LandingScreen {...commonProps} />;
    }
  };
  // 4. 기기 금고에서 세션 정보 읽어오는 아주 짧은 순간에는 로그인 화면을 감추기 위해 빈 화면(또는 스피너)을 뱉어줍니다!
  if (isInitializing) {
    return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  }

  return (
    // 최상위 View의 배경색에 현재 테마의 배경색(theme.bg)을 적용합니다.
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {renderScreen()}
      
      <AddScheduleModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onSaveSuccess={refreshHandler}
      />
    </View>
  );
};

// Expo Router 인식을 위한 default export 설정
export default function MainIndex() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          {/* ThemeProvider를 배치하여 하위 컴포넌트들이 테마 상태에 접근할 수 있게 합니다. */}
          <ThemeProvider>
            <MainAppContent />
          </ThemeProvider>
        </UserProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}