// Copyright (C) 2019 ExtraHash
// Copyright (C) 2023 Nolanium
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import {config, configManager, i18n} from '../index';
import { uiType } from '../utils/utils';

type State = {
  notifications: boolean
};

type Props = {
  darkMode: boolean
};

export default class NotificationsToggle extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      notifications: config.notifications || false
    };
    this.toggle = this.toggle.bind(this);
  }

  componentWillMount() {}

  componentWillUnmount() {}

  toggle = () => {
    const { notifications } = this.state;

    configManager.modifyConfig('notifications', !notifications);
    this.setState({
      notifications: !notifications
    });
    ipcRenderer.send('fromFrontend', 'notificationsRequest', !notifications);
  };

  render() {
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);
    const { notifications } = this.state;
    return (
      <div>
        {notifications === false && (
          <span className={textColor}>
            <a
              className="button is-danger martopSingleBtn"
              onClick={this.toggle}
              onKeyPress={this.toggle}
              role="button"
              tabIndex={0}
            >
              <span className="icon is-large">
                <i className="fas fa-times" />
              </span>
            </a>
            &nbsp;&nbsp; {i18n.notifications} <strong>{i18n.off}</strong>
          </span>
        )}
        {notifications === true && (
          <span className={textColor}>
            <a
              className="button is-success martopSingleBtn"
              onClick={this.toggle}
              onKeyPress={this.toggle}
              role="button"
              tabIndex={0}
            >
              <span className="icon is-large">
                <i className="fa fa-check" />
              </span>
            </a>
            &nbsp;&nbsp; {i18n.notifications} <strong>{i18n.on}</strong>
          </span>
        )}
      </div>
    );
  }
}
