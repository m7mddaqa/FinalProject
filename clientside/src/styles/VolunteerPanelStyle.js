import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  volunteerPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    paddingTop: 10,
  },
  volunteerPanelDark: {
    backgroundColor: '#1A1A1A',
  },
  volunteerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  volunteerHeaderRowDark: {
    borderBottomColor: '#333333',
  },
  volunteerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
  },
  volunteerTitleDark: {
    color: '#FFFFFF',
  },
  closeButtonIcon: {
    fontSize: 28,
    color: '#000000',
  },
  closeButtonIconDark: {
    color: '#FFFFFF',
  },
  volunteerReportsList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  noReportsText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
  },
  noReportsTextDark: {
    color: '#AAAAAA',
  },
  volunteerReportItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  volunteerReportItemDark: {
    backgroundColor: '#252525',
  },
  volunteerReportType: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  volunteerReportTypeDark: {
    color: '#FFFFFF',
  },
  volunteerReportLocation: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  volunteerReportLocationDark: {
    color: '#AAAAAA',
  },
  volunteerReportDistance: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  volunteerReportDistanceDark: {
    color: '#AAAAAA',
  },
  volunteerReportTime: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
  },
  volunteerReportTimeDark: {
    color: '#AAAAAA',
  },
  buttonContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginTop: 10,
  },
  checkDetailsButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  resolveButton: {
    width: '100%',
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  resolveButtonDark: {
    backgroundColor: '#32D74B',
  },
  fakeButton: {
    width: '100%',
    backgroundColor: '#999',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 0,
    alignItems: 'center',
  },
  fakeButtonDark: {
    backgroundColor: '#FF453A',
  },
  checkDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resolveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fakeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});