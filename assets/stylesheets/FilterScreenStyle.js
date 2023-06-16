import {StyleSheet} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';

export default StyleSheet.create({
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
    borderWidth: 2,
    borderRadius: 25,
    padding: 8,
    marginBottom:10,
  },
  registeredList:{
    fontSize: 25,
    textAlign: 'center',
    padding:5,
  },
  scanFinished:{
    fontSize: 28,
    textAlign: 'center',
    padding:5,
    color: '#62B946',
    fontWeight: 'bold'
  },
  flist: {
    textAlign: 'center',
    fontFamily: 'Government Agent BB',
    height: 75,
    width: '80%',
    margin: 12,
    fontSize: 35,
    margin: 10,
  },
  searchAgain: {
    width: 225,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#62B946',
    elevation: 3,
    borderColor: '#F9F9F9',
    borderWidth: 9,
    color: '#FFFFFF'
    
  },
  searchAgainImg: {
    height: '95%',
    width: '95%',
    marginBottom:15,
    marginRight:4,
  },
  item: {
    flexDirection: "row",
    backgroundColor: '#E7E7E7',
    height: 45,
    // justifyContent: 'center',
    // alignItems:'center',
    marginVertical: 6,
    padding: 10,
    
  },
  textItem:{
    padding:3,
    fontWeight: 'bold',
    fontSize:15,
    
  },
  textScanButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  number:{
    alignSelf:'baseline',
    marginRight:15,
    padding:3,
    fontWeight: 'bold',
    fontSize:15,
  },

  list:{
    width:'90%',
    height:'70%',
    marginVertical:5,
    paddingHorizontal:2,

    borderRadius: 10,
  },

  Version: {
    padding: 15,
    marginTop: 0,
  },
});
