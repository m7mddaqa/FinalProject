import AsyncStorage from "@react-native-async-storage/async-storage";

export const getToken = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            console.log('Token found:', token); //token exists, user is logged in
            return true; //user is logged in
        } else {
            console.log('No token found, user is not logged in.');
            return null; //user is not logged in
        }
    } catch (err) {
        console.error('Error checking token:', err);
        return null;
    }
}

//function to check if the user is logged in
export const isLoggedIn = async () => {
    console.log('Checking login status...'); //debug log
    const token = await getToken();
    return !!token; //return true if token exists, false if not
}