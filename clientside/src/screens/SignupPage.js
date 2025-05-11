import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, TextInput, Button } from 'react-native';
import { styles } from '../styles/SignupPageStyle';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {URL} from '@env';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const SignupPage = props => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isEmailInvalid, setisEmailInvalid] = useState(false);
    const [isUsernameInvalid, setisUsernameInvalid] = useState(false);
    const [isPasswordInvalid, setisPasswordInvalid] = useState(false);
    const [isConfirmPasswordInvalid, setisConfirmPasswordInvalid] = useState(false);
    const [isCheckingToken, setIsCheckingToken] = useState(true);

    //checking if a token exists
    //page is rendered first (return part gets triggered and then the useEffect is triggered)
    useEffect(() => {
        const checkToken = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                console.log('Token:', token); //logs null if no token is found
                if (token) {
                    console.log('User already logged in, redirecting...');
                    props.navigation.replace('LoginPage'); //navigate to login page if token exists
                } else {
                    setIsCheckingToken(false); //allow the login page to render if no token exists
                }
            } catch (err) {
                console.log('Error checking token:', err);
                setIsCheckingToken(false); //handle errors and allow login page to render
            }
        };
        checkToken();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                props.navigation.replace('LoginPage');
                return true;
            };
            BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        }, [props.navigation])
    );

    const validateEmail = email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
    const validatePassword = password => {
        const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/;
        return passwordRegex.test(password);
    };
    const validateUsername = username => {
        const usernameRegex = /^[0-9A-Za-z]{6,16}$/;
        return usernameRegex.test(username);
    };
    const matchPasswords = (password, confirmPassword) => {
        return password === confirmPassword
    };

    const onSubmitHandler = async () => {
        try {
            console.log("submitting signup form...")
            //reset the errors, set loading to true so user cant click or enter anything until we get response from the backend server
            setLoading(true);
            setError('');
            setisEmailInvalid(false)
            setisUsernameInvalid(false)
            setisPasswordInvalid(false)
            setisConfirmPasswordInvalid(false)

            //validate the inputs
            if (!validateUsername(username)) {
                setError("Please enter a 6-16 long username, characters can only consist of letters and numbers");
                setLoading("false");
                setisUsernameInvalid(true);
                setLoading(false);
                return;
            }
            if (!validateEmail(email)) {
                setError("Please enter a proper email address");
                setLoading("false");
                setisEmailInvalid(true);
                setLoading(false);
                return;
            }
            if (!validatePassword(password)) {
                setError("Password must be between 8-16 characters, consisting of special character, capital & small letters, and numbers");
                setLoading("false");
                setisPasswordInvalid(true);
                setLoading(false);
                return;
            }
            if (!matchPasswords(password, confirmPassword)) {
                setError("Your passwords don't match");
                setLoading("false");
                setisConfirmPasswordInvalid(true);
                setLoading(false);
                return;
            }
            console.log("all inputs are valid, sending to backend...")
            //send the inputs to the backend to validate them, and save the user if everything works properly.
            const response = await axios.post(`${URL}/api/signup`, {
                email: email,
                username: username,
                password: password,
                confirmPassword: confirmPassword,
            });
            //recieves a 2XX.. response, user created successfully 
            console.log('Success:', response.data);
            props.navigation.replace('LoginPage');

            //enters catch block if backend returns 4XX/5XX...
        } catch (err) {
            //extract and log the specific error message from the server
            if (err.response.data.message) {
                console.log('Server Error:', err.response.data.message);
                setError(err.response.data.message);
                //for any other unidentified errors
            } else {
                console.log('Unexpected Error:', err);
                setError('An unexpected error occurred. Please try again later.');
            }
        } finally {
            //return loading to false enabling the user to write/click again
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
        <View style={styles.container} onPress={() => alert('Signup')}>

            <View style={styles.frameContainer}>

                {/* React native docs: You can use an array of styles. The last style in the array has the highest priority, so you can use this to dynamically change styles at runtime. */}
                <Text style={styles.header}>Sign up</Text>
                <TextInput
                    style={isUsernameInvalid ? styles.colorBoxRed : styles.textInput}
                    autoCapitalize='none'
                    autoCorrect={false}
                    label="Username"
                    placeholderTextColor="#3b3d3d"
                    placeholder="Username"
                    editable={!loading}
                    value={username}
                    onChangeText={newValue => setUsername(newValue)}
                />
                <TextInput
                    style={isEmailInvalid ? styles.colorBoxRed : styles.textInput}
                    autoCapitalize='none'
                    autoCorrect={false}
                    label="Email Address"
                    placeholderTextColor="#3b3d3d"
                    placeholder="Email Address"
                    editable={!loading}
                    value={email}
                    keyboardType='email-address'
                    onChangeText={newValue => setEmail(newValue)}
                />
                <TextInput
                    style={isPasswordInvalid ? styles.colorBoxRed : styles.textInput}
                    autoCapitalize='none'
                    autoCorrect={false}
                    label="Password"
                    placeholderTextColor="#3b3d3d"
                    placeholder="Password"
                    editable={!loading}
                    value={password}
                    secureTextEntry={true}
                    onChangeText={newValue => setPassword(newValue)}
                />
                <TextInput
                    style={isConfirmPasswordInvalid ? styles.colorBoxRed : styles.textInput}
                    label="confirm your password"
                    autoCapitalize='none'
                    autoCorrect={false}
                    placeholderTextColor="#3b3d3d"
                    placeholder="confirm your password"
                    editable={!loading}
                    value={confirmPassword}
                    secureTextEntry={true}
                    onChangeText={newValue => setConfirmPassword(newValue)}
                />
                {/* <TextInput 
                style={styles.textInput} 
                label = "Phone Number"
                placeholder="Phone Number"
            /> */}

                <TouchableOpacity style={styles.SignupButton} onPress={onSubmitHandler} disabled={loading} >
                    <Text style={styles.buttonText}>Sign Up for an account</Text>
                </TouchableOpacity>

                <View style={styles.bottomButtons}>
                    <TouchableOpacity onPress={() => props.navigation.replace('LoginPage')} disabled={loading}>
                        <Text style={styles.loginNavigate}>Already have an account?</Text>
                    </TouchableOpacity>

                </View>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        </View>
    );
};

export default SignupPage;