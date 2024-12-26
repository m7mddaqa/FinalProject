import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import {styles} from '../styles/LoginPageStyle.js';

const SignInPage = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = () => {
        if (email === '' || password === '') {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (email === 'test@example.com' && password === 'password123') {
            Alert.alert('Success', 'You are signed in!');
            navigation.navigate('HomePage');
        } else {
            Alert.alert('Error', 'Invalid credentials');
        }
    };

    return (
        <View style={styles.container}>
            <View style= {styles.frameContainer}>

                <Text style={styles.header}>Sign In</Text>

                <TextInput
                    style={styles.textInput}
                    placeholder="Email Address"
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />

                <TextInput
                    style={styles.textInput}
                    placeholder="Password"
                    placeholderTextColor="#888"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
                    <Text style={styles.buttonText}>Sign In</Text>
                </TouchableOpacity>

                <View style={styles.rowContainer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('SignupPage')}>
                        <Text style={styles.signUpText}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};


export default SignInPage;
