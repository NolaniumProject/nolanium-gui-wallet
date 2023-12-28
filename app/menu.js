// Copyright (C) 2019 ExtraHash
// Copyright (C) 2023 Nolanium
//
// Please see the included LICENSE file for more information.
import { app, Menu, shell, BrowserWindow } from 'electron';
import log from 'electron-log';
import LocalizedStrings from 'react-localization';
import npmPackage from '../package.json';
import { messageRelayer } from './main.dev';
import Config from './Config';

export const i18n = new LocalizedStrings({
  // eslint-disable-next-line global-require
  en: require('./mainWindow/i18n/en-menu.json'),
  zh: require('./mainWindow/i18n/zh-menu.json')
});

const { version: currentVersion } = npmPackage;
const { productName } = npmPackage;

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  backendWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu() {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment() {
    this.mainWindow.openDevTools();
  }

  buildDarwinTemplate() {
    const subMenuAbout = {
      label: `${productName}`,
      submenu: [
        {
          label: `${i18n.about} ${productName}`,
          click: () => {
            shell.openExternal(`${Config.repoLink}/#readme`);
          }
        },
        { type: 'separator' },
        {
          label: `${i18n.hide} ${productName}`,
          accelerator: 'Command+H',
          selector: 'hide:'
        },
        {
          label: `${i18n.hide_others}`,
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:'
        },
        { label: i18n.show_all, selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: i18n.quit,
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    };
    const subMenuFile = {
      label: i18n.file,
      submenu: [
        {
          label: 'Open',
          accelerator: 'Command+O',
          click: () => {
            this.handleOpen();
          }
        },
        {
          label: i18n.new,
          accelerator: 'Command+N',
          click: () => {
            this.handleNew();
          }
        },
        {
          label: i18n.restore,
          click: () => {
            this.handleRestore();
          }
        },
        {
          label: i18n.save,
          accelerator: 'Command+S',
          click: () => {
            this.handleSave();
          }
        },
        {
          label: i18n.save_copy,
          click: () => {
            this.handleSaveAs();
          }
        },
        {
          label: i18n.close,
          accelerator: 'Command+W',
          click: () => {
            this.mainWindow.close();
          }
        }
      ]
    };
    const subMenuEdit = {
      label: i18n.edit,
      submenu: [
        { label: i18n.undo, accelerator: 'Command+Z', selector: 'undo:' },
        { label: i18n.redo, accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: i18n.cut, accelerator: 'Command+X', selector: 'cut:' },
        { label: i18n.copy, accelerator: 'Command+C', selector: 'copy:' },
        { label: i18n.paste, accelerator: 'Command+V', selector: 'paste:' },
        {
          label: i18n.select_all,
          accelerator: 'Command+A',
          selector: 'selectAll:'
        }
      ]
    };
    const subMenuViewDev = {
      label: i18n.view,
      submenu: [
        {
          label: i18n.reload,
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          }
        },
        {
          label: i18n.toggle_fullscreen,
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          }
        },
        {
          label: i18n.toggle_devtools,
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.toggleDevTools();
          }
        }
      ]
    };
    const subMenuViewProd = {
      label: i18n.view,
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          }
        }
      ]
    };
    const subMenuWallet = {
      label: i18n.wallet,
      submenu: [
        {
          label: i18n.password,
          click: () => {
            this.handlePasswordChange();
          }
        },
        {
          label: i18n.backup,
          click: () => {
            this.handleBackup();
          }
        },
        {
          label: i18n.lock,
          accelerator: 'Command+L',
          click: () => {
            this.handleLock();
          }
        }
      ]
    };
    const subMenuWindow = {
      label: i18n.window,
      submenu: [
        {
          label: i18n.minimize,
          accelerator: 'Command+M',
          selector: 'performMiniaturize:'
        },
        {
          label: i18n.close,
          accelerator: 'Command+W',
          selector: 'performClose:'
        },
        { type: 'separator' },
        { label: i18n.bring_all_front, selector: 'arrangeInFront:' }
      ]
    };
    const subMenuTools = {
      label: i18n.tools,
      submenu: [
        {
          label: i18n.export_csv,
          click: () => {
            this.handleExportToCsv();
          }
        }
      ]
    };
    const subMenuHelp = {
      label: i18n.help,
      submenu: [
        {
          label: `${currentVersion}`
        },
        {
          label: i18n.support,
          click() {
            shell.openExternal('https://discord.gg/VqsQntFK');
          }
        },
        {
          label: i18n.report_bug,
          click() {
            shell.openExternal(`${Config.repoLink}/issues`);
          }
        },
        {
          label: i18n.feature_request,
          click() {
            shell.openExternal(`${Config.repoLink}/issues`);
          }
        }
      ]
    };
    const subMenuDonate = {
      label: 'Donate',
      submenu: [
        {
          label: `Donate to the Developers`,
          click: () => {
            this.handleDonate();
          }
        }
      ]
    };

    const subMenuView =
      process.env.NODE_ENV === 'development' ? subMenuViewDev : subMenuViewProd;

    return [
      subMenuAbout,
      subMenuFile,
      subMenuEdit,
      subMenuWallet,
      subMenuView,
      subMenuWindow,
      subMenuTools,
      subMenuHelp,
      subMenuDonate
    ];
  }

  handleSave() {
    messageRelayer.sendToBackend('saveWallet', true);
  }

  handleOpen() {
    this.mainWindow.webContents.send('handleOpen');
  }

  handleSaveAs() {
    this.mainWindow.webContents.send('handleSaveAs');
  }

  handleBackup() {
    this.mainWindow.webContents.send('handleBackup');
  }

  handleNew() {
    this.mainWindow.webContents.send('handleNew');
  }

  handlePasswordChange() {
    this.mainWindow.webContents.send('handlePasswordChange');
  }

  handleExportToCsv() {
    this.mainWindow.webContents.send('exportToCSV');
  }

  handleLock() {
    this.mainWindow.webContents.send('handleLock');
  }

  handleRestore() {
    this.mainWindow.webContents.send('handleSaveSilent');
    log.debug('Import menu selected.');
    this.mainWindow.webContents.send('handleImport');
  }

  handleDonate() {
    this.mainWindow.webContents.send('handleDonate');
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: i18n.file,
        submenu: [
          {
            label: i18n.open,
            accelerator: 'Ctrl+O',
            click: () => {
              this.handleOpen();
            }
          },
          {
            label: i18n.new,
            accelerator: 'Ctrl+N',
            click: () => {
              this.handleNew();
            }
          },
          {
            label: i18n.restore,
            click: () => {
              this.handleRestore();
            }
          },
          {
            label: i18n.save,
            accelerator: 'Ctrl+S',
            click: () => {
              this.handleSave();
            }
          },
          {
            label: i18n.save_copy,
            click: () => {
              this.handleSaveAs();
            }
          },
          {
            label: i18n.close,
            accelerator: 'Ctrl+W',
            click: () => {
              this.mainWindow.close();
            }
          }
        ]
      },
      {
        label: i18n.wallet,
        submenu: [
          {
            label: i18n.password,
            click: () => {
              this.handlePasswordChange();
            }
          },
          {
            label: i18n.backup,
            click: () => {
              this.handleBackup();
            }
          },
          {
            label: i18n.lock,
            accelerator: 'Ctrl+L',
            click: () => {
              this.handleLock();
            }
          }
        ]
      },
      {
        label: i18n.view,
        submenu:
          process.env.NODE_ENV === 'development'
            ? [
                {
                  label: i18n.reload,
                  accelerator: 'Ctrl+R',
                  click: () => {
                    this.mainWindow.webContents.reload();
                  }
                },
                {
                  label: i18n.toggle_fullscreen,
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen()
                    );
                  }
                },
                {
                  label: i18n.toggle_devtools,
                  accelerator: 'Alt+Ctrl+I',
                  click: () => {
                    this.mainWindow.toggleDevTools();
                  }
                }
              ]
            : [
                {
                  label: i18n.toggle_fullscreen,
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen()
                    );
                  }
                }
              ]
      },
      {
        label: i18n.tools,
        submenu: [
          {
            label: i18n.export_csv,
            click: () => {
              this.handleExportToCsv();
            }
          }
        ]
      },
      {
        label: i18n.help,
        submenu: [
          {
            label: `${currentVersion}`
          },
          {
            label: i18n.support,
            click: () => {
              shell.openExternal('https://discord.gg/VqsQntFK');
            }
          },
          {
            label: i18n.about,
            click: () => {
              shell.openExternal(`${Config.repoLink}#readme`);
            }
          },
          {
            label: i18n.report_bug,
            click: () => {
              shell.openExternal(`${Config.repoLink}/issues`);
            }
          },
          {
            label: i18n.feature_request,
            click: () => {
              shell.openExternal(`${Config.repoLink}/issues`);
            }
          }
        ]
      },
      {
        label: 'Donate',
        submenu: [
          {
            label: 'Donate to the Developers',
            click: () => {
              try {
                console.log('handleDonate');
                this.handleDonate();
              } catch (err) {
                log.error(err);
              }
            }
          }
        ]
      }
    ];

    return templateDefault;
  }
}
