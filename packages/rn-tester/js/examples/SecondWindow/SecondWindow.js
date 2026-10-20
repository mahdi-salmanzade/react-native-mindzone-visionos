/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import * as React from 'react';
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  View,
  WindowManager,
} from 'react-native';

type Props = Readonly<{
  title?: string,
}>;

function SecondWindow({title}: Props): React.Node {
  const [counter, setCounter] = React.useState(0);
  const closeWindow = async () => {
    try {
      await WindowManager.getWindow('SecondWindow').close();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : String(error),
      );
    }
  };

  return (
    <View style={styles.center}>
      <Text style={styles.text}>{title}</Text>
      <Text style={styles.counter}>{counter}</Text>
      <Button
        title="Increment"
        onPress={() => setCounter(value => value + 1)}
      />
      <Button title="Close window" onPress={closeWindow} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 30,
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  counter: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

module.exports = SecondWindow;
