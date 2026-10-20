/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import * as React from 'react';
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  View,
  WindowManager,
  XR,
} from 'react-native';

const secondWindow = WindowManager.getWindow('SecondWindow');

function reportError(error: unknown) {
  Alert.alert('Error', error instanceof Error ? error.message : String(error));
}

function OpenXRSession(): React.Node {
  const [isOpen, setIsOpen] = React.useState(false);

  const openXRSession = async () => {
    if (!WindowManager.supportsMultipleScenes) {
      Alert.alert('Error', 'Multiple scenes are not supported');
      return;
    }
    try {
      await XR.requestSession('TestImmersiveSpace');
      setIsOpen(true);
    } catch (error) {
      reportError(error);
      setIsOpen(false);
    }
  };

  const closeXRSession = async () => {
    try {
      await XR.endSession();
      setIsOpen(false);
    } catch (error) {
      reportError(error);
    }
  };

  const openWindow = async () => {
    try {
      await secondWindow.open({title: 'React Native Window'});
    } catch (error) {
      reportError(error);
    }
  };

  const updateWindow = async () => {
    try {
      await secondWindow.update({title: 'Updated Window'});
    } catch (error) {
      reportError(error);
    }
  };

  const closeWindow = async () => {
    try {
      await secondWindow.close();
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Is XR session open: {String(isOpen)}</Text>
      <Button title="Open XR Session" onPress={openXRSession} />
      <Button title="Close XR Session" onPress={closeXRSession} />
      <Button title="Open Second Window" onPress={openWindow} />
      <Button title="Update Second Window" onPress={updateWindow} />
      <Button title="Close Second Window" onPress={closeWindow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    margin: 10,
    textAlign: 'center',
  },
});

exports.title = 'XR';
exports.description = 'Spatial experiences';
exports.examples = [
  {
    title: 'Open XR Session',
    render(): React.Node {
      return <OpenXRSession />;
    },
  },
] as Array<RNTesterModuleExample>;
