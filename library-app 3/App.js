import React, { Component } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import HomeScreen from './screens/HomeScreen'
import BottomTabNavigator from "./navigation/TabNavigator"

import { createSwitchNavigator, createAppContainer} from "react-navigation"


export default class Home extends Component {
  constructor(props){
    super(props)
    this.state = {
      fontLoaded: false
    };
}

    async loadFonts() {
    await Font.loadAsync({
      Rajdhani_600SemiBold: Rajdhani_600SemiBold
    });
    this.setState({ fontLoaded: true });
  }

  componentDidMount() {
    this.loadFonts();
  }

  render() {
    const { fontLoaded } = this.state;
    if (fontLoaded) {
      return <AppContainer />;
    }
    return null;
  }
}

const AppSwitchNavigator = createSwitchNavigator(
  {
    Home: {
      screen: HomeScreen
    },
    BottomTab: {
      screen: BottomTabNavigator
    }
  },
  {
    initializeRouteName: "Home"
  }
);


const AppContainer = createAppContainer(AppSwitchNavigator);


