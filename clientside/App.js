// In App.js in a new project
import 'react-native-get-random-values';
import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { URL } from '@env';
import { ThemeProvider } from './src/context/ThemeContext';

import Home from './src/screens/Home';
import LoginPage from './src/screens/LoginPage';
import SignupPage from './src/screens/SignupPage';
import MapPage from './src/screens/MapPage';
import ProfilePage from './src/screens/ProfilePage';
import Settings from './src/screens/Settings';
import EventDetailsScreen from './src/screens/EventDetailsScreen';
import ReportDetailsScreen from './src/screens/ReportDetailsScreen';

const Stack = createNativeStackNavigator();
function MyStack() {
  return (
    <Stack.Navigator>

      <Stack.Screen
        name="Home"
        component={Home}
        options={{
          title: 'Welcome to SafeSpot',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <Stack.Screen
        name="LoginPage"
        component={LoginPage}
        options={{
          title: 'Login to your account',
          headerStyle: { backgroundColor: '#067ef5' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <Stack.Screen
        name="SignupPage"
        component={SignupPage}
        options={{
          title: 'Signup for an account',
          headerStyle: { backgroundColor: '#067ef5' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <Stack.Screen
        name="MapPage"
        component={MapPage}
        options={{
          title: 'Map',
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="ProfilePage"
        component={ProfilePage}
        options={{
          title: 'Profile',
          headerStyle: { backgroundColor: '#067ef5' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{
          title: 'Event Details',
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="ReportDetails"
        component={ReportDetailsScreen}
        options={{
          title: 'Add Report Details',
          headerShown: false,
        }}
      />

    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <MyStack />
      </NavigationContainer>
    </ThemeProvider>
  );
}