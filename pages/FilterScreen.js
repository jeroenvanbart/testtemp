/**
 *
 * @format
 */
import {version} from '../package.json';
import React from 'react';
import {
  ScrollView,
  View,
  Text,
  FlatList,
  Image,
  TouchableHighlight,
} from 'react-native';
import axios from 'axios';
import {baseUrl} from '../env';
axios.defaults.baseURL = baseUrl;
import styles from '../assets/stylesheets/FilterScreenStyle';
import { CommonActions } from '@react-navigation/native';

const FilterScreen = ({route, navigation}) => {
  const {
    list, 
    tagList, 
    scanTimeout, 
    scanTimeoutLong
  } = route.params;

  const renderItem = item => {
    return (
      <View style={[styles.item]} key={item.barCode}>

        <Text style={styles.textItem}>
          Barcode: {item.barCode}
        </Text>
      </View>
    );
  };

  const searchAgain = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'SearchScreen',
          params: {
            scanTimeout: scanTimeout,
            scanTimeoutLong: scanTimeoutLong,
            tagList: tagList }
          }
        ],
      })
    );
};

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            style={styles.logo}
            source={require('../images/greenwheels-logo.png')}
          />
        </View>
        <View style={styles.body}>
          <View style={{marginBottom:24}}>
            <Text style={styles.scanFinished}> Scan finished</Text>
          </View>
          <View style={styles.listLength}>
            <Text style={styles.registeredList}> {list.length > 0 ? list.length : 'No'} racks registered</Text>
          </View>
          <FlatList
          style={styles.list}
            data={list}
            renderItem={({item}) => renderItem(item)}
            keyExtractor={item => item.barCode}
          />
        </View>
        <View style={styles.footer}>
          <TouchableHighlight
            style={styles.searchAgain}
            onPress={() =>
              searchAgain()
            }underlayColor='#E7E7E7'>
              <Text style={styles.textScanButton}>Return to homepage</Text>
          </TouchableHighlight>
          <Text style={styles.Version}>Version {version}</Text>
        </View>
      </View>
    </>
  );
};

export default FilterScreen;
