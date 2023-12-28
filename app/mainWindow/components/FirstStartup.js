// Copyright (C) 2019 ExtraHash
// Copyright (C) 2023 Nolanium
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import log from 'electron-log';
import { eventEmitter, i18n, config } from '../index';
import Redirector from './Redirector';
import Modal from './Modal';
import { uiType } from '../utils/utils';

// import styles from './Send.css';

type Props = {};

type State = {
  darkMode: boolean
};

export default class FirstStartup extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkMode: true
    };
  }

  componentDidMount() {}

  componentWillUnmount() {}

  openExisting = () => {
    log.debug('User selected to open an existing wallet.');
    eventEmitter.emit('handleOpen');
  };

  createNew = () => {
    log.debug('User selected to create a new wallet.');
    eventEmitter.emit('handleNew');
  };

  importFromKeysOrSeed = () => {
    const { darkMode } = this.state;
    const { textColor } = uiType(darkMode);
    log.debug('User selected to import wallet.');
    const message = (
      <div>
        <center>
          <p className={`title ${textColor}`}>{i18n.startup_select_type}</p>
        </center>
        <br />
        <p className={`subtitle ${textColor}`}>
          <b>{i18n.startup_send_to}</b>
          <br />
          {i18n.startup_type_selection}
        </p>
      </div>
    );
    eventEmitter.emit(
      'openModal',
      message,
      'Seed',
      null,
      'importSeed',
      'Key',
      'importKey'
    );
  };

  render() {
    const { darkMode } = this.state;
    const { backgroundColor, fillColor, redTitleColor, buttonColor } = uiType(
      darkMode
    );

    return (
      <div>
        <Redirector />
        <Modal darkMode={darkMode} />
        <div className={`fullwindow outer-div ${backgroundColor}`}>
          <div className="mid-div">
            <div className={`box loginbox passwordchangebox ${fillColor}`}>
              <h1 className={`title has-text-centered ${redTitleColor}`}>
                {i18n.welcome_to_proton}
              </h1>
              <button
                className={`button is-large is-fullwidth ${buttonColor}`}
                onClick={this.openExisting}
              >
                {i18n.open_existing_wallet}
              </button>
              <br />
              <button
                className={`button is-large is-fullwidth ${buttonColor}`}
                onClick={this.createNew}
              >
                {i18n.create_new_wallet}
              </button>
              <br />
              <button
                className={`button is-large is-fullwidth ${buttonColor}`}
                onClick={this.importFromKeysOrSeed}
              >
                {i18n.import_keys_seed}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
