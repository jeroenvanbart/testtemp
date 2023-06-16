import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  inner: {
    padding: 2,
    flex: 1,
    justifyContent: 'space-around',
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    padding: 15,
  },
  body: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  footer: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    resizeMode: 'contain',
    height: '60%',
    width: '60%',
  },

  inputView: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    width: '80%',
    height: 70,
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 5,
    borderColor: '#62B946',
    marginTop: 20,
    elevation: 9,
  },

  TextInput: {
    width: '80%',
    fontSize: 25,
    marginLeft: 10,
    color: '#000000',
  },

  forgot_button: {
    height: 30,
    marginBottom: 10,
    color: '#0082B7',
  },

  loginBtn: {
    width: 150,
    height: 150,
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 150,
    backgroundColor: '#62B946',
    elevation: 9,
    borderColor: '#fff',
    borderWidth: 3,
  },

  loginText: {
    color: '#F9F9F9',
    fontSize: 30,
    textAlign: 'center',
  },
  usericon: {
    marginLeft: 15,
    height: 25,
    width: 25,
    resizeMode: 'contain',
  },
  passwordicon: {
    marginLeft: 15,
    height: 25,
    width: 25,
    resizeMode: 'contain',
  },
  checkboxContainer: {
    flexDirection: "row",
    marginBottom: 10,
    paddingTop:15,
  },
  checkbox: {
    alignSelf: "center",
  },
  labelinfo:{
    margin: 8,
  },
});
