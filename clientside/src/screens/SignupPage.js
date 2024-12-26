import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, TextInput, Button } from 'react-native';
import { styles } from '../styles/SignupPageStyle';
import axios from 'axios';

const SignupPage = props => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmitHandler = async () => {
        console.log('Making request...');
        console.log('email:', email);
        try {
            setLoading(true);
            setError('');

            const response = await axios.post('http://10.0.0.13:3001/signup', {
                email: email,
                username: username,
                password: password,
                confirmPassword: confirmPassword,
            });

            console.log('Success:', response.data);
            props.navigation.navigate('LoginPage');
        } catch (err) {
            console.error('Error:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Something went wrong!');
        } finally {
            setLoading(false);
        }
    };


    return (

        
        <View style={styles.container} onPress={() => alert('Signup')}>


            <View style={styles.wrapper}>
                {loading ? (
                    <Text style={styles.formHeading}> Creating resource </Text>
                ) : (
                    <Text style={styles.formHeading}>Create new user</Text>
                )}
            </View>

            <View style={styles.frameContainer}>

                <Text style={styles.header}>Sign up</Text>
                <TextInput
                    style={styles.TextInput}
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
                    style={styles.TextInput}
                    autoCapitalize='none'
                    autoCorrect={false}
                    label="Email Address"
                    placeholderTextColor="#3b3d3d"
                    placeholder="Email Address"
                    editable={!loading}
                    value={email}
                    onChangeText={newValue => setEmail(newValue)}
                />
                <TextInput
                    style={styles.TextInput}
                    autoCapitalize='none'
                    autoCorrect={false}
                    label="Password"
                    placeholderTextColor="#3b3d3d"
                    placeholder="Password"
                    editable={!loading}
                    value= {password}
                    onChangeText={newValue => setPassword(newValue)}
                />
                <TextInput
                    style={styles.TextInput}
                    label="confirm your password"
                    autoCapitalize='none'
                    autoCorrect={false}
                    placeholderTextColor="#3b3d3d"
                    placeholder="confirm your password"
                    editable={!loading}
                    value={confirmPassword}
                    onChangeText={newValue => setConfirmPassword(newValue)}
                />
                {/* <TextInput 
                style={styles.TextInput} 
                label = "Phone Number"
                placeholder="Phone Number"
            /> */}
                <TouchableOpacity style={styles.SignupButton} onPress= {onSubmitHandler} disabled={loading} >
                    <Text style={styles.buttonText}>Sign Up for an account</Text>
                </TouchableOpacity>
                
                <View style={styles.rowContainer}>
                    {/* <Text style={styles.errorText}>{error}</Text> */}
                    <Text style={styles.haveAnAccount}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => props.navigation.navigate('LoginPage')} disabled={loading}>
                        <Text style={styles.loginText}>Log in</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};


export default SignupPage;