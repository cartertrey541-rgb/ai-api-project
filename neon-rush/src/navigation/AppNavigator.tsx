import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { GameScreen } from '../screens/GameScreen';
import { GameOverScreen } from '../screens/GameOverScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export type RootStackParamList = {
  Home: undefined;
  Game: { characterId: string };
  GameOver: { score: number; coinsEarned: number; isNewHighScore: boolean };
  Shop: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => (
  <NavigationContainer>
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#08081a' },
        animationEnabled: true,
      }}
      initialRouteName="Home"
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="Game"
        component={GameScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="GameOver"
        component={GameOverScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="Shop" component={ShopScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);
