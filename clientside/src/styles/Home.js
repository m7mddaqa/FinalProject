import { StyleSheet } from "react-native";
export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        color: '#555',
        fontWeight: '300',
        marginBottom: 5,
    },
    brand: {
        fontSize: 36,
        color: '#b51701',
        fontWeight: 'bold',
        marginBottom: 30,
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },

    button: {
        backgroundColor: '#067ef5',
        paddingVertical: 15,
        borderRadius: 25,
        marginVertical: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
