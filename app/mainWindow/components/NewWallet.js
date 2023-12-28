// Copyright (C) 2019 ExtraHash
// Copyright (C) 2023 Nolanium
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import ReactTooltip from 'react-tooltip';
import { clipboard, remote } from 'electron';
import log from 'electron-log';
import jdenticon from 'jdenticon';
import { WalletBackend, Daemon } from 'turtlecoin-wallet-backend';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import { uiType } from '../utils/utils';
import {
  backupToFile,
  eventEmitter,
  reInitWallet,
  config,
  i18n
} from '../index';
import Config from '../../Config';

type State = {
  darkMode: boolean,
  newWallet: any,
  password: string,
  confirmPassword: string,
  confirmSeed: string,
  activePage: string,
  showPassword: boolean
};

type Props = {};

export default class NewWallet extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      darkMode: true,
      newWallet: WalletBackend.createWallet(Config.defaultDaemon, Config),
      activePage: 'generate',
      password: '',
      confirmPassword: '',
      confirmSeed: '',
      showPassword: false
    };

    this.nextPage = this.nextPage.bind(this);
    this.prevPage = this.prevPage.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleConfirmPasswordChange = this.handleConfirmPasswordChange.bind(
      this
    );
    this.handleConfirmSeedChange = this.handleConfirmSeedChange.bind(this);
    this.toggleShowPassword = this.toggleShowPassword.bind(this);
    this.ref = null;
    this.handleCopiedTip = this.handleCopiedTip.bind(this);
  }

  componentWillMount() {}

  componentWillUnmount() {}

  toggleShowPassword() {
    const { showPassword } = this.state;

    this.setState({
      showPassword: !showPassword
    });
  }

  evaluatePageNumber = (pageName: string) => {
    switch (pageName) {
      default:
        log.error('Programmer error!');
        break;
      case 'generate':
        return 1;
      case 'secure':
        return 2;
      case 'backup':
        return 3;
      case 'verify':
        return 4;
    }
  };

  evaluatePageName = (pageNumber: number) => {
    switch (pageNumber) {
      default:
        log.error('Programmer error!');
        break;
      case 1:
        return 'generate';
      case 2:
        return 'secure';
      case 3:
        return 'backup';
      case 4:
        return 'verify';
    }
  };

  handleCopiedTip = () => {
    ReactTooltip.show(this.ref);
    setTimeout(() => {
      ReactTooltip.hide(this.ref);
    }, 500);
  };

  prevPage = () => {
    const { activePage } = this.state;
    let currentPageNumber: number = this.evaluatePageNumber(activePage);

    if (currentPageNumber === 1) {
      return;
    }

    currentPageNumber--;
    const newPageName = this.evaluatePageName(currentPageNumber);

    this.setState({
      activePage: newPageName
    });
  };

  nextPage = () => {
    const {
      activePage,
      password,
      confirmPassword,
      confirmSeed,
      darkMode,
      newWallet
    } = this.state;
    const { textColor } = uiType(darkMode);
    let currentPageNumber: number = this.evaluatePageNumber(activePage);

    if (currentPageNumber === 4) {
      // import the seed so we can confirm it works
      const [confirmWallet, err] = WalletBackend.importWalletFromSeed(
        Config.defaultDaemon,
        100000,
        confirmSeed,
        Config
      );

      // the seed wasn't valid
      if (err) {
        log.error(err);
        const message = (
          <div>
            <center>
              <p className="title has-text-danger">
                {i18n.new_wallet_send_verification_error}
              </p>
            </center>
            <br />
            <p className={`subtitle ${textColor}`}>{err.customMessage}</p>
          </div>
        );
        eventEmitter.emit('openModal', message, 'OK', null, null);
      }

      // seed was valid, let's check if it's the same address
      if (confirmWallet) {
        // if the addresses match, seeds match
        if (
          confirmWallet.getPrimaryAddress() === newWallet.getPrimaryAddress()
        ) {
          // get the save as path
          const options = {
            defaultPath: remote.app.getPath('documents'),
            filters: [
              {
                name: i18n.import_restore_wallet_version,
                extensions: ['wallet']
              }
            ]
          };
          /*
          const savePath = remote.dialog.showSaveDialog(null, options);

          log.debug('savePath', savePath);

          if (savePath === undefined) {
            return;
          }
          */
          return remote.dialog.showSaveDialog(null, options).then(result => {
            if (result.filePath === undefined) {
              return;
            }
            const saved = newWallet.saveWalletToFile(result.filePath, password);
            if (saved) {
              reInitWallet(result.filePath);
              return true;
            }
            const message = (
              <div>
                <center>
                  <p className="subtitle has-text-danger">
                    {i18n.new_wallet_save_error}
                  </p>
                </center>
                <br />
                <p className={`subtitle ${textColor}`}>
                  {i18n.new_wallet_save_error_desc}
                </p>
              </div>
            );
            eventEmitter.emit('openModal', message, 'OK', null, null);
            return true;
          });
        }

        log.error('Wallet creation error.');
        const message = (
          <div>
            <center>
              <p className="title has-text-danger">
                {i18n.new_wallet_creation_error}
              </p>
            </center>
            <br />
            <p className={`subtitle ${textColor}`}>
              {i18n.new_wallet_creation_error_desc}
            </p>
          </div>
        );
        eventEmitter.emit('openModal', message, 'OK', null, null);
      }
      return;
    }

    if (currentPageNumber === 2 && password !== confirmPassword) {
      return;
    }

    currentPageNumber++;
    const newPageName = this.evaluatePageName(currentPageNumber);

    this.setState({
      activePage: newPageName
    });
  };

  handlePasswordChange(event: any) {
    const password = event.target.value;

    this.setState({
      password
    });
  }

  handleConfirmSeedChange(event: any) {
    const confirmSeed = event.target.value;

    this.setState({
      confirmSeed
    });
  }

  handleConfirmPasswordChange(event: any) {
    const confirmPassword = event.target.value;

    this.setState({
      confirmPassword
    });
  }

  render() {
    const {
      darkMode,
      newWallet,
      activePage,
      password,
      confirmPassword,
      confirmSeed,
      showPassword
    } = this.state;
    const { backgroundColor, fillColor, elementBaseColor, textColor } = uiType(
      darkMode
    );
    const copiedTip = i18n.copied;

    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${fillColor} hide-scrollbar`}>
          <NavBar darkMode={darkMode} />
          <div className={`maincontent ${backgroundColor}`}>
            <div className={`steps ${textColor} is-dark`} id="stepsDemo">
              <div
                className={`step-item ${
                  activePage === 'generate' ? 'is-active' : ''
                } ${
                  this.evaluatePageNumber(activePage) > 1 ? 'is-completed' : ''
                } is-success`}
              >
                <div className="step-marker">
                  {this.evaluatePageNumber(activePage) > 1 ? (
                    <i className="fas fa-check" />
                  ) : (
                    '1'
                  )}
                </div>
                <div className="step-details">
                  <p className="step-title">{i18n.generate}</p>
                </div>
              </div>
              <div
                className={`step-item ${
                  activePage === 'secure' ? 'is-active' : ''
                } ${
                  this.evaluatePageNumber(activePage) > 2 ? 'is-completed' : ''
                } is-success`}
              >
                <div className="step-marker">
                  {' '}
                  {this.evaluatePageNumber(activePage) > 2 ? (
                    <i className="fas fa-check" />
                  ) : (
                    '2'
                  )}
                </div>
                <div className="step-details">
                  <p className="step-title">{i18n.secure}</p>
                </div>
              </div>
              <div
                className={`step-item ${
                  activePage === 'backup' ? 'is-active' : ''
                } ${
                  this.evaluatePageNumber(activePage) > 3 ? 'is-completed' : ''
                } is-success`}
              >
                <div className="step-marker">
                  {' '}
                  {this.evaluatePageNumber(activePage) > 3 ? (
                    <i className="fas fa-check" />
                  ) : (
                    '3'
                  )}
                </div>
                <div className="step-details">
                  <p className="step-title">{i18n.backup}</p>
                </div>
              </div>
              <div
                className={`step-item ${
                  activePage === 'verify' ? 'is-active' : ''
                } is-success`}
              >
                <div className="step-marker">4</div>
                <div className="step-details">
                  <p className="step-title">{i18n.verify}</p>
                </div>
              </div>
            </div>

            {activePage === 'generate' && (
              <div>
                <p className={`subtitle ${textColor}`}>
                  {i18n.new_wallet_creation_welcome}
                </p>
                <div className="columns">
                  <div className="column">
                    <p className={`${textColor} label`}>
                      {i18n.new_wallet_new_address}
                      <textarea
                        className="textarea is-large no-resize is-family-monospace"
                        rows="4"
                        readOnly
                        value={newWallet.getPrimaryAddress()}
                      />
                    </p>
                  </div>
                  <div className="column is-one-fifth">
                    <span className={`label ${textColor}`}>
                      {i18n.identicon}
                      <center>
                        <div className="box">
                          <span
                            // eslint-disable-next-line react/no-danger
                            dangerouslySetInnerHTML={{
                              __html: jdenticon.toSvg(
                                newWallet.getPrimaryAddress(),
                                130
                              )
                            }}
                          />
                        </div>
                      </center>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activePage === 'secure' && (
              <div>
                <p className={`subtitle ${textColor}`}>
                  {i18n.new_wallet_create_password}
                </p>
                <div className="field">
                  <label className={`label ${textColor}`} htmlFor="scanheight">
                    {i18n.import_secure_password_enter}
                    <div className="control">
                      <input
                        className="input is-large"
                        type={showPassword ? 'input' : 'password'}
                        placeholder={
                          i18n.import_secure_password_enter_placeholder
                        }
                        value={password}
                        onChange={this.handlePasswordChange}
                        onKeyPress={event => {
                          if (event.key === 'Enter') {
                            this.nextPage();
                          }
                        }}
                      />
                    </div>
                  </label>
                </div>
                <div className="field">
                  <label className={`label ${textColor}`} htmlFor="scanheight">
                    {i18n.import_secure_password_confirm}
                    {password !== confirmPassword ? (
                      <span className="has-text-danger">
                        &nbsp;&nbsp;{i18n.import_secure_password_no_match}
                      </span>
                    ) : (
                      ''
                    )}
                    <div className="control">
                      <input
                        className="input is-large"
                        type={showPassword ? 'input' : 'password'}
                        placeholder={
                          i18n.import_secure_password_confirm_placeholder
                        }
                        value={confirmPassword}
                        onChange={this.handleConfirmPasswordChange}
                        onKeyPress={event => {
                          if (event.key === 'Enter') {
                            this.nextPage();
                          }
                        }}
                      />
                    </div>
                  </label>
                </div>
                {showPassword === false && (
                  <span className={textColor}>
                    <a
                      className="button is-danger"
                      onClick={this.toggleShowPassword}
                      onKeyPress={this.toggleShowPassword}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="icon is-large">
                        <i className="fas fa-times" />
                      </span>
                    </a>
                    &nbsp;&nbsp; {i18n.import_secure_password_show}{' '}
                    <strong>{i18n.off}</strong>
                  </span>
                )}
                {showPassword === true && (
                  <span className={textColor}>
                    <a
                      className="button is-success"
                      onClick={this.toggleShowPassword}
                      onKeyPress={this.toggleShowPassword}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="icon is-large">
                        <i className="fa fa-check" />
                      </span>
                    </a>
                    &nbsp;&nbsp; {i18n.import_secure_password_show}{' '}
                    <strong>{i18n.on}</strong> &nbsp;&nbsp;
                  </span>
                )}
              </div>
            )}

            {activePage === 'backup' && (
              <div>
                <p className={`subtitle ${textColor}`}>
                  {i18n.new_wallet_backup}
                  <span className="has-text-danger has-text-weight-bold ">
                    {i18n.new_wallet_backup_mnemonic}
                  </span>
                </p>
                <p className={`label ${textColor}`}>
                  {i18n.mnemonic_seed}
                  <textarea
                    className="textarea no-resize is-large"
                    value={newWallet.getMnemonicSeed()[0]}
                    rows="4"
                    readOnly
                  />
                </p>
                <button
                  // eslint-disable-next-line no-return-assign
                  ref={ref => (this.ref = ref)}
                  type="button"
                  className={`button ${elementBaseColor}`}
                  onClick={() => {
                    clipboard.writeText(newWallet.getMnemonicSeed()[0]);
                    this.handleCopiedTip();
                  }}
                  data-tip={copiedTip}
                  data-event="none"
                  data-effect="float"
                >
                  <span className="icon">
                    <i className="fa fa-clipboard" />
                  </span>
                  &nbsp;&nbsp;{i18n.copy_to_clipboard}
                </button>
                &nbsp;&nbsp;
                <button
                  type="button"
                  className={`button ${elementBaseColor}`}
                  onClick={() => {
                    backupToFile(newWallet);
                  }}
                >
                  <span className="icon">
                    <i className="fas fa-save" />
                  </span>
                  &nbsp;&nbsp;{i18n.save_to_file}
                </button>
              </div>
            )}

            {activePage === 'verify' && (
              <div>
                <p className={`subtitle ${textColor}`}>
                  {i18n.new_wallet_verify}
                </p>
                <p className={`label ${textColor}`}>
                  {i18n.new_wallet_confirm_seed}
                  <textarea
                    className="textarea no-resize is-large"
                    value={confirmSeed}
                    onChange={this.handleConfirmSeedChange}
                    rows="4"
                    onKeyPress={event => {
                      if (event.key === 'Enter') {
                        this.nextPage();
                      }
                    }}
                  />
                </p>
              </div>
            )}

            <br />
            <center>
              <div className="buttons bottombuttons">
                <span
                  className="button is-warning is-large"
                  onClick={this.prevPage}
                  onKeyPress={this.prevPage}
                  role="button"
                  tabIndex={0}
                  onMouseDown={event => event.preventDefault()}
                >
                  {i18n.back}
                </span>
                &nbsp;&nbsp;
                <span
                  className="button is-success is-large"
                  onClick={this.nextPage}
                  onKeyPress={this.nextPage}
                  role="button"
                  tabIndex={0}
                  onMouseDown={event => event.preventDefault()}
                >
                  {activePage === 'verify' ? i18n.import : i18n.next}
                </span>
              </div>
            </center>
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
