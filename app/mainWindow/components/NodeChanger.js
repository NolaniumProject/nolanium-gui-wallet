// Copyright (C) 2019 ExtraHash
// Copyright (C) 2023 Nolanium
//
// Please see the included LICENSE file for more information.

import React, { Component } from 'react';
import Select from 'react-select';
import { remote, ipcRenderer } from 'electron';
import { i18n, eventEmitter, session, configManager } from '../index';
import { uiType } from '../utils/utils';
import NodeFee from './NodeFee';
import Config from '../../Config';

type Props = {
  darkMode: boolean
};

type State = {
  connectionString: string,
  nodeChangeInProgress: boolean,
  ssl: boolean,
  selectedNode: string,
  nodeNewFee: number
};

export default class NodeChanger extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      connectionString:
        `${session.getDaemonConnectionInfo().host ? (session.getDaemonConnectionInfo().host + ':' +session.getDaemonConnectionInfo().port) : i18n.node_changer_connecting_wait}`,
      nodeChangeInProgress: false,
      ssl: session.getDaemonConnectionInfo().ssl || false,
      selectedNode: Config.defaultDaemon,
      fee: session.getNodeFee() || 0
    };
    this.changeNode = this.changeNode.bind(this);
    this.handleNodeInputChange = this.handleNodeInputChange.bind(this);
    this.resetConnectionString = this.resetConnectionString.bind(this);
    this.handleNewNode = this.handleNewNode.bind(this);
    this.handleNodeListChange = this.handleNodeListChange.bind(this);
    this.handleNodeChangeInProgress = this.handleNodeChangeInProgress.bind(
      this
    );
    this.handleNodeChangeComplete = this.handleNodeChangeComplete.bind(this);
  }

  componentWillMount() {
    eventEmitter.on('gotDaemonConnectionInfo', this.handleNewNode);
    eventEmitter.on('nodeChangeInProgress', this.handleNodeChangeInProgress);
    eventEmitter.on('nodeChangeComplete', this.handleNodeChangeComplete);
    eventEmitter.on('gotNodeFee', this.refreshNodeFee);
  }

  componentWillUnmount() {
    eventEmitter.off('gotDaemonConnectionInfo', this.handleNewNode);
    eventEmitter.off('nodeChangeInProgress', this.handleNodeChangeInProgress);
    eventEmitter.off('nodeChangeComplete', this.handleNodeChangeComplete);
    eventEmitter.off('gotNodeFee', this.refreshNodeFee);
  }

  refreshNodeFee = () => {
    NodeFee.nodeFee = session.getNodeFee() || 0;
  };

  resetConnectionString = () => {
    this.setState({
      connectionString: `${
        session.getDaemonConnectionInfo().host
          ? `${session.getDaemonConnectionInfo().host}:${
              session.getDaemonConnectionInfo().port
            }`
          : 'Connecting, please wait...'
      }`,
      nodeChangeInProgress: false,
      ssl: session.getDaemonConnectionInfo().ssl
    });
  };

  handleNodeInputChange = (event: any) => {
    this.setState({ connectionString: event.target.value.trim() });
  };

  handleNodeListChange = (selectedOptions, data) => {
    this.setState({ selectedOptions });
    this.setState({ connectionString: selectedOptions.label });
  };

  handleNodeChangeInProgress = () => {
    this.setState({
      nodeChangeInProgress: true,
      ssl: undefined,
      nodeNewFee: undefined
    });
  };

  handleNodeChangeComplete = () => {
    this.setState({
      nodeChangeInProgress: false,
      connectionString: `${session.daemonHost}:${session.daemonPort}`,
      ssl: session.daemon.ssl,
      nodeNewFee: session.getNodeFee() || 0
    });
    log.debug(`Network Fee ${session.getNodeFee() || 0}`);
  };

  changeNode = () => {
    this.setState({
      nodeChangeInProgress: true,
      ssl: undefined
    });
    const { connectionString } = this.state;
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);
    // eslint-disable-next-line prefer-const
    let [host, port] = connectionString.split(':', 2);
    if (port === undefined) {
      port = Config.defaultDaemonPort;
    }
    /* if the daemon entered is the same as the
    one we're connected to, don't do anything */
    if (
      host.trim() === session.getDaemonConnectionInfo().host &&
      port.trim() === String(session.getDaemonConnectionInfo().port)
    ) {
      this.resetConnectionString();
      return;
    }
    if (!Number.isNaN(parseInt(port, 10))) {
      const request = { host, port: parseInt(port, 10) };
      configManager.modifyConfig('daemonHost', host);
      configManager.modifyConfig('daemonPort', parseInt(port, 10));
      ipcRenderer.send('fromFrontend', 'changeNode', request);
    } else {
      this.resetConnectionString();
      const modalMessage = (
        <div>
          <center>
            <p className="title has-text-danger">{i18n.error}</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>{i18n.node_changer_port}</p>
        </div>
      );
      eventEmitter.emit('openModal', modalMessage, 'OK', null, null);
    }
  };

  handleNewNode = () => {
    this.resetConnectionString();
  };

  render() {
    const { darkMode } = this.props;
    const { textColor, linkColor } = uiType(darkMode);
    const {
      nodeChangeInProgress,
      connectionString,
      ssl,
      selectedNode,
      nodeNewFee
    } = this.state;
    return (
      <form onSubmit={this.changeNode}>
        <div>
          <p className={`has-text-weight-bold ${textColor}`}>
            {i18n.node_changer_remote_node}
          </p>
          <div className="field has-addons is-expanded">
            <div className="control is-expanded has-icons-left">
              {nodeChangeInProgress === false && (
                <input
                  className="input has-icons-left"
                  type="text"
                  value={connectionString}
                  onKeyPress={event => {
                    if (event.key === 'Enter') {
                      this.changeNode();
                    }
                  }}
                  onChange={event => {
                    this.setState({
                      connectionString: event.target.value.trim()
                    });
                  }}
                />
              )}
              {ssl === true && (
                <span className="icon is-small is-left">
                  <i className="fas fa-lock" />
                </span>
              )}
              {ssl === false && (
                <span className="icon is-small is-left">
                  <i className="fas fa-unlock" />
                </span>
              )}
              {nodeChangeInProgress === true && (
                <input
                  className="input"
                  type="text"
                  placeholder={i18n.node_changer_connecting}
                  onChange={this.handleNodeInputChange}
                />
              )}
              {nodeChangeInProgress === true && (
                <span className="icon is-small is-left">
                  <i className="fas fa-sync fa-spin" />
                </span>
              )}
              <br />
              <br />
            </div>
            {nodeChangeInProgress === true && (
              <div className="control">
                <button className="button is-success is-loading">
                  <span className="icon is-small">
                    <i className="fa fa-network-wired" />
                  </span>
                  &nbsp;&nbsp;{i18n.connect}
                </button>
              </div>
            )}
            {nodeChangeInProgress === false && (
              <div className="control">
                <button className="button is-success" onClick={this.changeNode}>
                  <span className="icon is-small">
                    <i className="fa fa-network-wired" />
                  </span>
                  &nbsp;&nbsp;{i18n.connect}
                </button>
              </div>
            )}
          </div>
        </div>
        <div>
          <p className={`has-text-weight-bold ${textColor}`}>{i18n.node_changer_select_node}</p>
          <Select
            value={this.state.selectedOptions}
            onChange={this.handleNodeListChange}
            options={session.daemons}
          />
        </div>
      </form>
    );
  }
}
