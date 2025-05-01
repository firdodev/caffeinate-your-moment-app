import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import BackButton from '@/components/BackButton';
import Input from '@/components/Input';
import * as Icon from 'phosphor-react-native';
import Button from '@/components/Button';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolate
} from 'react-native-reanimated';
import { useAuth } from '@/contexts/authContext';

const springConfig = {
  damping: 12,
  stiffness: 100,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 2
};

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Using state for form inputs
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const progress = useSharedValue(0);
  const dotScales = [useSharedValue(1.25), useSharedValue(1), useSharedValue(1)];

  const { register: registerUser } = useAuth();

  useEffect(() => {
    progress.value = withSpring((currentStep - 1) / (totalSteps - 1), springConfig);

    dotScales.forEach((scale, index) => {
      if (index + 1 === currentStep) {
        scale.value = withSpring(1.25, springConfig);
      } else if (index + 1 < currentStep) {
        scale.value = withSpring(1, springConfig);
      } else {
        scale.value = withSpring(1, springConfig);
      }
    });
  }, [currentStep]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`
    };
  });

  const getDotStyle = (index: number) => {
    return useAnimatedStyle(() => {
      return {
        transform: [{ scale: dotScales[index].value }],
        backgroundColor:
          currentStep > index + 1 ? colors.primary : currentStep === index + 1 ? colors.primary : colors.neutral300
      };
    });
  };

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1 && !username) {
      Alert.alert('Registration', 'Please enter a username');
      return;
    } else if (currentStep === 2 && !email) {
      Alert.alert('Registration', 'Please enter an email');
      return;
    } else if (currentStep === 3) {
      if (!password || !confirmPassword) {
        Alert.alert('Registration', 'Please fill all password fields');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Registration', 'Passwords do not match');
        return;
      }
      // Submit registration
      handleSubmit();
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    const res = await registerUser(email, password, username);

    setIsLoading(false);

    if (!res.success) {
      Alert.alert('Sign up', res.msg);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <View style={styles.stepConnectorBase} />
      <Animated.View style={[styles.stepConnectorFill, progressStyle]} />
      <View style={styles.dotsContainer}>
        {[...Array(totalSteps)].map((_, index) => (
          <Animated.View key={index} style={[styles.stepDotBase, getDotStyle(index)]} />
        ))}
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Input
            placeholder='Choose a username'
            onChangeText={setUsername}
            value={username}
            icon={<Icon.User size={verticalScale(26)} color={colors.neutral300} weight='fill' />}
          />
        );
      case 2:
        return (
          <Input
            placeholder='Enter your email'
            onChangeText={setEmail}
            value={email}
            icon={<Icon.At size={verticalScale(26)} color={colors.neutral300} weight='fill' />}
            keyboardType='email-address'
          />
        );
      case 3:
        return (
          <>
            <Input
              placeholder='Create password'
              secureTextEntry
              onChangeText={setPassword}
              value={password}
              icon={<Icon.Lock size={verticalScale(26)} color={colors.neutral300} weight='fill' />}
            />
            <Input
              placeholder='Confirm password'
              secureTextEntry
              onChangeText={setConfirmPassword}
              value={confirmPassword}
              icon={<Icon.LockKey size={verticalScale(26)} color={colors.neutral300} weight='fill' />}
            />
          </>
        );
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Username';
      case 2:
        return 'Email';
      case 3:
        return 'Password';
      default:
        return '';
    }
  };

  const getButtonText = () => {
    return currentStep === totalSteps ? 'Create Account' : 'Next';
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {currentStep === 1 ? (
          <BackButton iconSize={28} />
        ) : (
          <Pressable onPress={handleStepBack} style={styles.backStepButton}>
            <Icon.CaretLeft size={verticalScale(28)} color={colors.white} weight='bold' />
          </Pressable>
        )}

        <View style={{ gap: 5, marginTop: spacingY._20 }}>
          <Typo size={30} fontWeight={'800'}>
            Create
          </Typo>
          <Typo size={30} fontWeight={'800'}>
            New Account
          </Typo>
        </View>

        {renderStepIndicator()}

        <View style={styles.form}>
          <Typo size={18} fontWeight={'600'} color={colors.text}>
            {getStepTitle()}
          </Typo>

          <Typo size={16} color={colors.textLighter}>
            {currentStep === 1 && 'Choose a unique username'}
            {currentStep === 2 && "We'll send you verification email"}
            {currentStep === 3 && 'Create a strong password'}
          </Typo>

          {renderStepContent()}

          <Button loading={isLoading} onPress={handleNext}>
            <Typo fontWeight={'700'} color={colors.black} size={21}>
              {getButtonText()}
            </Typo>
          </Button>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Typo size={15}>Already have an account?</Typo>
          <Pressable onPress={() => router.push('/login')}>
            <Typo size={15} fontWeight={700} color={colors.primary}>
              Login
            </Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._20,
    paddingHorizontal: spacingX._20
  },
  backStepButton: {
    backgroundColor: colors.neutral600,
    alignSelf: 'flex-start',
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 5
  },
  stepIndicatorContainer: {
    marginTop: spacingY._20,
    marginBottom: spacingY._10,
    height: verticalScale(20),
    position: 'relative',
    justifyContent: 'center'
  },
  stepConnectorBase: {
    position: 'absolute',
    height: verticalScale(3),
    width: '100%',
    backgroundColor: colors.neutral300,
    borderRadius: verticalScale(1.5)
  },
  stepConnectorFill: {
    position: 'absolute',
    height: verticalScale(3),
    backgroundColor: colors.primary,
    borderRadius: verticalScale(1.5),
    left: 0
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    width: '100%',
    paddingHorizontal: verticalScale(2) // Small padding to align dots with ends
  },
  stepDotBase: {
    width: verticalScale(12),
    height: verticalScale(12),
    borderRadius: verticalScale(6),
    backgroundColor: colors.neutral300,
    borderWidth: 2,
    borderColor: colors.neutral100,
    // Shadow
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2
  },
  form: {
    gap: spacingY._20,
    marginTop: spacingY._10
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 'auto',
    paddingBottom: spacingY._20
  }
});
