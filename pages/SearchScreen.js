/**
 *
 * @format
 */
import {version} from '../package.json';
import 'react-native-gesture-handler';
import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  Platform,
  PermissionsAndroid,
  TouchableHighlight,
  Alert,
  BackHandler,
} from 'react-native';

import BleManager from 'react-native-ble-manager';
import styles from '../assets/stylesheets/searchStyle';
import Geolocation from '@react-native-community/geolocation';
navigator.geolocation = require('@react-native-community/geolocation');
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import {UIActivityIndicator} from 'react-native-indicators';
import axios from 'axios';
import {baseUrl} from '../env';

axios.defaults.baseURL = baseUrl;

const SearchScreen = ({route, navigation}) => {
  const {tagList, scanTimeout, scanTimeoutLong} = route.params;

  const [isScanning, setIsScanning] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [currentLongitude, setCurrentLongitude] = useState('');
  const [currentLatitude, setCurrentLatitude] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [bluetoothStatus, setBluetoothStatus] = useState('');
  const [position, setPosition] = useState({});
  const [isloading, setIsLoading] = useState(true);
  const [isScanIndicator, setIsScanIndicator] = useState(true);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
          {
            title: 'Location Access Required',
            message: 'This App needs to Access your location',
          },
        );

        //Check if Android bluetooth and location permission is granted
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getOneTimeLocation();
          console.log('Permission is OK');
        } else {
          setLocationStatus('The app does not have access to your location');
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      Geolocation.requestAuthorization();
      getOneTimeLocation();
      console.log('Permission is OK');
    }
  };

  const turnLocationOn = () => {
    if (Platform.OS === 'android') {
      RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
        interval: 10000,
        fastInterval: 5000,
      })
        .then(data => {
          console.log('The Location is already enabled or the user confirm');
          getOneTimeLocation();
        })
        .catch(err => {
          Alert.alert(
            '',
            'You have to enable your location in order to start scanning',
            [
              {
                text: 'Cancel',
              },
              {
                text: 'Enable',
                onPress: () => {
                  turnLocationOn();
                },
              },
            ],
          );
        });
    } else {
      getOneTimeLocation();
    }
  };

  const turnBluetoothOn = () => {
    if (Platform.OS === 'android') {
      BleManager.enableBluetooth()
        .then(() => {
          // Success code
          console.log('The bluetooth is already enabled or the user confirmed');
          setBluetoothEnabled(true);
          setBluetoothStatus('OK');
        })
        .catch(error => {
          // Failure code
          setBluetoothStatus(error);
          Alert.alert(
            '',
            'You have to enable Bluetooth in order to start scanning',
            [
              {
                text: 'Cancel',
              },
              {
                text: 'Enable',
                onPress: () => {
                  turnBluetoothOn();
                },
              },
            ],
          );
        });
    } else {
      setBluetoothEnabled(true);
      setBluetoothStatus('OK');
    }
  };

  const getOneTimeLocation = () => {
    setCurrentLongitude('');
    setCurrentLatitude('');
    setLocationStatus('Getting location..');
    setIsLoading(true);
    Geolocation.getCurrentPosition(
      //Will give you the current location
      position => {
        setIsLoading(false);
        const currentLongitude = position.coords.longitude.toFixed(6);
        //getting the Longitude from the location json
        const currentLatitude = position.coords.latitude.toFixed(6);
        //getting the Latitude from the location json
        setCurrentLongitude(currentLongitude);
        //Setting state Longitude to re re-render the Longitude Text
        setCurrentLatitude(currentLatitude);
        //Setting state Latitude to re re-render the Longitude Text
        setPosition({
          latitude: currentLatitude,
          longitude: currentLongitude,
        });
        setLocationStatus('OK');
        setLocationEnabled(true);
      },
      error => {
        setIsLoading(false);
        setLocationStatus(error.message);

        Alert.alert('', 'Location services need to be enabled.', [
          {
            text: 'Close',
          },
        ]);
      },
      {enableHighAccuracy: false, timeout: 30000, maximumAge: 1000},
    );
  };

  const startScan = async () => {
    let authenticated = false;

    await axios
      .post('/loggedin', {})
      .then(async response => {
        if (response.status === 200) {
          authenticated = true;
        }
      })
      .catch(error => {
        console.log(error.response.status);
      });

    const options = {
      scanMode: 2,
      matchMode: 1,
      refresh: false,
      autoConnect: false,
      duplicatesFilter: true,
    };

    if (!authenticated) {
      alert('Your session has expired. Please log in again.');
      navigation.navigate('LoginScreen');
    } else if (!isScanning && tagList.length > 0) {
      let scanTimeoutVal = scanTimeout;
      if (scanTimeoutVal === '' || scanTimeoutVal < 0) {
        scanTimeoutVal = 15000;
      }

      let long, lat;

      setIsLoading(true);

      try {
        const position = await new Promise((resolve, reject) => {
          Geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 30000,
            maximumAge: 1000,
          });
        });

        const currentLongitude = position.coords.longitude.toFixed(6);
        const currentLatitude = position.coords.latitude.toFixed(6);

        setCurrentLongitude(currentLongitude);
        setCurrentLatitude(currentLatitude);

        setPosition({
          latitude: currentLatitude,
          longitude: currentLongitude,
        });
        long = currentLongitude;
        lat = currentLatitude;

        setIsLoading(false);

        navigation.navigate('ResultScreen', {
          position: {latitude: lat, longitude: long},
          scanning: isScanning,
          Searching: isScanIndicator,
          tagList: tagList,
          scanTimeout: scanTimeoutVal,
          scanTimeoutLong: scanTimeoutLong,
        });

        BleManager.scan([], scanTimeoutLong, false, options)
          .then(results => {
            console.log(results);
            console.log('Scanning...');
            setIsScanning(true);
            setIsScanIndicator(true);
          })
          .catch(err => {
            console.error(err);
          });
        console.log('The bluetooth is already enabled or the user confirm');
      } catch (error) {
        setIsLoading(false);
        setLocationStatus(error.message);
        Alert.alert('', 'Location services need to be enabled.', [
          {
            text: 'Close',
          },
        ]);
      }
    } else {
      alert(
        'The scan could not be initiated because there was an error loading the BLE types',
      );
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsScanning(false);
    });
    BleManager.start({showAlert: false}).then(() => {
      console.log('BleManager has been initialized');
    });

    const backAction = () => {
      Alert.alert('Exit', 'Are you sure you want to exit the application?', [
        {
          text: 'Stay',
          onPress: () => null,
          style: 'cancel',
        },
        {
          text: 'Close app',
          onPress: () => {
            BackHandler.exitApp();
          },
        },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    requestLocationPermission();
    turnBluetoothOn();

    return () => {
      unsubscribe;
      backHandler.remove();
    };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          style={styles.logo}
          source={require('../images/greenwheels-logo-2020.png')}
        />
      </View>

      <View style={styles.body}>
        {isloading ? (
          <View style={{flex: 1, justifyContent: 'center'}}>
            <UIActivityIndicator color="#62B946" size={90} />
          </View>
        ) : (
          <TouchableHighlight
            style={[
              styles.ScanBtn,
              bluetoothEnabled & locationEnabled ? styles.Enabled : null,
            ]}
            onPress={() => startScan()}
            disabled={bluetoothEnabled & locationEnabled ? false : true}
            underlayColor="#E7E7E7">
            <Text style={styles.searchText}>Start scanning for racks</Text>
          </TouchableHighlight>
        )}

        <View style={styles.LocationView}>
          <Text style={styles.LocationText}>
            Bluetooth status:{' '}
            <Text
              style={
                bluetoothStatus === 'OK' ? {color: 'green'} : {color: 'red'}
              }>
              {bluetoothStatus}
            </Text>
          </Text>
          <Text style={styles.LocationText}>
            Location status:{' '}
            <Text
              style={
                locationStatus === 'OK' ? {color: 'green'} : {color: 'red'}
              }>
              {locationStatus}
            </Text>
          </Text>
          {currentLatitude !== '' && currentLongitude !== '' ? (
            <View style={{marginTop: 8}}>
              <Text style={styles.LocationInfo}>
                Longitude: {currentLongitude}
              </Text>
              <Text style={styles.LocationInfo}>
                Latitude: {currentLatitude}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableHighlight
          style={[
            styles.BluetoothBtn,
            bluetoothEnabled ? styles.Enabled : null,
          ]}
          onPress={() => turnBluetoothOn()}
          underlayColor="#62B946">
          <Image
            style={styles.imageBle}
            source={require('../images/bluetooth-b.png')}
          />
        </TouchableHighlight>
        <Text style={styles.Version}>Version {version}</Text>
        <TouchableHighlight
          style={[styles.LocationBtn, locationEnabled ? styles.Enabled : null]}
          onPress={() => requestLocationPermission()}
          underlayColor="#62B946">
          <Image
            style={styles.imageLocation}
            source={require('../images/map-marker-alt.png')}
          />
        </TouchableHighlight>
      </View>
    </SafeAreaView>
  );
};

export default SearchScreen;
