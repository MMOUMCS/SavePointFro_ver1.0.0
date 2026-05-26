import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../components/ThemeContext'; // 고정 테마를 지우고 전역 테마 훅 임포트

const GradientButton = ({ title, colors, onPress }) => {
  const { theme } = useTheme(); // 전역 테마 상태 가져오기

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.buttonWrapper}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientButton}
      >
        {/* 버튼 텍스트 색상을 테마의 white 구조와 연동 */}
        <Text style={[styles.buttonText, { color: theme.white }]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const LandingScreen = ({ onNavigate }) => {
  const { theme } = useTheme(); // 전역 테마 상태 가져오기
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    /* 전체 화면 배경색을 현재 테마의 bg 색상으로 연동 */
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 메인 영역 */}
      <View style={styles.mainContent}>
        <Animated.View 
          style={[
            styles.centerContent,
            { opacity: fadeAnim }
          ]}
        >
          {/* 아이콘 */}
          <View style={styles.iconContainer}>
            <LinearGradient
              /* 테마에서 가져온 고유 색상 뒤에 16진수 투명도 값 15를 붙여 투명한 배경 그라데이션 유지 */
              colors={[`${theme.primary}15`, `${theme.accent}15`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconBox}
            >
              <Svg width="48" height="48" viewBox="0 0 48 48">
                <Circle cx="16" cy="18" r="6" fill={theme.primary} opacity="0.8"/>
                <Circle cx="32" cy="18" r="6" fill={theme.accent} opacity="0.8"/>
                <Path 
                  d="M14 30 C14 26 20 24 24 24 C28 24 34 26 34 30" 
                  stroke={theme.primary} 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  opacity="0.6"
                />
              </Svg>
            </LinearGradient>
          </View>

          {/* 타이틀 */}
          <Text style={[styles.title, { color: theme.textMain }]}>Save Point</Text>
          
          {/* 서브타이틀 */}
          <Text style={[styles.subtitle, { color: theme.textSub }]}>
            게임 듀오와 단둘이{'\n'}
            모든 관리를 함께해보세요
          </Text>
        </Animated.View>
      </View>

      {/* 하단 버튼 영역 */}
      <View style={styles.buttonContainer}>
        <GradientButton
          title="시작하기"
          colors={theme.gradPurple} // 현재 테마 상태의 gradPurple 배열로 바인딩
          onPress={() => onNavigate('SignUp')}
        />
        
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => onNavigate('Login')}
        >
          <Text style={[styles.loginButtonText, { color: theme.textSub }]}>
            이미 계정이 있나요? 로그인
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  centerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
    gap: 12,
  },
  buttonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LandingScreen;