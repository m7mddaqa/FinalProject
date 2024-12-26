// In App.js in a new project
import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './src/screens/Home';
import LoginPage from './src/screens/LoginPage';
import SignupPage from './src/screens/SignupPage';

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

    </Stack.Navigator>
  );
}


export default function App() {
  return (
    <NavigationContainer>
      <MyStack />
    </NavigationContainer>
  );
}