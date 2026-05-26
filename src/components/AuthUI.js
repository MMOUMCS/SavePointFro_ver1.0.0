import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../components/ThemeContext'; // 고정 테마를 지우고 전역 테마 훅을 임포트

// 그라데이션 버튼
export const GradientButton = ({ onPress, title, colors, style, textStyle }) => {
  const { theme } = useTheme(); // 전역 테마 상태 가져오기

  return (
    <TouchableOpacity onPress={onPress} style={[styles.buttonContainer, style]}>
      <View style={[styles.gradient, { backgroundColor: colors[0], borderColor: colors[1] }]}>
        {/* 버튼 텍스트 색상을 테마의 white(다크모드 시 어두운 색 혹은 유지)로 바인딩 */}
        <Text style={[styles.buttonText, { color: theme.white }, textStyle]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

// 공통 입력 필드
export const InputField = ({ placeholder, isPassword = false, value, onChangeText }) => {
  const { theme } = useTheme(); // 전역 테마 상태 가져오기

  return (
    <TextInput
      /* 기본 스타일에 현재 테마에 맞는 배경색, 테두리색, 글자색을 인라인 스타일로 추가 결합 */
      style={[
        styles.input, 
        { 
          backgroundColor: theme.white, 
          borderColor: theme.border, 
          color: theme.textMain 
        }
      ]}
      placeholder={placeholder}
      placeholderTextColor={theme.textSub} // 힌트 텍스트 색상 연동
      secureTextEntry={isPassword}
      value={value}
      onChangeText={onChangeText}
    />
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: '100%',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1, 
    opacity: 0.95,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 12,
  },
});