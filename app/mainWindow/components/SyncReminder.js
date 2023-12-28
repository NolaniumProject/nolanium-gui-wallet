// Copyright (C) 2019 ExtraHash
// Copyright (C) 2023 Nolanium
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import {session, eventEmitter, i18n} from '../index';
import { uiType } from '../utils/utils';

type Props = {
  darkMode: boolean
};

type State = {
  syncPercentage: number,
  networkBlockHeight: number
};

export default class SyncReminder extends Component<Props, State> {
  props: Props;

  state: State;

  syncInterval: IntervalID;

  constructor(props?: Props) {
    super(props);
    this.state = {
      syncPercentage: session.getSyncPercentage(),
      networkBlockHeight: session.getNetworkBlockHeight()
    };
    this.handleNewSyncStatus = this.handleNewSyncStatus.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('gotSyncStatus', this.handleNewSyncStatus);
  }

  componentWillUnmount() {
    eventEmitter.off('gotSyncStatus', this.handleNewSyncStatus);
  }

  handleNewSyncStatus() {
    this.setState({
      networkBlockHeight: session.getNetworkBlockHeight(),
      syncPercentage: session.getSyncPercentage()
    });
  }

  render() {
    const { syncPercentage, networkBlockHeight } = this.state;
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);

    return (
      <div className="syncreminder">
        {syncPercentage < 100 && networkBlockHeight !== 0 && (
          <p className={`${textColor} glow`}>
            <i className="fas fa-sync fa-spin" /> &nbsp; {i18n.sync_dont_panic}
          </p>
        )}
        {syncPercentage === 100 && networkBlockHeight !== 0 && (
          <p className={`${textColor}`}>
            <i className="fas fa-check-circle" /> &nbsp; {i18n.sync_fully}
          </p>
        )}
        {networkBlockHeight === 0 && (
          <p className={`${textColor} glow-red`}>
            <i className="fas fa-times" /> &nbsp; {i18n.sync_node_offline}
          </p>
        )}
      </div>
    );
  }
}
