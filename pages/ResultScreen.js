/**
 *
 * @format
 * @flow strict-local
 */
import {version} from '../package.json';
import React, {useState, useEffect, isValidElement} from 'react';
import {
  View,
  Text,
  Image,
  NativeModules,
  NativeEventEmitter,
  TouchableHighlight,
  BackHandler,
  Alert,
  Platform,
  LogBox,
} from 'react-native';

import styles from '../assets/stylesheets/ResultScreenStyle';
import BleManager from 'react-native-ble-manager';
import {CommonActions} from '@react-navigation/native';
import axios from 'axios';
import {baseUrl} from '../env';
axios.defaults.baseURL = baseUrl;
import {BarIndicator} from 'react-native-indicators';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

const ResultScreen = ({route, navigation}) => {
  const {position, Searching, scanTimeout, scanTimeoutLong, tagList} =
    route.params;

  const BleManagerModule = NativeModules.BleManager;
  const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);
  const [isStopped, setIsStopped] = useState(false);
  const listToCheck = [];
  const listExclude = [];
  const peripherals = new Map();
  const [checkList, setCheckList] = useState([]);
  const [isShowStopBtn, setShowStopBtn] = useState(false);
  const [count, setCount] = useState(scanTimeout / 1000);
  const [validatingRacks, setValidatingRacks] = useState(false);

  const handleStopScan = async () => {
    setValidatingRacks(true);
    console.log('ScanisStopped handleStopScan');

    if (listToCheck.length > 0) {
      const verified = await _verify().catch(err => {
        alert(`${err}`);
        searchAgain();
      });

      if (verified?.data?.length > 0) {
        navigation.navigate('FilterScreen', {
          list: verified.data,
          scanTimeout: scanTimeout,
          scanTimeoutLong: scanTimeoutLong,
          tagList: tagList,
        });
      } else if (!verified?.data?.length > 0) {
        navigation.navigate('FilterScreen', {
          list: [],
          scanTimeout: scanTimeout,
          scanTimeoutLong: scanTimeoutLong,
          tagList: tagList,
        });
      }
    } else {
      navigation.navigate('FilterScreen', {
        list: [],
        scanTimeout: scanTimeout,
        scanTimeoutLong: scanTimeoutLong,
        tagList: tagList,
      });
    }
  };

  const stopScan = () => {
    if (!isStopped) {
      setIsStopped(true);
      BleManager.stopScan().catch(err => {
        console.error(err);
      });
    }
  };

  const totalList = [];

  const handleDiscoverPeripheral = peripheral => {
    if (!peripheral.name) {
      peripheral.name = 'NO NAME';
    }
    if (!totalList.includes(`${peripheral.id}`)) {
      totalList.push(peripheral.id);
    }

    if (
      !listToCheck.includes(`${peripheral.id}`) &&
      !listExclude.includes(`${peripheral.id}`)
    ) {
      if (peripheral.advertising.manufacturerData) {
        let data = peripheral.advertising.manufacturerData.bytes;
        let offset = 0;
        if (Platform.OS === 'ios') {
          offset = -2;
        }

        tagList.forEach(element => {
          let valid = true;
          let keys = Object.keys(element);
          keys.forEach(key => {
            if (data[parseInt(key) + offset] !== element[key]) {
              valid = false;
            }
          });
          if (valid) {
            console.log('Tag has been found!');
            peripheral.target = true;
            if (Platform.OS === 'ios') {
              let macArray = data.slice(10, 16);
              Object.keys(macArray).forEach(key => {
                let hexString = macArray[key].toString(16);
                if (hexString.length === 1) {
                  hexString = '0' + hexString;
                }
                macArray[key] = hexString.toUpperCase();
              });

              let macAddress = macArray.join(':');
              listToCheck.push(`${macAddress}`);
            } else {
              listToCheck.push(`${peripheral.id}`);
            }
            return;
          } else {
            listExclude.push(`${peripheral.id}`);
          }
        });
      } else if (
        peripheral.advertising.serviceUUIDs &&
        peripheral.advertising.serviceUUIDs.includes('FEAA')
      ) {
        let macArray = peripheral.advertising.serviceData.FEAA.bytes.slice(
          2,
          12,
        );

        let output = '';
        macArray.forEach(number => {
          output += String.fromCharCode(parseInt(number));
        });
        output = ('DC' + output).toLowerCase();

        if (!listToCheck.includes(output)) {
          listToCheck.push(output);
        }
      } else {
        listExclude.push(`${peripheral.id}`);
      }
    }

    peripherals.set(peripheral.id, peripheral);
    setCheckList([...new Set(listToCheck)]);
  };

  const _verify = async () => {
    return new Promise(async (resolve, reject) => {
      // let positionString = JSON.stringify(position)
      await axios
        .post('/verify', {
          devices: listToCheck,
          position: position,
        })
        .then(async response => {
          console.log('Verify response', response.data.message);
          // alert(`${response.data.message}`);
          return resolve(response.data);
        })
        .catch(error => {
          // console.log('Error response',error.response)
          return reject(error.response.data.message);
        });
    });
  };

  const searchAgain = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          {
            name: 'SearchScreen',
            params: {
              scanTimeout: scanTimeout,
              scanTimeoutLong: scanTimeoutLong,
              tagList: tagList,
            },
          },
        ],
      }),
    );
  };

  useEffect(() => {
    let counter = count;
    // let intervalTimer = setInterval(() => { counter > 0 ? () => { counter--; setCount(counter)} : () => { clearInterval(intervalTimer); setShowStopBtn(true)}}, 1000);
    let intervalTimer = setInterval(() => {
      if (counter > 1) {
        counter--;
        setCount(counter);
      } else {
        clearInterval(intervalTimer);
        setShowStopBtn(true);
      }
    }, 1000);
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Module initialized ResultScreen');

      BleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        handleDiscoverPeripheral,
      );
      BleManagerEmitter.addListener('BleManagerStopScan', handleStopScan);
    });

    const backAction = () => {
      Alert.alert('Back to menu', 'Are you sure you want to go back?', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        {
          text: 'Go back',
          onPress: () => {
            backHandler.remove();
            navigation.navigate('SearchScreen', {
              scanTimeout: scanTimeout,
              scanTimeoutLong: scanTimeoutLong,
              tagList: tagList,
            });
          },
        },
      ]);
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => {
      console.log('unmount ResultScreen');
      stopScan();
      backHandler.remove();
      BleManagerEmitter.removeAllListeners(
        'BleManagerDiscoverPeripheral',
        handleDiscoverPeripheral,
      );
      BleManagerEmitter.removeAllListeners(
        'BleManagerStopScan',
        handleStopScan,
      );
      unsubscribe;
      clearInterval(intervalTimer);
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          style={styles.logo}
          source={require('../images/greenwheels-logo-2020.png')}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.listLength}>
          <Text style={styles.listLengthText}>
            {checkList.length > 0
              ? checkList.length + ' BLE tags found'
              : 'No BLE tags found'}
          </Text>
        </View>
        <View style={{flex: 0.4, justifyContent: 'center'}}>
          <BarIndicator
            color="#62B946"
            count={6}
            textContent={'Loading...'}
            size={90}
          />
          <Text style={styles.textScanning}>
            {!validatingRacks
              ? 'Scanning for racks...'
              : 'Verifying scanned racks...'}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        {isShowStopBtn ? (
          <TouchableHighlight
            style={[
              styles.filterBtn,
              isStopped ? styles.grayBackground : styles.redBackground,
            ]}
            onPress={() => {
              stopScan();
            }}
            underlayColor="#E7E7E7">
            <Text style={styles.textScanButton}>
              Stop scan and show results
            </Text>
          </TouchableHighlight>
        ) : (
          <TouchableHighlight style={styles.filterBtn} underlayColor="#62B946">
            <Text style={styles.listLengthText}>{count}</Text>
          </TouchableHighlight>
        )}
        <Text style={styles.Version}>Version {version}</Text>
      </View>
    </View>
  );
};

export default ResultScreen;
