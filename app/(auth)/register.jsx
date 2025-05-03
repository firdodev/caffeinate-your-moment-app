import { Alert, Pressable, StyleSheet, View } from 'react-native';
import React, { useState } from 'react';
import ScreenWrapper from '../../components/ScreenWrapper';
import Typo from '../../components/Typo';
import { colors, spacingX, spacingY } from '../../constants/theme';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/authContext';
import Input from '../../components/Input';

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const router = useRouter();
  const { register } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password || !username) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const result = await register(email, password, username);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Sign up Failed', result.msg);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <BackButton iconSize={28} />

        <View style={{ gap: 5, marginTop: spacingY._20 }}>
          <Typo size={30} fontWeight={'800'}>
            Create
          </Typo>
          <Typo size={30} fontWeight={'800'}>
            New Account
          </Typo>
        </View>

        <View style={styles.form}>
          <Typo size={16} color={colors.textLighter}>
            Sign up to get started with our app
          </Typo>

          <Input placeholder='Username' value={username} onChangeText={setUsername} autoCapitalize='none' />

          <Input
            placeholder='Email'
            value={email}
            onChangeText={setEmail}
            keyboardType='email-address'
            autoCapitalize='none'
          />

          <Input placeholder='Password' value={password} onChangeText={setPassword} secureTextEntry />

          <Button loading={isLoading} onPress={handleSubmit}>
            <Typo fontWeight={'700'} color={colors.black} size={21}>
              Sign up
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
    gap: spacingY._30,
    paddingHorizontal: spacingX._20
  },
  form: {
    gap: spacingY._20
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
