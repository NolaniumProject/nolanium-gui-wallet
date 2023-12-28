// Copyright (C) 2019 ExtraHash
// Copyright (C) 2023 Nolanium
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import ReactTooltip from 'react-tooltip';
import { remote } from 'electron';
import log from 'electron-log';
import { WalletBackend, Daemon } from 'turtlecoin-wallet-backend';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import { uiType } from '../utils/utils';
import { eventEmitter, reInitWallet, config, i18n } from '../index';
import Config from '../../Config';

type State = {
  darkMode: boolean,
  password: string,
  confirmPassword: string,
  confirmSeed: string,
  activePage: string,
  showPassword: boolean,
  privateSpendKey: string,
  privateViewKey: string,
  importedWallet: any,
  scanHeight: string
};

type Props = {};

export default class ImportKey extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      darkMode: true,
      activePage: 'enter_seed',
      password: '',
      confirmPassword: '',
      privateSpendKey: '',
      privateViewKey: '',
      scanHeight: '',
      showPassword: false,
      importedWallet: null
    };

    this.nextPage = this.nextPage.bind(this);
    this.prevPage = this.prevPage.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleConfirmPasswordChange = this.handleConfirmPasswordChange.bind(
      this
    );
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
      case 'enter_seed':
        return 1;
      case 'verify':
        return 2;
      case 'secure':
        return 3;
    }
  };

  evaluatePageName = (pageNumber: number) => {
    switch (pageNumber) {
      default:
        log.error('Programmer error!');
        break;
      case 1:
        return 'enter_seed';
      case 2:
        return 'verify';
      case 3:
        return 'secure';
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
      privateSpendKey,
      privateViewKey,
      scanHeight,
      darkMode,
      importedWallet
    } = this.state;
    const { textColor } = uiType(darkMode);
    let currentPageNumber: number = this.evaluatePageNumber(activePage);

    if (currentPageNumber === 1) {
      const [restoredWallet, error] = WalletBackend.importWalletFromKeys(
        Config.defaultDaemon,
        scanHeight === '' ? 0 : Number(scanHeight),
        privateViewKey,
        privateSpendKey,
        Config
      );

      if (error) {
        const message = (
          <div>
            <center>
              <p className="title has-text-danger">{i18n.import_key_error}</p>
            </center>
            <br />
            <p className={`subtitle ${textColor}`}>
              {i18n.import_key_error_restore}
            </p>
          </div>
        );
        eventEmitter.emit('openModal', message, 'OK', null, null);
        return;
      }
      this.setState({
        importedWallet: restoredWallet
      });
    }

    if (currentPageNumber === 3) {
      if (password !== confirmPassword) {
        return;
      }
      const options = {
        defaultPath: remote.app.getPath('documents'),
        filters: [
          {
            name: i18n.import_restore_wallet_version,
            extensions: ['wallet']
          }
        ]
      };

      return remote.dialog.showSaveDialog(null, options).then(result => {
        if (result.filePath === undefined) {
          return;
        }
        const saved = importedWallet.saveWalletToFile(
          result.filePath,
          password
        );
        if (saved) {
          reInitWallet(result.filePath);
          return true;
        }
        const message = (
          <div>
            <center>
              <p className="subtitle has-text-danger">
                {i18n.import_key_error_save}
              </p>
            </center>
            <br />
            <p className={`subtitle ${textColor}`}>
              {i18n.import_key_error_save_desc}
            </p>
          </div>
        );
        eventEmitter.emit('openModal', message, 'OK', null, null);
        return true;
      });
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

  handleConfirmPasswordChange(event: any) {
    const confirmPassword = event.target.value;

    this.setState({
      confirmPassword
    });
  }

  render() {
    const {
      darkMode,
      activePage,
      password,
      confirmPassword,
      privateSpendKey,
      privateViewKey,
      showPassword,
      importedWallet,
      scanHeight
    } = this.state;
    const { backgroundColor, fillColor, textColor } = uiType(darkMode);

    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${fillColor} hide-scrollbar`}>
          <NavBar darkMode={darkMode} />
          <div className={`maincontent ${backgroundColor}`}>
            <div className={`steps ${textColor} is-dark`} id="stepsDemo">
              <div
                className={`step-item ${
                  activePage === 'enter_seed' ? 'is-active' : ''
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
                  <p className="step-title">{i18n.enter_seed}</p>
                </div>
              </div>
              <div
                className={`step-item ${
                  activePage === 'verify' ? 'is-active' : ''
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
                  <p className="step-title">{i18n.verify}</p>
                </div>
              </div>
              <div
                className={`step-item ${
                  activePage === 'secure' ? 'is-active' : ''
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
                  <p className="step-title">{i18n.secure}</p>
                </div>
              </div>
            </div>

            {activePage === 'enter_seed' && (
              <div>
                <p className={`subtitle ${textColor}`}>
                  {i18n.import_key_enter_seed}
                </p>
                <div>
                  <label className={`label ${textColor}`} htmlFor="spendKey">
                    {i18n.import_key_enter_seed_private}
                    <textarea
                      className="input is-large"
                      placeholder={
                        i18n.import_key_enter_seed_private_placeholder
                      }
                      onChange={event => {
                        this.setState({ privateSpendKey: event.target.value });
                      }}
                      value={privateSpendKey}
                      onKeyPress={event => {
                        if (event.key === 'Enter') {
                          this.nextPage();
                        }
                      }}
                    />
                  </label>
                  <label className={`label ${textColor}`} htmlFor="viewKey">
                    {i18n.import_key_enter_seed_private_view}
                    <textarea
                      className="input is-large"
                      placeholder={
                        i18n.import_key_enter_seed_private_view_placeholder
                      }
                      onChange={event => {
                        this.setState({ privateViewKey: event.target.value });
                      }}
                      value={privateViewKey}
                      onKeyPress={event => {
                        if (event.key === 'Enter') {
                          this.nextPage();
                        }
                      }}
                    />
                  </label>
                  <label className={`label ${textColor}`} htmlFor="scanHeight">
                    {i18n.scan_height}
                    <textarea
                      className="input is-large"
                      placeholder="0"
                      onChange={event => {
                        this.setState({ scanHeight: event.target.value });
                      }}
                      value={scanHeight}
                      onKeyPress={event => {
                        if (event.key === 'Enter') {
                          this.nextPage();
                        }
                      }}
                    />
                    <p className={`${textColor} help`}>
                      {i18n.scan_height_tip}
                    </p>
                  </label>
                </div>
              </div>
            )}

            {activePage === 'verify' && (
              <div>
                <p className={`subtitle ${textColor}`}>
                  {i18n.import_key_verify}
                  <span className="has-text-danger has-text-weight-bold ">
                    {i18n.import_key_verify_correct}
                  </span>
                </p>
                <p className={`label ${textColor}`}>
                  {i18n.import_key_imported}
                  <textarea
                    className="textarea no-resize is-large"
                    value={importedWallet.getPrimaryAddress()}
                    rows="4"
                    readOnly
                  />
                </p>
              </div>
            )}

            {activePage === 'secure' && (
              <div>
                <p className={`subtitle ${textColor}`}>
                  {i18n.import_key_secure}
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
                  Back
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
                  {activePage === 'secure' ? i18n.import : i18n.next}
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
