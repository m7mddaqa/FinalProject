import React from 'react';
import { View, Text, StyleSheet, Button} from 'react-native';

const Home = props => {
    return (
        <View style = {styles.container}>
            <Text style={styles.text}>SafeSpot</Text>
            <View style={styles.buttonView}>
                <Button title="Login to an existing account" color='#067ef5' onPress={() => props.navigation.navigate('LoginPage')} />
            </View>
            <View style={{ margin: 10 }}>
                <Button title="Don't have an account? Signup now" color='#067ef5' onPress={() => props.navigation.navigate('SignupPage')} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 1,
        alignItems: 'center',
    },
    buttonView: {
        margin: 10,
        padding: 10,
        borderRadius:50,
    },
    text: {
        fontSize: 30,
        textAlign: 'center',
        marginTop: 50,
        color: '#b51701',
    },
});

export default Home;