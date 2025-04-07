import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { styles } from '../styles/LoginPageStyle.js';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from '../services/getToken.js';
import { URL } from '@env';

const SignInPage = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [Loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isUsernameValid, setIsUsernameValid] = useState(true);
    const [isPasswordValid, setIsPasswordValid] = useState(true);
    const [isCheckingToken, setIsCheckingToken] = useState(true);

    //checking if a token exists, as soon as the component is mounted (signin page loads up), it checks if theres a token in the storage, if there is then it redirects to Home
    //if there is no token, it allows the login page to render
    //page is rendered first (return part gets triggered and then the useEffect is triggered)
    useEffect(() => {
        const checkToken = async () => {
            const token = await getToken();
            if (token) {
                navigation.navigate('Home');
            } else {
                setIsCheckingToken(false);
            }
        };
        checkToken();
    }, []); //runs only once when the component is mounted
    //if the array is empty it will only render once, 
    //if the array has [dependency1, dependency2] it will initially run when the component is mounted then every time one of the components changes
    //if theres no array, it will run after every render of the component

    const handleSignIn = async () => {
        try {
            setLoading(true);
            setError('');
            setIsUsernameValid(true);
            setIsPasswordValid(true);
            if (!username) {
                setError('Please enter your username');
                setLoading(false);
                setIsUsernameValid(false);
                return;
            }
            if (!password) {
                setError('Please enter your password');
                setLoading(false);
                setIsPasswordValid(false);
                return;
            }
            const response = await axios.post(`${URL}/login`, {
                username: username,
                password: password
            });
            const token = response.data.token;
            //save the token to asyncstorage
            await AsyncStorage.setItem('token', token);
            console.log('Success user logged in successfully', response.data);
            navigation.navigate('Home');
        }
        catch (err) {
            if (err.response.data.message) {
                setError(err.response.data.message);
                //for any other unidentified errors
            } else {
                console.error('Unexpected Error:', err);
                setError('An unexpected error occurred. Please try again later.');
            }
        }
        finally {
            setLoading(false);
        }
    };

    if (isCheckingToken) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                {/* can be replaced with spinping loading logo: */}
                <Text>Loading...</Text>
            </View>
        );
    }
    return (
        <View style={styles.container}>
            <View style={styles.frameContainer}>

                <Text style={styles.header}>Sign In</Text>

                <TextInput
                    style={!isUsernameValid ? styles.colorBoxRed : styles.textInput}
                    placeholder="Username"
                    placeholderTextColor="#888"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={setUsername}
                />

                <TextInput
                    style={!isPasswordValid ? styles.colorBoxRed : styles.textInput}
                    placeholder="Password"
                    placeholderTextColor="#888"
                    secureTextEntry
                    value={password}
                    autoCapitalize='none'
                    onChangeText={setPassword}
                />

                <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
                    <Text style={styles.buttonText}>Sign In</Text>
                </TouchableOpacity>

                <View style={styles.bottomButtons}>
                    <TouchableOpacity onPress={() => navigation.navigate('SignupPage')} disabled={Loading}>
                        <Text style={styles.signupNavigate}>Don't have an account?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('SignupPage')} disabled={Loading}>
                        <Text style={styles.signupNavigate}>Forgot your password?</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        </View>
    );
};


export default SignInPage;