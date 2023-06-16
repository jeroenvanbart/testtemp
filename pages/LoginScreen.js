/**
 *
 * @format
 */
import {version} from '../package.json';
import React, {Component} from 'react';
import {
  Text,
  View,
  Image,
  TextInput,
  TouchableHighlight,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {baseUrl} from '../env';
import styles from '../assets/stylesheets/loginStyle';
import * as Keychain from 'react-native-keychain';
import { UIActivityIndicator } from 'react-native-indicators';

axios.defaults.baseURL = baseUrl;

class LoginScreen extends Component {
  constructor(props) {
    super(props);
    this.state = 
    {
      username: '',
      password: '',
      status: '',
      rememberMe: false,
      isLogging: false
    };
  }
  toggleRememberMe = value => {
    this.setState({ rememberMe: value })
      if (value === true) {
    //user wants to be remembered.
    this.save();
    console.log('info saved')
    } else  {
            //user don't wants to be remembered.
            this.reset();
            console.log('info deleted')
    }
  }
  
  async save() {
    
    try {
      let start = new Date();

      await Keychain.setGenericPassword(
        this.state.username,
        this.state.password,
      );

      let end = new Date();

      this.setState({
        username: username,
        password: password,
        status: `Credentials saved! takes: ${
          end.getTime() - start.getTime()
        } millis`,
      });
    } catch (err) {
      this.setState({ status: 'Could not save credentials, ' + err });
    }
  }

  async load() {
    try {

      const credentials = await Keychain.getGenericPassword();
      if (credentials) {
        // console.log(credentials)
        this.setState({ ...credentials, status: 'Credentials loaded!' });
        return credentials;
      } else {
        this.setState({ status: 'No credentials stored.' });
      }
    } catch (err) {
      this.setState({ status: 'Could not load credentials. ' + err });
    }
  }

  async reset() {
    try {
      await Keychain.resetGenericPassword();
      this.setState({
        status: 'Credentials Reset!',
        username: '',
        password: '',
      });
    } catch (err) {
      this.setState({ status: 'Could not reset credentials, ' + err });
    }
  }
  async componentDidMount() {
    const credentials = await this.load();
    // console.log(credentials?.username)
    this.setState({ 
      // username: username || "", 
      rememberMe: credentials?.username ? true : false
    });
  }

  render() {
    return (
      <KeyboardAvoidingView
        behavior={'height'}
        enabled={false}
        style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <View style={styles.header}>
              <Image
                style={styles.logo}
                source={require('../images/greenwheels-logo-2020.png')}
              />
            </View>
            <View style={styles.body}>
              <View style={[styles.inputView, {marginTop: 80}]}>
                <Image
                  style={styles.usericon}
                  source={require('../images/user-alt.png')}
                />
                <TextInput
                  style={styles.TextInput}
                  placeholder="Username"
                  onChangeText={username => this.setState({username})}
                  value={this.state.username}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => this.passwordInput.focus()}
                  placeholderTextColor="#646464"
                />
              </View>

              <View style={[styles.inputView, {marginTop: 20}]}>
                <Image
                  style={styles.usericon}
                  source={require('../images/lock.png')}
                />
                <TextInput
                  style={styles.TextInput}
                  placeholder="Password"
                  placeholderTextColor="#646464"
                  onChangeText={password => this.setState({password})}
                  returnKeyType="go"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={this.state.password}
                  ref={input => (this.passwordInput = input)}
                  onSubmitEditing={this._signin}
                  secureTextEntry={true}
                />
              </View>

          <View style={styles.checkboxContainer}>
          <Text style={styles.labelinfo}>Remember me</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#e0f1da" }}
            thumbColor={this.state.rememberMe ? "#62B946" : "#f4f3f4"}
            value={this.state.rememberMe}
            onValueChange={(value) => this.toggleRememberMe(value)}
            />
             {/* {console.log(this.state.rememberMe, typeof this.state.rememberMe)} */}
          </View>
  
              <TouchableHighlight>
                <Text style={[styles.forgot_button]} onPress={this._forgot}>Forgot password?</Text>
              </TouchableHighlight>
              <TouchableHighlight style={styles.loginBtn} onPress={this._signin}underlayColor='#62B946'>
                {this.state.isLogging ?
                  <UIActivityIndicator color='#FFF' size={90} /> :
                  <Text style={styles.loginText}>Sign in</Text>
                }
              </TouchableHighlight>
            </View>
            <View style={styles.footer}>
              <Text>Version {version}</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }
  _forgot = async () => {
    this.props.navigation.navigate('ForgotScreen');
  }

  _signin = async () => {
    if(!this.state.isLogging){
      if(this.state.username.trim() !== '' && this.state.password.trim() !== ''){
        this.setState({isLogging:true})
        await axios
          .post('/login', {
            emailAddress: this.state.username,
            password: this.state.password,
          })
          .then(async response => {
            await AsyncStorage.setItem('logged', 'true').catch(err => {
              console.error(err);
            });
            this.toggleRememberMe(this.state.rememberMe);
            await axios
            .post('/getscaninfo', {})
            .then(async response => {
              let scanTimeout = response.data.timeout
              let scanTimeoutLong = response.data.timeoutLong
              let tagList = response.data.tagList
    
              this.setState({isLogging:false})
              if(!this.state.isLogging){
                this.props.navigation.navigate('SearchScreen', {
                scanTimeout: scanTimeout,
                scanTimeoutLong: scanTimeoutLong,
                tagList: tagList
                });
              }
            })
            .catch(error => {
              this.setState({isLogging:false})
              if (error == "Error: Network Error") {
                return alert(`No network connection, please turn on Wi-Fi or Mobile Data`);
              }
              alert(`${error?.response?.data?.message}`);
            });
          })
          .catch(error => {
            alert('The username or password is incorrect')
            this.setState({isLogging:false})
          })
      }
      else{
        alert('Please enter a valid username and password')
      }
    }
  };
}

export default LoginScreen;
