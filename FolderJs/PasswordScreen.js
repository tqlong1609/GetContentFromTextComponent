import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import {COLORS, FONTS} from '../constants';
import {CustomButton, CustomHeader, CustomTextInput} from '../components';
import {CloseEyeIcon} from '../assets/icons';

export default function PasswordScreen(props) {
  return (
    <KeyboardAvoidingView style={styles.screen} behavior="height">
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <CustomHeader
          title="Password"
          onBackButtonPress={() => {
            props.navigation.goBack();
          }}
        />
        <View style={styles.container}>
          <View style={styles.responsivePadding1} />
          <View>
            <View>
              <CustomTextInput
                style={styles.textInput}
                icon="lock"
                label="Password"
                placeholder="Enter password"
                secureTextEntry={true}
              />
              <TouchableOpacity style={styles.toggle}>
                <CloseEyeIcon />
              </TouchableOpacity>
            </View>
            <View style={styles.textInputContainer}>
              <CustomTextInput
                style={styles.textInput}
                icon="lock"
                label="Confirm password"
                placeholder="Confirm password"
                secureTextEntry={true}
              />
              <TouchableOpacity style={styles.toggle}>
                <CloseEyeIcon />
              </TouchableOpacity>
            </View>

            <TouchableOpacity>
              <Text style={styles.question}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.responsivePadding3} />
          <CustomButton
            title="Next"
            onPress={() => {
              props.navigation.navigate('NewUser');
            }}
          />
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
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    marginTop: 10,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  textInputContainer: {
    marginTop: 16,
  },
  textInput: {
    paddingRight: 44,
  },
  question: {
    ...FONTS.body2,
    color: COLORS.neutral2,
    textAlign: 'right',
    marginTop: 8,
  },
  toggle: {
    position: 'absolute',
    right: 0,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 0,
  },
  responsivePadding1: {
    flexGrow: 1,
  },
  responsivePadding3: {
    flexGrow: 3,
  },
});
