// Copyright (C) 2019 ExtraHash
// Copyright (C) 2023 Nolanium
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import NewWallet from '../components/NewWallet';

type Props = {};

export default class NewWalletPage extends Component<Props> {
  props: Props;

  render() {
    return <NewWallet />;
  }
}
