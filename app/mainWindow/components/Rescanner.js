// Copyright (C) 2019 ExtraHash
// Copyright (C) 2023 Nolanium
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { i18n, eventEmitter } from '../index';
import { uiType } from '../utils/utils';

type Props = {
  darkMode: boolean
};

type State = {
  scanHeight: string,
  rescanInProgress: boolean
};

export default class Rescanner extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      scanHeight: '',
      rescanInProgress: false
    };
    this.setRescanInProgress = this.setRescanInProgress.bind(this);
    this.confirmRescan = this.confirmRescan.bind(this);
    this.rescanWallet = this.rescanWallet.bind(this);
    this.handleRescanResponse = this.handleRescanResponse.bind(this);
  }

  componentWillMount() {
    eventEmitter.on('rescanWallet', this.rescanWallet);
    ipcRenderer.on('fromBackend', this.handleRescanResponse);
  }

  componentWillUnmount() {
    eventEmitter.off('rescanWallet', this.rescanWallet);
    ipcRenderer.off('fromBackend', this.handleRescanResponse);
  }

  handleRescanResponse(event: Electron.IpcRendererEvent, message: any) {
    const { messageType } = message;
    if (messageType === 'rescanResponse') {
      this.setRescanInProgress(false);
    }
  }

  handleScanHeightChange = (event: any) => {
    this.setState({ scanHeight: event.target.value.trim() });
  };

  setRescanInProgress = (rescanInProgress: boolean) => {
    this.setState({
      rescanInProgress
    });
  };

  rescanWallet = () => {
    this.setRescanInProgress(true);
    const { scanHeight } = this.state;
    ipcRenderer.send('fromFrontend', 'rescanRequest', parseInt(scanHeight, 10));
    this.setState({
      scanHeight: ''
    });
  };

  confirmRescan = () => {
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);
    const { scanHeight } = this.state;

    if (
      Number.isNaN(parseInt(scanHeight, 10)) ||
      parseInt(scanHeight, 10) < 0
    ) {
      const message = (
        <div>
          <center>
            <p className="title has-text-danger">{i18n.error}</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            {i18n.rescanner_description}
          </p>
          <p className={`subtitle ${textColor}`} />
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, null);
      this.setState({
        scanHeight: ''
      });
      return;
    }
    const message = (
      <div>
        <center>
          <p className="title has-text-danger">{i18n.rescanner_warning}</p>
        </center>
        <br />
        <p className={`subtitle ${textColor}`}>
          {i18n.formatString(i18n.rescanner_warning_desc, { scanHeight })}
        </p>
      </div>
    );
    eventEmitter.emit('openModal', message, 'OK', 'Nevermind', 'rescanWallet');
  };

  render() {
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);
    const { scanHeight, rescanInProgress } = this.state;

    return (
      <div>
        <p className={`has-text-weight-bold ${textColor}`}>
          {i18n.rescan_wallet}
        </p>
        <div className="field has-addons">
          <div className="control is-expanded">
            <input
              className="input"
              type="text"
              placeholder={i18n.rescanner_height_scan}
              value={scanHeight}
              onChange={event => {
                this.setState({ scanHeight: event.target.value });
              }}
              onKeyPress={event => {
                if (event.key === 'Enter') {
                  this.confirmRescan();
                }
              }}
            />
          </div>
          <div className="control">
            <button
              className={`button is-danger ${
                rescanInProgress ? 'is-loading' : ''
              }`}
              onClick={this.confirmRescan}
            >
              <span className="icon is-small">
                <i className="fa fa-undo" />
              </span>
              &nbsp;&nbsp;{i18n.rescan}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
