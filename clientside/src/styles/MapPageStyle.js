import { StyleSheet, Dimensions } from 'react-native';
const screenHeight = Dimensions.get('window').height;

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
        top: screenHeight * 0.1,
        height: screenHeight * 0.9,
        width: '100%',
        backgroundColor: '#333',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: screenHeight * 0.02,
        zIndex: 10,
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
        textAlign: 'left',
    },
    viewProfileText: {
        color: '#4A90E2',
        fontSize: 14,
        textAlign: 'left',
    },
    searchContainer: {
        position: 'absolute',
        top: 37,
        left: 80,
        right: 80,
        zIndex: 2,
    },
    searchInput: {
        height: 50,
        backgroundColor: '#ffffff',
        fontSize: 16,
        borderRadius: 12,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    searchList: {
        backgroundColor: '#fff',
        marginHorizontal: -60,
        borderRadius: 12,
        elevation: 2,
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
    instructionsContainer: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },

    heading: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },

    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    stepText: {
        fontSize: 15,
        color: '#333',
        marginLeft: 10,
        flex: 1,
        flexWrap: 'wrap',
    },
    cancelButton: {
        position: 'absolute',
        bottom: 5,
        right: 0,
        backgroundColor: 'red',
        padding: 12,
        borderRadius: 30,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    addEventButton: {
        position: 'absolute',
        bottom: 140,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 40,
        padding: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },

    addEventIcon: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },


    reportPanel: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        elevation: 5,
    },
    reportHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    reportTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeReport: {
        fontSize: 18,
        color: 'red',
    },
    reportGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    reportItem: {
        width: '30%',
        alignItems: 'center',
        marginVertical: 10,
    },
    reportIcon: {
        fontSize: 32,
    },
    reportLabel: {
        marginTop: 4,
        fontSize: 12,
        textAlign: 'center',
    },

    historyButton: {
        position: 'absolute',
        right: 10,
        top: 10,
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    
    historyPanel: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        maxHeight: 300,
    },
    
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    
    historyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    
    closeHistory: {
        fontSize: 20,
        color: '#666',
    },
    
    historyList: {
        maxHeight: 250,
    },
    
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    
    historyText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#333',
    },

    suggestionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },

    historySuggestionRow: {
        backgroundColor: '#f8f8f8',
    },

    historyIcon: {
        marginRight: 10,
    },

    suggestionText: {
        fontSize: 14,
        color: '#333',
    },

    historySuggestionText: {
        color: '#666',
    },

});
