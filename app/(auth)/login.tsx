import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useRef, useState } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import BackButton from '@/components/BackButton';
import Input from '@/components/Input';
import * as Icon from 'phosphor-react-native';
import Button from '@/components/Button';
import { useRouter } from 'expo-router';

const Login = () => {
  const emailRef = useRef('');
  const passRef = useRef('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = () => {
    if (!emailRef.current || !passRef.current) {
      Alert.alert('Login', 'Please fill all the fields');
      return;
    }
    console.log('email: ', emailRef.current);
    console.log('password: ', passRef.current);

    router.push('/home');
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <BackButton iconSize={28} />

        <View style={{ gap: 5, marginTop: spacingY._20 }}>
          <Typo size={30} fontWeight={'800'}>
            Hey,
          </Typo>
          <Typo size={30} fontWeight={'800'}>
            Welcome Back
          </Typo>
        </View>

        <View style={styles.form}>
          <Typo size={16} color={colors.textLighter}>
            Login now more jobs and events are added
          </Typo>
          <Input
            placeholder='Enter your email'
            onChangeText={value => (emailRef.current = value)}
            icon={<Icon.At size={verticalScale(26)} color={colors.neutral300} weight='fill' />}
          />
          <Input
            placeholder='Enter your password'
            secureTextEntry
            onChangeText={value => (passRef.current = value)}
            icon={<Icon.Lock size={verticalScale(26)} color={colors.neutral300} weight='fill' />}
          />

          <Typo size={14} color={colors.text} style={{ alignSelf: 'flex-end' }}>
            Forgot Password?
          </Typo>

          <Button loading={isLoading} onPress={handleSubmit}>
            <Typo fontWeight={'700'} color={colors.black} size={21}>
              {' '}
              Login
            </Typo>
          </Button>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Typo size={15}>Don't have an account?</Typo>
          <Pressable onPress={() => router.push('/register')}>
            <Typo size={15} fontWeight={700} color={colors.primary}>
              Sign up
            </Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._30,
    paddingHorizontal: spacingX._20
  },
  welcomeText: {
    fontSize: verticalScale(20),
    fontWeight: 'bold',
    color: colors.text
  },
  form: {
    gap: spacingY._20
  },
  forgotPassword: {
    textAlign: 'right',
    fontWeight: '500',
    color: colors.text
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5
  },
  footerText: {
    textAlign: 'center',
    color: colors.text,
    fontSize: verticalScale(15)
  }
});
