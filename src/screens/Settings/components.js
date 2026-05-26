import { useState } from 'react';
import { Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../components/ThemeContext'; // 고정 테마를 지우고 전역 테마 훅 임포트
import { styles } from './styles';

const IconMap = {
  back: '‹', chevronRight: '›', user: '👤', lock: '🔒', bell: '🔔', help: '❓',
  info: 'ℹ️', logout: '🚪', camera: '📷', check: '✓', eye: '👁', eyeOff: '🙈',
  message: '💬', star: '⭐', bug: '🐛', globe: '🌐', shield: '🛡', phone: '📞', moon: '🌙',
};

/* color 기본값에 고정 테마 대신 theme.primary가 유동적으로 적용되도록 내부 처리 */
export const Icon = ({ name, size = 18, color, style }) => {
  const { theme } = useTheme(); // 전역 테마 상태 가져오기
  const activeColor = color || theme.primary;
  const isArrow = name === 'back' || name === 'chevronRight';

  return (
    <Text style={[{ fontSize: isArrow ? size + 8 : size, color: activeColor, lineHeight: isArrow ? size + 12 : size + 4, textAlign: 'center' }, style]}>
      {IconMap[name] || '•'}
    </Text>
  );
};

export const Toggle = ({ value, onChange }) => {
  const { theme } = useTheme(); // 전역 테마 상태 가져오기

  return (
    <Switch 
      value={value} 
      onValueChange={onChange} 
      trackColor={{ false: theme.card || '#E5E8EB', true: theme.primary }} 
      thumbColor="#ffffff" 
      ios_backgroundColor={theme.card || '#E5E8EB'} 
    />
  );
};

export const Header = ({ title, onBack }) => {
  const { theme } = useTheme(); // 전역 테마 상태 가져오기

  return (
    <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.divider }]}>
      <TouchableOpacity onPress={onBack} style={styles.headerBackBtn}>
        <Icon name="back" size={22} color={theme.textMain} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.textMain }]}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
};

export const InputField = ({ label, value, onChange, placeholder, secureTextEntry = false, hint }) => {
  const { theme } = useTheme(); // 전역 테마 상태 가져오기
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={[styles.inputLabel, { color: theme.textMain }]}>{label}</Text>
      <View style={{ position: 'relative' }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted || theme.textSub}
          secureTextEntry={secureTextEntry && !show}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input, 
            { 
              color: theme.textMain,
              backgroundColor: theme.card,
              borderColor: focused ? theme.primary : (theme.divider || theme.border) 
            }, 
            secureTextEntry && { paddingRight: 48 }
          ]}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShow(!show)} style={styles.eyeBtn}>
            <Icon name={show ? 'eyeOff' : 'eye'} size={16} color={theme.textSub} />
          </TouchableOpacity>
        )}
      </View>
      {/* 힌트 메시지 색상 매핑 - 성공 유무에 따른 분기 */}
      {!!hint && <Text style={[styles.inputHint, { color: hint.startsWith('✓') ? (theme.success || '#4CD964') : (theme.danger || '#FF3B30') }]}>{hint}</Text>}
    </View>
  );
};

export const PrimaryBtn = ({ label, onPress, disabled, danger }) => {
  const { theme } = useTheme(); // 전역 테마 상태 가져오기

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled} 
      style={[
        styles.primaryBtn, 
        { backgroundColor: theme.primary }, // 기본 버튼 배경색 연동
        danger && { backgroundColor: theme.danger || '#FF3B30' }, 
        disabled && { backgroundColor: theme.border || '#E5E8EB' }
      ]} 
      activeOpacity={0.85}
    >
      <Text style={[styles.primaryBtnText, { color: '#ffffff' }, disabled && { color: theme.textMuted || theme.textSub }]}>{label}</Text>
    </TouchableOpacity>
  );
};