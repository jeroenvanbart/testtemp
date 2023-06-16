import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 5,
    padding: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  body: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 3,
    backgroundColor: '#FFFFFF',
  },

  footer: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
  },
  Enabled: {
    backgroundColor: '#62B946',
  },
  ScanBtn: {
    display: 'flex',
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    borderRadius: 150,
    elevation: 3,
    borderColor: '#F9F9F9',
    borderWidth: 9,
    backgroundColor: '#E7E7E7',
  },
  imageScan: {
    marginLeft: -10,
    marginTop: -50,
    height: '90%',
    width: '90%',
    borderColor:'#62B946',
  },
  LocationBtn: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    backgroundColor: '#E7E7E7',
    elevation: 3,
    borderColor: '#F9F9F9',
    borderWidth: 9,
  },
  BluetoothBtn: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    backgroundColor: '#E7E7E7',
    elevation: 3,
    borderColor: '#F9F9F9',
    borderWidth: 9,
  },
  logo: {
    resizeMode: 'contain',
    height: '60%',
    width: '60%',
  },
  imageBle: {
    height: '70%',
    width: '70%',
  },
  imageLocation: {
    height: '70%',
    width: '70%',
  },
  Version: {
    padding: 15,
    marginTop: 75,
  },
  LocationInfo:{
    fontSize: 15,
    color: '#000000',
    textAlign: 'left',
    marginLeft: 6
  },
  LocationText:{
    fontSize: 15,
    color: '#000000',
    textAlign: 'left',
    marginLeft: 6
  },
  searchText:{
    fontSize: 36,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  LocationView:{
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: '80%',
    height: 100,
    borderWidth: 3,
    borderColor: '#62B946',
    marginTop: 20,
    elevation: 9,
  },
});
