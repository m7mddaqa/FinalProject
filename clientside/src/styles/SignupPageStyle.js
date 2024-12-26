import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    wrapper: {
        marginBottom: 20,
    },
    formHeading: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    frameContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 20,
        textAlign: 'center',
    },
    TextInput: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        backgroundColor: '#f9f9f9',
        fontSize: 16,
        color: '#333',
    },
    SignupButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    haveAnAccount: {
        fontSize: 14,
        color: '#333',
    },
    loginText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    errorText: {
        fontSize: 14,
        color: 'red',
        marginBottom: 15,
        textAlign: 'center',
    },
});
