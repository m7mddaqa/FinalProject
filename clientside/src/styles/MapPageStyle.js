import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 7,
    },
    instructions: {
        flex: 3,
        padding: 10,
        backgroundColor: 'white',
    },
    heading: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 5,
    },
    currentStep: {
        fontSize: 14,
        marginBottom: 10,
    },
    toggleText: {
        color: 'blue',
        fontSize: 14,
        textAlign: 'center',
        marginVertical: 5,
    },
    fullStepsContainer: {
        marginTop: 10,
    },
    fullStep: {
        fontSize: 12,
        marginBottom: 5,
    },
});

