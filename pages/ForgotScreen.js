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
 } from 'react-native';
 import { UIActivityIndicator } from 'react-native-indicators';
 import axios from 'axios';
 import {baseUrl} from '../env';
 import styles from '../assets/stylesheets/loginStyle';
 
 axios.defaults.baseURL = baseUrl;
 
 class ForgotScreen extends Component {
 
   constructor(props) {
     super(props);
     this.state = {
       email: '',
       isSending: false
      };
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
               <View style={[styles.inputView, {marginTop: 100}]}>
                 <Image
                   style={styles.usericon}
                   source={require('../images/email.png')}
                 />
                 <TextInput
                   style={styles.TextInput}
                   placeholder="Email address"
                   onChangeText={email => this.setState({email})}
                   value={this.state.email}
                   autoCapitalize="none"
                   autoCorrect={false}
                   returnKeyType="next"
                   onSubmitEditing={() => this._forgot}
                   placeholderTextColor="#646464"
                 />
               </View>
               <TouchableHighlight style={styles.loginBtn} onPress={this._forgot}underlayColor='#62B946'>
               {this.state.isSending ?
                  <UIActivityIndicator color='#FFF' size={90} /> :
                  <Text style={styles.loginText}>Request reset</Text>
                }
               </TouchableHighlight>
               <TouchableHighlight>
                <Text style={[styles.forgot_button]} onPress={this._login}>Back to login</Text>
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
   _login = async () => {
    this.props.navigation.navigate('LoginScreen');
  }
   _forgot = async () => {
     if(!this.state.isSending){
      if(this.state.email !== '' && this.state.email.includes('@')){
        this.setState({isSending:true});
        await axios
        .post('/forgot', {
          email: this.state.email
        })
        .then(async response => {
            this.setState({isSending:false});
            if(!this.state.isLogging){
              alert(`${response?.data?.message}`)
              // setTimeout(() => {
                  this.props.navigation.navigate('LoginScreen');
              // }, 5000)
            }
        })
        .catch(error => {
          alert(`${error?.response?.data?.message}`);
        });
      }
      else{
        alert('Please enter a valid email address')
      }
     }
   };
 }
 
 export default ForgotScreen;
 