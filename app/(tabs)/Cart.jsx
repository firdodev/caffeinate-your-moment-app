import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect } from 'react';
import WebView from 'react-native-webview';
import tw from 'twrnc';

import { Camera } from 'expo-camera';

const Cart = () => {
  useEffect(() => {
    Camera.requestCameraPermissionsAsync();
  }, []);
  return (
    <View style={tw`w-full h-full`}>
      <WebView
        source={{ uri: 'https://ar-web-lilac.vercel.app/' }} // ✅ no “www.”
        originWhitelist={['*']}
        javaScriptEnabled
        allowsInlineMediaPlayback // iOS-specific
        mediaPlaybackRequiresUserAction={false} // iOS-specific
        startInLoadingState
      />
    </View>
  );
};

export default Cart;

const styles = StyleSheet.create({});
