import React, { useEffect, useState, useCallback } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  NativeEventEmitter,
  TouchableOpacity,
  View,
  Keyboard,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants';
import { DecorationShape } from '../assets/images';
import { CustomButton, CustomHeader } from '../components';
import { DownIcon } from '../assets/icons';
import { AccessToken, LoginManager } from 'react-native-fbsdk';
import TextTranslate from '../translate/TextTranslate'
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { googleConfig } from '../config';
import {
  loginWithFacebook,
  loginWithPhoneNumber,
  loginWithGoogle,
} from '../store/actions/auth';
import { useDispatch, useSelector } from 'react-redux';
import TextInputMask from 'react-native-text-input-mask';
import PhoneIcon from '../assets/icons/PhoneIcon';
import auth from '@react-native-firebase/auth';
import LoadingUtil from '../helpers/LoaderUtil';
import { getCurrentCountry } from '../store/actions/countries';

GoogleSignin.configure(googleConfig);

const eventEmitter = new NativeEventEmitter();
let subscription;

export default function LoginScreen(props) {
  const selectedCountry = useSelector(
    (state) => state.countries.selectedCountry,
  );
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hasPhoneLoginError, setHasPhoneLoginError] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
  const dispatch = useDispatch();
  // For phone login
  const onAuthStateChanged = useCallback(
    async (user) => {
      if (user) {
        const { token } = await user.getIdTokenResult();
        subscription.remove();
        try {
          dispatch(loginWithPhoneNumber(token));
          await auth().signOut();
        } catch (err) {
          console.log(err);
        }
      }
    },
    [dispatch],
  );

  useEffect(() => {
    console.log('GET CURRENT COUNTRY');
    dispatch(getCurrentCountry());
  }, [dispatch]);

  useEffect(() => {
    return auth().onAuthStateChanged(onAuthStateChanged);
  }, [onAuthStateChanged]);

  const confirmCode = useCallback(
    async ({ code }) => {
      try {
        LoadingUtil.showLoading();
        await confirm.confirm(code);
      } catch (err) {
        let errorMessage;
        switch (err.code) {
          case 'auth/session-expired':
            errorMessage = 'The pin expired. Please re-send and try again.';
            break;
          case 'auth/invalid-verification-code':
            errorMessage = 'The pin was invalid. Please try again.';
            break;
        }
        props.navigation.navigate('Verification', { errorMessage: errorMessage });
      }
    },
    [confirm, props.navigation],
  );

  useEffect(() => {
    if (subscription) {
      subscription.remove();
    }
    subscription = eventEmitter.addListener('event.confirmCode', confirmCode);
    return () => {
      subscription.remove();
    };
  }, [confirmCode]);

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      LoadingUtil.showLoading();
      try {
        dispatch(loginWithGoogle(userInfo.idToken));
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
      } catch (err) {
        console.log(err);
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('In progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play service not available');
      } else {
        console.log(error);
      }
    }
  };

  const handleFacebookLogin = () => {
    LoginManager.logInWithPermissions([
      'public_profile',
      'email',
      // 'user_location',
      // 'user_birthday',
      // 'user_gender',
    ]).then(
      (result) => {
        if (result.isCancelled) {
          console.log('Login cancelled');
        } else {
          AccessToken.getCurrentAccessToken().then((data) => {
            setTimeout(() => {
              LoadingUtil.showLoading();
              try {
                dispatch(loginWithFacebook(data.accessToken, data.userID));
              } catch (err) {
                console.log(err);
              }
            }, 1000);
          });
        }
      },
      (error) => {
        console.log('Login fail with error: ' + error);
      },
    );
  };

  const handlePhoneLogin = async () => {
    if (isLoggingIn) {
      return;
    }
    try {
      setHasPhoneLoginError(false);
      Keyboard.dismiss();
      setIsLoggingIn(true);
      if (!confirm) {
        const confirmation = await auth().signInWithPhoneNumber(
          `+${selectedCountry?.callingCode}${phoneNumber}`,
        );
        setConfirm(confirmation);
      }
      setIsLoggingIn(false);
      props.navigation.navigate('Verification', {
        errorMessage: null,
        phoneNumber: formattedPhoneNumber,
      });
    } catch (err) {
      setIsLoggingIn(false);
      setHasPhoneLoginError(true);
      console.log(err);
    }
  };

  const onChangePhoneNumber = (formatted, extracted) => {
    if (extracted.length >= 9) {
      setButtonDisabled(false);
    } else {
      setButtonDisabled(true);
    }
    setFormattedPhoneNumber(formatted);
    setPhoneNumber(extracted);
    setHasPhoneLoginError(false);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="height">
      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContainer}>
        <DecorationShape style={styles.topRight} width={137} height={137} />
        <CustomHeader title="Hello" hideBackButton />
        <View style={styles.container}>
          <View style={styles.mainContentContainer}>
            <TextTranslate id={'loginTo'} style={styles.subtitle} />
            <View style={styles.mainContent}>
              <View style={styles.labelContainer}>
                <PhoneIcon />
                <Text style={styles.label}>Phone number</Text>
              </View>
              <View>
                <View>
                  <TextInputMask
                    style={styles.input}
                    selectionColor={COLORS.primary}
                    autocomplete={false}
                    editable={!isLoggingIn}
                    autoskip={false}
                    placeholder="Enter phone number"
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.neutral3}
                    onChangeText={onChangePhoneNumber}
                    mask={`+${selectedCountry?.callingCode}{ }[000]{ }[000]{ }[0000]`}
                    value={phoneNumber}
                    blurOnSubmit
                  />
                  <TouchableOpacity
                    disabled={isLoggingIn}
                    style={styles.country}
                    onPress={() => {
                      props.navigation.navigate('Country', {
                        currentCountryCode: selectedCountry.code,
                      });
                    }}>
                    <Image
                      style={styles.flag}
                      source={{ uri: selectedCountry?.flag }}
                      resizeMode="contain"
                    />
                    <DownIcon />
                    <View style={styles.verticalDivider} />
                  </TouchableOpacity>
                </View>
                {hasPhoneLoginError && (
                  <Text style={styles.error}>
                    An error occurred. Please try again.
                  </Text>
                )}
              </View>
            </View>

            <CustomButton
              disabled={buttonDisabled || isLoggingIn}
              title={isLoggingIn ? 'Please wait...' : 'Next'}
              onPress={handlePhoneLogin}
            />
          </View>
          <View>
            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>or connect with</Text>
              <View style={styles.line} />
            </View>
            <CustomButton
              disabled={isLoggingIn}
              style={styles.marginBottom}
              title="Facebook"
              icon="facebook"
              onPress={handleFacebookLogin}
            />
            <CustomButton
              disabled={isLoggingIn}
              title="Google"
              icon="google"
              onPress={() => {
                handleGoogleSignIn();
              }}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.neutral5,
  },
  scrollView: {
    height: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  topRight: {
    top: 0,
    right: -0.5,
  },
  subtitle: {
    ...FONTS.body1M,
    color: COLORS.neutral2,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  mainContentContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  mainContent: {
    marginTop: SIZES.windowHeight > 811 ? 0 : 58,
    marginBottom: SIZES.windowHeight > 811 ? 0 : 37,
  },
  country: {
    width: 73,
    height: 44,
    position: 'absolute',
    bottom: 0,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    width: 24,
    height: 44,
    // borderRadius: 2,
    marginLeft: 16,
  },
  verticalDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.neutral3,
    borderRadius: 0.5,
  },
  textInput: {
    paddingLeft: 85,
  },
  divider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 19,
    marginBottom: 40,
    marginTop: 40,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.neutral3,
  },
  dividerText: {
    ...FONTS.body2,
    color: COLORS.neutral2,
    textAlignVertical: 'center',
    marginHorizontal: 7,
  },
  input: {
    paddingLeft: 85,
    height: 44,
    backgroundColor: COLORS.neutral4,
    borderRadius: 22,
    ...FONTS.body1M,
    color: COLORS.neutral1,
    paddingRight: 16,
    paddingVertical: 0,
  },
  labelContainer: {
    flexDirection: 'row',
  },
  label: {
    ...FONTS.title2,
    color: COLORS.neutral2,
    marginLeft: 8,
  },
  marginBottom: { marginBottom: 16 },
  error: {
    ...FONTS.body2,
    color: '#FF8674',
    marginTop: 8,
  },
});
