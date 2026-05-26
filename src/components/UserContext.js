import AsyncStorage from '@react-native-async-storage/async-storage'; //  누락방지용 임포트 체크
import { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [partnerData, setPartnerData] = useState(null); 

  //  변수를 함수 '외부'에 선언하여 클로저나 리렌더링에 영향받지 않는 확실한 API 락(Lock)을 겁니다.
  let isFetching = false;

  const fetchPartnerInfo = async (baseUrl) => {
  // 락이 걸려있거나 이미 데이터가 존재하면 API 호출을 절대 하지 않음
  if (isFetching || partnerData) return;

  const token = userData?.accessToken || userData?.token;
  if (!token) return;

  try {
    isFetching = true; // API 요청 시작과 동시에 문 잠그기
    
    const response = await fetch(`${baseUrl}/api/v1/couples/partner`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setPartnerData(data);
    } 
    // 백엔드에서 401 Unauthorized(토큰 만료)를 뱉었을 때!
    else if (response.status === 401) {
      console.log("토큰이 만료되어 파트너 정보를 가져올 수 없음");
      
      // 1. 기기 저장소 비우기
      await AsyncStorage.removeItem('accessToken').catch(() => {});
      await AsyncStorage.removeItem('token').catch(() => {});
      await AsyncStorage.removeItem('userData').catch(() => {}); // 자동 로그인용 데이터도 함께 삭제

      // 2. 알럿창 띄우기
      Alert.alert(
        '로그인 만료',
        '세션이 만료되었습니다. 다시 로그인해주세요.',
        [
          {
            text: '확인',
            onPress: () => {
              // 다른 거 호출할 필요 없이, 상태만 null로 바꾸면 
              // index.js의 감시 이펙트가 알아서 Login 화면으로 전환해 줍니다!
              setUserData(null);
              setPartnerData(null);
            }
          }
        ]
      );
    }
  } catch (error) {
    console.error("Partner Fetch Error in Context:", error);
  } finally {
    isFetching = false; // 에러가 나든 성공하든 요청이 끝나면 문 열기
  }
};

  //  2. async 키워드 추가하여 await 에러 해결
  const logoutUser = async () => {
    try {
      setUserData(null);
      setPartnerData(null);
      setGalleryPhotos([]);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (e) {
      console.error("Logout Error:", e);
    }
  };

  return (
    <UserContext.Provider value={{ 
      userData, 
      setUserData, 
      galleryPhotos, 
      setGalleryPhotos,
      partnerData,
      setPartnerData,
      fetchPartnerInfo,
      logoutUser 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  return context; 
};