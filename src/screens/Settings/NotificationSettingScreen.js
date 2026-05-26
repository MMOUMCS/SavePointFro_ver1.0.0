import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Header, Toggle } from './components';
import { styles } from './styles';

export const NotificationSettingScreen = ({ onBack }) => {
  const [settings, setSettings] = useState({
    pushAll: true, newMessage: true, comment: true, like: false, mention: true, marketing: false, nightQuiet: true, email: false,
  });

   const toggle = (key) => {
    setSettings((prev) => {
      // 1. 마스터 스위치(푸시 알림)를 누른 경우 -> 전체 켜고 끄기
      if (key === 'pushAll') {
        const nextValue = !prev.pushAll;
        return {
          pushAll: nextValue,
          newMessage: nextValue,
          comment: nextValue,
          like: nextValue,
          mention: nextValue,
          nightQuiet: nextValue,
          marketing: nextValue,
          email: nextValue,
        };
      }

      // 2. 일반 개별 스위치를 누른 경우
      const updated = { ...prev, [key]: !prev[key] };
      
      // 개별 알림을 하나라도 끄면 마스터 스위치(pushAll)도 꺼짐 처리
      if (!updated[key]) {
        updated.pushAll = false;
      }
      
      return updated;
    });
  };

  const Section = ({ title, children }) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );

  const Row = ({ label, sub, value, onToggle, last }) => (
    <View style={[styles.notifRow, !last && styles.rowBorder]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Toggle value={value} onChange={onToggle} />
    </View>
  );

  return (
    <View style={styles.screen}>
      <Header title="알림 설정" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Section title="전체 알림">
          <Row label="푸시 알림" sub="모든 알림을 한 번에 켜고 끕니다" value={settings.pushAll} onToggle={() => toggle('pushAll')} last />
        </Section>
        <Section title="활동 알림">
          <Row label="새 메시지" value={settings.newMessage} onToggle={() => toggle('newMessage')} />
          <Row label="댓글" value={settings.comment} onToggle={() => toggle('comment')} />
          <Row label="좋아요" value={settings.like} onToggle={() => toggle('like')} />
          <Row label="멘션" sub="나를 언급한 경우 알림" value={settings.mention} onToggle={() => toggle('mention')} last />
        </Section>
        <Section title="기타">
          <Row label="야간 방해 금지" sub="오후 10시 ~ 오전 8시" value={settings.nightQuiet} onToggle={() => toggle('nightQuiet')} />
          <Row label="마케팅 알림" sub="이벤트 및 혜택 정보" value={settings.marketing} onToggle={() => toggle('marketing')} />
          <Row label="이메일 수신" value={settings.email} onToggle={() => toggle('email')} last />
        </Section>
      </ScrollView>
    </View>
  );
};