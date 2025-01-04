import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Home from './screens/Home';
import LoginPage from './screens/LoginPage';
import SignupPage from './screens/SignupPage';
import MapPage from './screens/MapPage';
import ProfilePage from './screens/ProfilePage';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function MyDrawer() {
  return (
    <Drawer.Navigator initialRouteName="MapPage">
      <Drawer.Screen name="MapPage" component={MapPage} options={{ title: 'Map' }} />
      <Drawer.Screen name="ProfilePage" component={ProfilePage} options={{ title: 'Profile' }} />
    </Drawer.Navigator>
  );
}

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
        name="Drawer"
        component={MyDrawer}
        options={{
          headerShown: false,
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