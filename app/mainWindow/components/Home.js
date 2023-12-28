// Copyright (C) 2019 ExtraHash
// Copyright (C) 2023 Nolanium
//
// Please see the included LICENSE file for more information.
import log from 'electron-log';
import { remote, ipcRenderer } from 'electron';
import React, { Component, Fragment } from 'react';
import ReactTooltip from 'react-tooltip';
import { session, eventEmitter, i18n, loginCounter, config } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import {
  uiType,
  formatLikeCurrency,
  atomicToHuman,
  convertTimestamp
} from '../utils/utils';
import Config from '../../Config';

let displayedTransactionCount: number = 50;

type Props = {};

type State = {
  transactions: Array<any>,
  transactionCount: number,
  darkMode: boolean,
  displayCurrency: string,
  fiatPrice: number,
  fiatSymbol: string,
  symbolLocation: string,
  fiatDecimals: number,
  pageAnimationIn: string,
  expandedRows: string[],
  networkBlockHeight: number
};

export default class Home extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      transactions: session.getTransactions(),
      transactionCount: session.getTransactionCount(),
      darkMode: true,
      displayCurrency: config.displayCurrency,
      fiatPrice: session.fiatPrice,
      fiatSymbol: config.fiatSymbol,
      symbolLocation: config.symbolLocation,
      fiatDecimals: config.fiatDecimals,
      pageAnimationIn: loginCounter.getAnimation('/'),
      expandedRows: [],
      networkBlockHeight: session.getNetworkBlockHeight()
    };
    this.refreshListOnNewTransaction = this.refreshListOnNewTransaction.bind(
      this
    );
    this.openNewWallet = this.openNewWallet.bind(this);
    this.modifyCurrency = this.modifyCurrency.bind(this);
    this.expandRow = this.expandRow.bind(this);
    this.openInExplorer = this.openInExplorer.bind(this);
    this.handleNewSyncStatus = this.handleNewSyncStatus.bind(this);
    this.handleNewTransactions = this.handleNewTransactions.bind(this);
    this.handleNewTransactionCount = this.handleNewTransactionCount.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('openNewWallet', this.openNewWallet);
    eventEmitter.on('gotSyncStatus', this.handleNewSyncStatus);
    eventEmitter.on('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.on('modifyCurrency', this.modifyCurrency);
    eventEmitter.on('gotTransactionCount', this.handleNewTransactionCount);
    eventEmitter.on('gotNewTransactions', this.handleNewTransactions);
    const { loginFailed, firstLoadOnLogin } = session;
    if (firstLoadOnLogin && loginFailed === false) {
      this.switchOffAnimation();
    }
  }

  componentWillUnmount() {
    displayedTransactionCount = 50;
    eventEmitter.off('gotSyncStatus', this.handleNewSyncStatus);
    eventEmitter.off('openNewWallet', this.openNewWallet);
    eventEmitter.off('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.off('modifyCurrency', this.modifyCurrency);
    eventEmitter.off('gotTransactionCount', this.handleNewTransactionCount);
    eventEmitter.off('gotNewTransactions', this.handleNewTransactions);
  }

  handleNewTransactionCount = () => {
    this.setState({
      transactionCount: session.getTransactionCount()
    });
  };

  handleNewTransactions = () => {
    this.setState({
      transactions: session.getTransactions()
    });
  };

  handleNewSyncStatus = () => {
    this.setState({
      networkBlockHeight: session.getNetworkBlockHeight()
    });
  };

  openInExplorer = (event: any) => {
    const hash = event.target.value;

    remote.shell.openExternal(
      `${Config.explorerBaseURL + encodeURIComponent(hash)}`
    );
  };

  modifyCurrency = (displayCurrency: string) => {
    this.setState({
      displayCurrency
    });
  };

  updateFiatPrice = (fiatPrice: number) => {
    this.setState({
      fiatPrice
    });
  };

  switchOffAnimation() {
    session.firstLoadOnLogin = false;
  }

  refreshListOnNewTransaction = () => {
    log.debug('Transaction found, refreshing transaction list...');
    displayedTransactionCount += 1;
    this.setState({
      transactions: session.getTransactions(0, displayedTransactionCount, false)
    });
  };

  openNewWallet = () => {
    log.debug('Initialized new wallet session, refreshing transaction list...');
    displayedTransactionCount = 50;
    this.setState({
      transactions: session.getTransactions(0, displayedTransactionCount, false)
    });
  };

  // TODO: implement paging instead of just loading +50
  handleLoadMore = (event: any) => {
    event.preventDefault();
    displayedTransactionCount += 50;
    ipcRenderer.send(
      'fromFrontend',
      'transactionRequest',
      displayedTransactionCount
    );
  };

  resetDefault = (event: any) => {
    event.preventDefault();
    displayedTransactionCount = 50;
    ipcRenderer.send(
      'fromFrontend',
      'transactionRequest',
      displayedTransactionCount
    );
  };

  expandRow = (event: any) => {
    const transactionHash = event.target.value;
    const { expandedRows } = this.state;
    if (!expandedRows.includes(transactionHash)) {
      expandedRows.push(transactionHash);
    } else {
      const index = expandedRows.indexOf(transactionHash);
      if (index > -1) {
        expandedRows.splice(index, 1);
      }
    }
    this.setState({
      expandedRows
    });
  };

  render() {
    const {
      darkMode,
      transactions,
      transactionCount,
      fiatPrice,
      displayCurrency,
      fiatSymbol,
      symbolLocation,
      fiatDecimals,
      pageAnimationIn,
      expandedRows,
      networkBlockHeight
    } = this.state;
    const {
      backgroundColor,
      textColor,
      tableMode,
      toolTipColor,
      elementBaseColor,
      fillColor
    } = uiType(darkMode);
    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${backgroundColor}`}>
          <ReactTooltip
            effect="solid"
            type={toolTipColor}
            multiline
            place="top"
          />
          <NavBar darkMode={darkMode} />
          <div
            className={`maincontent-homescreen ${backgroundColor} ${pageAnimationIn}`}
          >
            <table
              className={`table is-striped is-hoverable is-fullwidth ${tableMode}`}
            >
              <thead>
                <tr>
                  <th />
                  <th className={textColor}>{i18n.date}</th>
                  <th className={textColor}>{i18n.hash}</th>
                  <th className={`has-text-right ${textColor}`}>
                    {i18n.amount}
                  </th>
                  <th className={`has-text-right ${textColor}`}>
                    {i18n.balance}
                  </th>
                </tr>
              </thead>
              <tbody className="is-family-monospace">
                {transactions.map(tx => {
                  const rowIsExpanded = expandedRows.includes(tx[1]);
                  const transactionHash = tx[1];
                  const toggleSymbol = rowIsExpanded ? '-' : '+';
                  return (
                    <Fragment key={transactionHash}>
                      <tr>
                        <td>
                          <button
                            value={transactionHash}
                            onClick={this.expandRow}
                            className={`toggle-row transparent-button ${textColor}`}
                            onMouseDown={event => event.preventDefault()}
                          >
                            {toggleSymbol}
                          </button>
                        </td>
                        <td>
                          {tx[0] === 0 && (
                            <p className="has-text-danger">
                              {i18n.unconfirmed}
                            </p>
                          )}
                          {tx[0] > 0 && <p>{convertTimestamp(tx[0])}</p>}
                        </td>
                        <td>{tx[1]}</td>
                        {tx[2] < 0 && (
                          <td>
                            <p className="has-text-danger has-text-right">
                              {displayCurrency === Config.ticker &&
                                atomicToHuman(tx[2], true)}
                              {displayCurrency === 'fiat' &&
                                symbolLocation === 'prefix' &&
                                fiatPrice !== 0 &&
                                `-${fiatSymbol}${formatLikeCurrency(
                                  (
                                    fiatPrice * atomicToHuman(tx[2], false)
                                  ).toFixed(fiatDecimals)
                                ).substring(1)}`}
                              {displayCurrency === 'fiat' &&
                                symbolLocation === 'suffix' &&
                                fiatPrice !== 0 &&
                                `-${formatLikeCurrency(
                                  (
                                    fiatPrice * atomicToHuman(tx[2], false)
                                  ).toFixed(2)
                                ).substring(1)}${fiatSymbol}`}
                              {displayCurrency === 'fiat' &&
                                fiatPrice === 0 &&
                                ''}
                            </p>
                          </td>
                        )}
                        {tx[2] > 0 && (
                          <td>
                            <p className="has-text-right">
                              {displayCurrency === Config.ticker &&
                                atomicToHuman(tx[2], true)}
                              {displayCurrency === 'fiat' &&
                                symbolLocation === 'prefix' &&
                                `${fiatSymbol}${formatLikeCurrency(
                                  (
                                    fiatPrice * atomicToHuman(tx[2], false)
                                  ).toFixed(fiatDecimals)
                                )}`}
                              {displayCurrency === 'fiat' &&
                                symbolLocation === 'suffix' &&
                                `${formatLikeCurrency(
                                  (
                                    fiatPrice * atomicToHuman(tx[2], false)
                                  ).toFixed(fiatDecimals)
                                )}${fiatSymbol}`}
                            </p>
                          </td>
                        )}
                        <td>
                          <p className="has-text-right">
                            {displayCurrency === Config.ticker &&
                              atomicToHuman(tx[3], true)}
                            {displayCurrency === 'fiat' &&
                              symbolLocation === 'prefix' &&
                              `${fiatSymbol}${formatLikeCurrency(
                                (
                                  fiatPrice * atomicToHuman(tx[3], false)
                                ).toFixed(fiatDecimals)
                              )}`}
                            {displayCurrency === 'fiat' &&
                              symbolLocation === 'suffix' &&
                              `${formatLikeCurrency(
                                (
                                  fiatPrice * atomicToHuman(tx[3], false)
                                ).toFixed(fiatDecimals)
                              )}${fiatSymbol}`}
                          </p>
                        </td>
                      </tr>
                      {rowIsExpanded && (
                        <tr>
                          <td />
                          <td colSpan={4}>
                            <table className="swing-in-top-fwd">
                              <tbody>
                                <tr className="no-hover">
                                  <td>
                                    <p>
                                      <b>{i18n.table_label_date_time}</b>
                                      <br />
                                      <b>{i18n.table_label_confirmations}</b>
                                      <br />
                                      <b>{i18n.table_label_block_height}</b>
                                      <br />
                                      <b>{i18n.table_label_unlock_time}</b>
                                      <br />
                                      <b>{i18n.table_label_transaction_hash}</b>
                                      <br />
                                      <b>{i18n.table_label_payment_id}</b>
                                      <br />
                                      <b>{i18n.fee}</b>
                                      <br />
                                      <b>{i18n.home_amount}</b>
                                      <br />
                                    </p>
                                  </td>
                                  <td>
                                    {tx[0] === 0
                                      ? i18n.home_in_memory
                                      : convertTimestamp(tx[0])}
                                    <br />
                                    {tx[0] !== 0
                                      ? Math.max(networkBlockHeight - tx[4], 0)
                                      : 0}
                                    <br />
                                    {tx[0] === 0
                                      ? i18n.home_in_memory
                                      : formatLikeCurrency(tx[4])}
                                    <br />
                                    {tx[8]} <br />
                                    {tx[1]} <br />
                                    {tx[5] !== '' ? tx[5] : 'none'}
                                    <br />
                                    {atomicToHuman(tx[7], true)} {Config.ticker}
                                    <br />
                                    <p
                                      className={
                                        tx[2] < 0
                                          ? 'is-negative-transaction has-text-danger'
                                          : ''
                                      }
                                    >
                                      {atomicToHuman(tx[2], true)}{' '}
                                      {Config.ticker}
                                    </p>
                                    <br />
                                    <br />
                                    <button
                                      className={`button ${elementBaseColor}`}
                                      value={transactionHash}
                                      onClick={this.openInExplorer}
                                    >
                                      {i18n.home_view_explorer}
                                    </button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="elem-to-center">
                <div className={`box ${fillColor}`}>
                  <p className={`${textColor} title has-text-centered`}>
                    <i className="fas fa-robot" />
                    &nbsp;&nbsp;{i18n.welcome_to_proton}
                  </p>
                  <br />
                  <p className={`${textColor} subtitle has-text-centered`}>
                    {i18n.home_no_transaction_yet}
                  </p>
                </div>
              </div>
            )}
            {transactions.length > transactionCount && (
              <form>
                <div className="field">
                  <div className="buttons">
                    <button
                      type="submit"
                      className="button is-warning"
                      onClick={this.handleLoadMore}
                    >
                      {i18n.load_more}
                    </button>
                    <button
                      type="submit"
                      className="button is-danger"
                      onClick={this.resetDefault}
                    >
                      {i18n.reset}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
