// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import CustomTabs from '../../components/CustomTabs';

export default function Layout() {
  return (
    <Tabs tabBar={props => <></>} screenOptions={{ headerShown: false }}>
      {/* <Tabs.Screen name='index' />
      <Tabs.Screen name='Cart' />
      <Tabs.Screen name='Menu' />
      <Tabs.Screen name='Orders' />
      <Tabs.Screen name='Profile' /> */}
    </Tabs>
  );
}
