import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { API_BASE_URL } from '../../../settings';
import CustomAlert from '../../components/CustomAlert';
import { useTheme } from '../../components/ThemeContext'; // 고정 테마를 지우고 전역 테마 훅 임포트
import { useUser } from '../../components/UserContext';
import { Header, Icon, InputField, PrimaryBtn } from './components';
import { styles } from './styles';

export const PasswordScreen = ({ onBack }) => {
  const { theme } = useTheme(); // 전역 테마 상태 가져오기
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const isMatch = next && confirm && next === confirm;
  const isStrong = next.length >= 8;
  const isSameAsOld = current && next && current === next;
  const canSubmit = current && isMatch && isStrong && !isSameAsOld;

  // alter
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onConfirm: () => {} });

  const showAlert = (title, message, callback = null) => {
    setAlertConfig({
      title,
      message,
      onConfirm: () => {
        setAlertVisible(false);
        if (callback) callback(); // 확인 누른 후 추가 액션(예: 화면 닫기)이 필요할 때 실행
      }
    });
    setAlertVisible(true);
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return 0;
    if (password.length < 8) return 1; // 8자 미만은 무조건 가장 위험한 '약함' 단계로 컷트

    // 정규식으로 각 요소가 포함되어 있는지 체크 (대소문자/한글 포함 문자, 숫자, 특수문자)
    const hasLetter = /[a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[{}[\]/?.,;:|)*~`#^\-_+<>@`$%&!='"\\]/.test(password);

    // 1. 강함: 문자 + 숫자 + 특수문자 3가지가 모두 혼합된 8자 이상
    if (hasLetter && hasNumber && hasSpecial) {
      return 3;
    }
    
    // 2. 보통: 문자와 숫자가 혼합된 8자 이상
    if (hasLetter && hasNumber) {
      return 2;
    }

    // 3. 약함: 8자 이상이지만 문자만 있거나, 숫자만 있거나, 특수문자만 있는 경우
    return 1;
  };

  // 기존 렌더링에 쓰이던 변수들과 그대로 매핑!
  const strength = getPasswordStrength(next);
  const strengthLabel = ['', '약함', '보통', '강함'][strength];
  
  // 테마 상태에서 동적으로 컬러 값을 매핑 (fallback 컬러 지정)
  const strengthColor = [
    '', 
    theme.danger || '#FF3B30', 
    theme.warning || '#FF9500', 
    theme.success || '#4CD964'
  ][strength];

  const { userData } = useUser(); 

const handleChangePassword = async () => {
  try {
    if (isSameAsOld) {
    showAlert('변경 불가', '새 비밀번호가 현재 비밀번호와 같습니다.');
    return;
  }
    const token = userData?.accessToken || userData?.token;
    const response = await fetch(`${API_BASE_URL}/api/users/password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword: current,
        newPassword: next,
      }),
    });
    if (response.ok) {
      setCurrent('');
      setNext('');
      setConfirm('');
      showAlert('변경 완료', '비밀번호가 성공적으로 변경되었습니다! ', onBack);
    } else {
      if (response.status === 400) {
        showAlert('인증 실패', '현재 비밀번호가 일치하지 않습니다.');
      }else {
        showAlert('오류', '비밀번호 변경 중 문제가 발생했습니다.');
      }
    }
  } catch (error) {
    console.error('비밀번호 변경 실패:', error);
    showAlert('통신 오류', '네트워크 오류가 발생했습니다.');
  }
};

  return (
    /* 전체 화면 배경색을 현재 테마의 bg 색상으로 연동 */
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <Header title="비밀번호 변경" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 안내 배너 배경색을 테마의 card나 반투명 primary로 연동 */}
        <View style={[styles.infoBanner, { backgroundColor: theme.card || `${theme.primary}10` }]}>
          <Icon name="shield" size={18} color={theme.primary} />
          <Text style={[styles.infoBannerText, { color: theme.textSub }]}>
            보안을 위해 주기적으로 비밀번호를 변경해주세요.{'\n'}
            영문, 숫자, 특수문자 조합 8자 이상을 권장합니다.
          </Text>
        </View>

        <InputField label="현재 비밀번호" value={current} onChange={setCurrent} placeholder="현재 비밀번호 입력" secureTextEntry />
        <InputField 
  label="새 비밀번호" 
  value={next} 
  onChange={setNext} 
  placeholder="새 비밀번호 입력 (8자 이상)" 
  secureTextEntry 
  // ─── [여기서부터 추가할 힌트 로직입니다] ───
  hint={isSameAsOld ? ' 현재 비밀번호와 새 비밀번호가 같습니다.' : ''}
  hintColor={theme.danger || '#FF3B30'}
  // ───────────────────────────────────────────
/>

        {next.length > 0 && (
          <View style={{ marginTop: -10, marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', gap: 4, marginBottom: 6 }}>
              {[1, 2, 3].map(i => (
                <View 
                  key={i} 
                  style={{ 
                    flex: 1, 
                    height: 4, 
                    borderRadius: 2, 
                    // 현재 달성도에 따라 유동적인 강도 색상 혹은 테마 border 색상 바인딩
                    backgroundColor: i <= strength ? strengthColor : (theme.border || '#E5E8EB') 
                  }} 
                />
              ))}
            </View>
            <Text style={{ fontSize: 12, color: strengthColor, fontWeight: '600' }}>{strengthLabel}</Text>
          </View>
        )}

        <InputField label="새 비밀번호 확인" value={confirm} onChange={setConfirm} placeholder="새 비밀번호 재입력" secureTextEntry hint={confirm ? (isMatch ? '✓ 비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다') : ''} />
<PrimaryBtn label="비밀번호 변경" onPress={handleChangePassword} disabled={!canSubmit} />
      </ScrollView>
      <CustomAlert
        isVisible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};