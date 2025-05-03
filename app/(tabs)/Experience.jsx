import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect } from 'react';
import WebView from 'react-native-webview';
import tw from 'twrnc';
import ScreenWrapper from '../../components/ScreenWrapper';
import { Camera } from 'expo-camera';

const Experience = () => {
  useEffect(() => {
    Camera.requestCameraPermissionsAsync();
  }, []);

  return (
    <ScreenWrapper showBackButton={true} backRoute='./'>
      <View style={tw`w-full h-full`}>
        <WebView
          source={{ uri: 'https://ar-web-lilac.vercel.app/' }} // ✅ no "www."
          originWhitelist={['*']}
          javaScriptEnabled
          allowsInlineMediaPlayback // iOS-specific
          mediaPlaybackRequiresUserAction={false} // iOS-specific
          startInLoadingState
        />
      </View>
    </ScreenWrapper>
  );
};

export default Experience;

const styles = StyleSheet.create({});
