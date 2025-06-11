import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MapPage from '../screens/MapPage';
import ProfilePage from '../screens/ProfilePage';
import CreatedEventsScreen from '../screens/CreatedEventsScreen';

const Stack = createStackNavigator();

function AppNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="MapPage" component={MapPage} />
            <Stack.Screen name="ProfilePage" component={ProfilePage} />
            <Stack.Screen name="CreatedEventsScreen" component={CreatedEventsScreen} />
        </Stack.Navigator>
    );
}

export default AppNavigator; 