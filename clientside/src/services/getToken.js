import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from 'jwt-decode';

export const getToken = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return null;

        console.log('Token found:', token); //token exists, user is logged in
        const decoded = jwtDecode(token);
        console.log('Decoded token:', decoded); // Add logging
        
        return {
            token,
            userId: decoded.id // Change from _id to id since that's what's in the token
        };
    } catch (error) {
        console.error('Error checking token:', error);
        return null;
    }
}

//function to check if the user is logged in
export const isLoggedIn = async () => {
    console.log('Checking login status...'); //debug log
    return await getToken();
}