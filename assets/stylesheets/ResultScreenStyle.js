import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  redBackground: {
    backgroundColor: '#FA0000'
  },
  greenBackground: {
    backgroundColor: '#62B946'
  },
  grayBackground: {
    backgroundColor: '#E7E7E7'
  },

  container: {
    flex: 1,
    padding: 1,
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
    fontFamily: 'Cochin',
  },
  footer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    resizeMode: 'contain',
    height: '60%',
    width: '60%',
  },
  listLength: {
    borderColor: '#62B946',
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%',
    borderColor: '#62B946',
    borderWidth: 2,
    borderRadius: 25,
    padding: 8,
  },
  listLengthText:{
    fontSize: 35,
    textAlign: 'center',
    padding:5,
  },
  filterBtn: {
    width: 225,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#E7E7E7',
    elevation: 3,
    borderColor: '#F9F9F9',
    borderWidth: 9,
  },

  stopImageBtn:{
    height: '80%',
    width: '80%',
  },

  textScanning:{
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
  },
  textScanButton:{
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  searchAgain: {
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
  filter: {
    height: '70%',
    width: '70%',
  },
  item: {
    backgroundColor: '#f9c2ff',
    height: 50,
    justifyContent: 'center',
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 20,
  },

  Version: {
    padding: 15,
    marginTop: 0,
  },
});
