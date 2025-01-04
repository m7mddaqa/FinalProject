import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 7,
    },
    instructions: {
        position: 'absolute',
        bottom: 20,
        left: 10,
        right: 10,
        backgroundColor: '#1E1E1E',
        padding: 10,
        borderRadius: 5,
    },
    heading: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 5,
    },
    currentStep: {
        color: 'white',
        fontSize: 14,
        marginTop: 5,
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
    recenterButton: {
        position: 'absolute',
        top: 40,
        right: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 10,
        borderRadius: 5,
    },
    menu: {
        position: 'absolute',
        top: 40,
        left: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 10,
        borderRadius: 5,
    },
    slidingMenu: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        padding: 20,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        zIndex: 1000,
    },
    menuContent: {
        fontSize: 18,
        color: '#555',
        textAlign: 'center',
    },


    slidingMenu: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
        backgroundColor: '#1E1E1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1000,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 10,
    },
    profileText: {
        marginLeft: 10,
        flexShrink: 1,
    },
    profileName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'left', // Align text to the left
    },
    viewProfileText: {
        color: '#4A90E2', // Light blue for "View profile"
        fontSize: 14,
        textAlign: 'left', // Align text to the left
    },
    
menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
},
menuItemText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 15,
    flexShrink: 1,
    textAlign: 'left',
},


});
