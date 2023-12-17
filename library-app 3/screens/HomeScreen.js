import React, { Component } from 'react';
import { Text, View, StyleSheet } from 'react-native';

export default class Home extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>Library App</Text>
       </View>

    )
  }
}

const styles = StyleSheet.create({
container:{
  marginLeft: 60,
  marginRight: 55,
  marginTop: 50,
  backgroundColor: 'gray',
  padding: 10,
  borderRadius: 20
},
logo:{
  fontSize: 40
}
})