import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

export const getUserType = async () => {
    try {
        console.log('Getting user type...');
        // First try to get from AsyncStorage
        const storedUserType = await AsyncStorage.getItem('userType');
        console.log('Stored user type:', storedUserType);
        if (storedUserType) {
            return storedUserType;
        }

        // If not in AsyncStorage, try to get from token
        const token = await AsyncStorage.getItem('token');
        console.log('Token exists:', !!token);
        if (!token) return null;
        
        const decoded = jwtDecode(token);
        console.log('Decoded token:', decoded);
        return decoded.userType;
    } catch (error) {
        console.error('Error getting user type:', error);
        return null;
    }
};

export const isVolunteer = async () => {
    const userType = await getUserType();
    console.log('Final user type:', userType);
    return userType === 'volunteer';
}; 