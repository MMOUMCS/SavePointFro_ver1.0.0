import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
// 사용할 아이콘들
import { Home, Swords, Plus, MessageSquare, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// 공통 테마 색상 (여기서 관리)
const THEME = {
  primary: '#4A7FA7',
  textSub: '#94A3B8', // 비활성 아이콘 색상
  bg: '#FFFFFF',
  gradMix: ['#B3CFE5', '#9BA986'],
};

const BottomNavigation = ({ activeTab, onNavigate }) => {
  
  // 버튼 렌더링 헬퍼 함수
  const renderNavItem = (tabName, IconComponent) => {
    const isActive = activeTab === tabName;
    return (
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => onNavigate(tabName)}
      >
        <IconComponent 
            size={24} 
            color={isActive ? THEME.primary : THEME.textSub} 
        />
        {isActive && <View style={styles.activeDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.bottomNavWrapper}>
      <View style={styles.bottomNav}>
        
        {/* 1. 홈 */}
        {renderNavItem('Home', Home)}
        
        {/* 2. 배틀 데이터 */}
        {renderNavItem('Battle', Swords)}
        
        {/* 3. 업로드 (중앙 버튼) */}
        <TouchableOpacity 
            style={styles.centralBtnWrapper}
            onPress={() => onNavigate('Upload')}
        >
            <LinearGradient colors={THEME.gradMix} style={styles.centralBtn}>
                <Plus size={30} color="#fff" />
            </LinearGradient>
        </TouchableOpacity>

        {/* 4. 택틱스 (채팅/전술) */}
        {renderNavItem('Tactics', MessageSquare)}
        
        {/* 5. 마이페이지 */}
        {renderNavItem('MyPage', User)}

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavWrapper: { 
    position: 'absolute', 
    bottom: 30, 
    left: 20, 
    right: 20,
    zIndex: 100, // 다른 요소 위에 뜨도록
  },
  bottomNav: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 30, 
    height: 70, 
    alignItems: 'center', 
    justifyContent: 'space-around', 
    shadowColor: THEME.primary, 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 20, 
    elevation: 10, 
    paddingHorizontal: 10 
  },
  navItem: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: 50, 
    height: '100%' 
  },
  activeDot: { 
    width: 4, 
    height: 4, 
    borderRadius: 2, 
    backgroundColor: THEME.primary, 
    marginTop: 4 
  },
  centralBtnWrapper: { 
    top: -20, 
    shadowColor: THEME.primary, 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 15, 
    elevation: 8 
  },
  centralBtn: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 3, 
    borderColor: '#fff', // 배경색과 동일하게
  }
});

export default BottomNavigation;