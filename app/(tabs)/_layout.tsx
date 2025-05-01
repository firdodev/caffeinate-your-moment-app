// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import CustomTabs from '@/components/CustomTabs';

export default function Layout() {
  return (
    <Tabs tabBar={props => <CustomTabs {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name='index' />
      <Tabs.Screen name='Jobs' />
      <Tabs.Screen name='Events' />
      <Tabs.Screen name='Community' />
    </Tabs>
  );
}
