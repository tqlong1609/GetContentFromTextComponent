import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  AppState,
  Linking,
  Modal,
  PermissionsAndroid,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {ChevronIcon} from '../assets/icons';
import {COLORS, FONTS, SIZES} from '../constants';
import CardStack from '../components/CardStack';
import {CustomButton} from '../components';
import LocationPermissionIcon from '../assets/icons/LocationPermissionIcon';
import Geolocation from 'react-native-geolocation-service';
import {useDispatch} from 'react-redux';
import {saveLatLong} from '../store/actions/filters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import {saveFcmTokenToDatabase, updateUserData} from '../store/actions/user';
import MatchModal from '../components/MatchModal';

export default function HomeScreen(props) {
  const appState = useRef(AppState.currentState);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const dispatch = useDispatch();

  const requestPositionPermission = async () => {
    try {
      const status = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (status === PermissionsAndroid.RESULTS.GRANTED) {
        setPermissionStatus(true);
        saveCurrentPosition();
      } else {
        setPermissionStatus(status);
      }
    } catch (err) {
      console.warn(err);
    }
  };
  // region Save current lat long
  const saveCurrentPosition = useCallback(async () => {
    const lastSave = await AsyncStorage.getItem('@last_Save');
    if (!lastSave || Date.now() - +lastSave >= 1800000) {
      console.log('[SAVE LAT LONG]');
      Geolocation.getCurrentPosition(
        (position) => {
          dispatch(
            saveLatLong({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          );
        },
        (error) => {
          console.log(error);
        },
        {
          timeout: 30000,
          accuracy: {
            android: 'balanced',
            ios: 'hundredMeters',
          },
          maximumAge: 10000,
        },
      );
    } else {
      dispatch(updateUserData({savingLocation: false}));
    }
  }, [dispatch]);
  useEffect(() => {
    PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ).then((granted) => {
      if (granted) {
        setPermissionStatus(true);
        saveCurrentPosition();
      } else {
        setPermissionStatus('denied');
      }
    });
  }, [saveCurrentPosition]);
  // endregion
  // region Check for location permission
  const handleAppStateChange = useCallback(
    (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ).then((granted) => {
          if (granted) {
            setPermissionStatus(true);
            saveCurrentPosition();
          }
        });
      }
      appState.current = nextAppState;
    },
    [saveCurrentPosition],
  );
  useEffect(() => {
    AppState.addEventListener('change', handleAppStateChange);
    return () => {
      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, [handleAppStateChange]);
  // endregion
  // region Save FCM token
  const saveFcmToken = useCallback(
    async (token) => {
      const currentToken = await AsyncStorage.getItem('@fcm_Token');
      if (!token) {
        if (!currentToken) {
          console.log('[SAVE NEW FCM TOKEN]');
          const fcmToken = await messaging().getToken();
          dispatch(saveFcmTokenToDatabase(fcmToken));
        }
      } else {
        if (currentToken && currentToken !== token) {
          console.log('[FCM TOKEN CHANGED]');
          dispatch(saveFcmTokenToDatabase(token));
        }
      }
    },
    [dispatch],
  );
  useEffect(() => {
    saveFcmToken(null);
    return messaging().onTokenRefresh((token) => {
      saveFcmToken(token);
    });
  }, [saveFcmToken]);
  // endregion

  return (
    <View style={styles.screen}>
      {(permissionStatus === 'denied' ||
        permissionStatus === 'never_ask_again') && (
        <Modal statusBarTranslucent>
          <View style={styles.permissionRequest}>
            <LocationPermissionIcon style={styles.alignCenter} />
            <View>
              <Text style={styles.title}>
                {permissionStatus === 'never_ask_again'
                  ? 'Oops'
                  : 'Enable Location'}
              </Text>
              <Text style={styles.subtitle}>
                You will need to enable your location in order to use Vous.
              </Text>
            </View>
            <CustomButton
              title={
                permissionStatus === 'never_ask_again'
                  ? 'Go To Settings'
                  : 'Allow Access'
              }
              onPress={() => {
                if (permissionStatus === 'denied') {
                  requestPositionPermission();
                }
                if (permissionStatus === 'never_ask_again') {
                  Linking.openSettings();
                }
              }}
            />
            {permissionStatus === 'denied' && (
              <TouchableOpacity style={styles.moreButton}>
                <Text style={styles.moreText}>Tell me more</Text>
                <ChevronIcon
                  size={14}
                  direction="down"
                  fillColor={COLORS.neutral3}
                />
              </TouchableOpacity>
            )}
          </View>
        </Modal>
      )}
      {permissionStatus === true && (
        <CardStack
          navigation={props.navigation}
          onSwipeLeft={(profileId) => {
            console.log('nope', profileId);
          }}
          onSwipeRight={(profileId) => {
            console.log('like', profileId);
          }}
          onPressViewDetails={(id) => {
            console.log(id);
          }}
        />
      )}
      <MatchModal navigation={props.navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.neutral5,
    paddingBottom: 60,
  },
  tabBar: {
    position: 'absolute',
    width: SIZES.windowWidth,
    height: 60,
    bottom: 0,
    backgroundColor: COLORS.neutral5,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderColor: COLORS.neutral4,
    borderWidth: 1,
    borderBottomWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBarButton: {
    height: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionRequest: {
    width: SIZES.windowWidth,
    height: SIZES.windowHeight,
    backgroundColor: COLORS.neutral5,
    justifyContent: 'center',
    padding: 28,
  },
  alignCenter: {
    alignSelf: 'center',
  },
  title: {
    ...FONTS.largeTitle,
    color: COLORS.neutral1,
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  subtitle: {
    ...FONTS.body1M,
    color: COLORS.neutral1,
    textAlign: 'center',
    marginBottom: 100,
  },
  moreButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    flexDirection: 'row',
  },
  moreText: {
    ...FONTS.title2,
    color: COLORS.neutral3,
    marginRight: 5,
  },
});
