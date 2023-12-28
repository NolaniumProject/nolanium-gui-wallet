// Copyright (C) 2019 ExtraHash
// Copyright (C) 2023 Nolanium
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { uiType } from '../utils/utils';
import { config, eventEmitter, configManager, i18n } from '../index';

type State = {
  darkMode: boolean
};

type Props = {};

export default class DarkModeToggle extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      darkMode: true
    };
    this.darkModeOn = this.darkModeOn.bind(this);
    this.darkModeOff = this.darkModeOff.bind(this);
  }

  componentWillMount() {}

  componentWillUnmount() {}

  darkModeOn = () => {
    this.setState({
      darkMode: true
    });
    config.darkMode = true;
    configManager.modifyConfig('darkmode', true);
    eventEmitter.emit('darkmodeon');
  };

  darkModeOff = () => {
    this.setState({
      darkMode: false
    });
    config.darkMode = false;
    configManager.modifyConfig('darkmode', false);
    eventEmitter.emit('darkmodeoff');
  };

  render() {
    const { darkMode } = this.state;
    const { textColor } = uiType(true);
    return (
      <div>
        
      </div>
    );
  }
}
