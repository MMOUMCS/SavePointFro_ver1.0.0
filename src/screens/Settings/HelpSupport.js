import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../components/ThemeContext'; // 고정 테마를 지우고 전역 테마 훅 임포트
import { Header, Icon } from './components';
import { styles } from './styles';

export const HelpScreen = ({ onBack }) => {
  const { theme } = useTheme(); // 전역 테마 상태 가져오기
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState(null);

  const faqs = [
    { q: '비밀번호를 잊어버렸어요', a: '로그인 화면에서 "비밀번호 찾기"를 눌러 이메일로 재설정 링크를 받을 수 있습니다.' },
    { q: '회원 탈퇴는 어떻게 하나요?', a: '설정 > 계정 > 회원 탈퇴에서 진행할 수 있습니다. 탈퇴 후 30일간 계정이 보관됩니다.' },
    { q: '알림이 오지 않아요', a: '기기의 알림 권한을 확인하고, 앱 내 알림 설정에서 원하는 항목이 켜져 있는지 확인해주세요.' },
    { q: '결제 취소는 어떻게 하나요?', a: '결제일로부터 7일 이내에 고객센터로 문의해주시면 처리해드립니다.' },
  ];

  /* 테마 상태에서 고유 컬러 값을 받아와 뒤에 투명도(15)를 결합하는 방식으로 라이트/다크 분기 처리 */
  const contacts = [
    { icon: 'message', label: '1:1 채팅 문의', sub: '평균 응답 5분', color: theme.primary, bg: `${theme.primary}15` },
    { icon: 'phone', label: '전화 문의', sub: '평일 09~18시', color: theme.success || '#4CD964', bg: `${theme.success || '#4CD964'}15` },
    { icon: 'bug', label: '버그 신고', sub: '불편함 개선', color: theme.warning || '#FF9500', bg: `${theme.warning || '#FF9500'}15` },
  ];

  return (
    /* 전체 화면 배경색을 현재 테마의 bg 색상으로 연동 */
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <Header title="문의 & 서포트" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contactGrid}>
          {contacts.map(({ icon, label, sub, color, bg }) => {
            const isSelected = selected === label;
            return (
              <TouchableOpacity 
                key={label} 
                onPress={() => setSelected(label)} 
                style={[
                  styles.contactCard, 
                  { backgroundColor: isSelected ? color : bg }, 
                  isSelected && { borderColor: color }
                ]} 
                activeOpacity={0.85}
              >
                {/* 비선택 상태일 때 아이콘 박스 배경을 테마의 card 색상과 연동 */}
                <View style={[styles.contactIconBox, { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : theme.card }]}>
                  <Icon name={icon} size={20} color={isSelected ? '#fff' : color} />
                </View>
                <Text style={[styles.contactLabel, { color: isSelected ? '#fff' : theme.textMain }]}>{label}</Text>
                <Text style={[styles.contactSub, { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.textSub }]}>{sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 섹션 타이틀 텍스트 색상 연동 */}
        <Text style={[styles.sectionTitle, { color: theme.textMain }]}>자주 묻는 질문</Text>
        {/* 카드 컴포넌트 배경색 연동 */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          {faqs.map(({ q, a }, i) => (
            <View key={i} style={[i < faqs.length - 1 ? styles.rowBorder : null, { borderBottomColor: theme.divider }]}>
              <TouchableOpacity onPress={() => setExpanded(expanded === i ? null : i)} style={styles.faqRow} activeOpacity={0.7}>
                {/* 질문 텍스트 색상 연동 */}
                <Text style={[styles.rowLabel, { flex: 1, color: theme.textMain }]}>{q}</Text>
                {/* 회전하는 화살표 기호 색상 연동 */}
                <Text style={[styles.chevronText, { color: theme.textSub, transform: [{ rotate: expanded === i ? '90deg' : '0deg' }] }]}>›</Text>
              </TouchableOpacity>
              {/* FAQ 답변 텍스트 색상 연동 */}
              {expanded === i && <Text style={[styles.faqAnswer, { color: theme.textSub }]}>{a}</Text>}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};