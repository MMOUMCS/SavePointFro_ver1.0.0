import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../components/ThemeContext'; // 전역 테마 훅 사용

const LOADING_MESSAGES = [
  "🍞 맛있는 빵 제조 중...",
  "🥖 밀가루 반죽하는 중...",
  "🥐 크로와상 굽는 중...",
  "🥨 프레첼 모양 만드는 중...",
  "🥯 베이글 데우는 중...",
  "🍩 도넛에 설탕 뿌리는 중...",
  "🥪 샌드위치 쌓는 중..."
];

const LoadingSpinner = ({ visible }) => {
  const { theme } = useTheme(); // 전역 테마 상태 가져오기
  
  // 컴포넌트가 다시 그려질 때마다 메시지가 바뀌지 않도록 useMemo 사용
  // (로딩이 끝날 때까지는 한 메시지만 유지)
  const randomMessage = useMemo(() => {
    return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* 로딩 인디케이터 색상을 현재 테마의 textMain 색상으로 연동 */}
      <ActivityIndicator size="small" color={theme.textMain} />
      {/* 텍스트 스타일 뒤에 인라인 스타일로 현재 테마의 textMain 색상을 결합 */}
      <Text style={[styles.text, { color: theme.textMain }]}>{randomMessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    minHeight: 30,
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoadingSpinner;