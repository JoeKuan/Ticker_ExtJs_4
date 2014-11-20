Ext.Loader.setConfig({
    enabled:true,
    paths: {
        'Ext.ux': './'
    }
});

Ext.require('Ext.ux.Ticker');

Ext.onReady(function() {

    // Ticker direction
    Ext.define("TickerDirection", {
        extend: "Ext.data.Model",
        fields: [ "direction" ]
    });

    Ext.define("TextRotation", {
        extend: "Ext.data.Model",
        fields: [ "degree" ]
    });

    // Stock price demo
    Ext.define("StockPrice", {
        extend: "Ext.data.Model",
        fields: [ "symbol",
                  { name: "price", type: "float" },
                  { name: "change", type: "float" },
                  "percent", "exchange"
                ]
    });

    var stockStores = [];
    var marketSymbols = [ "GOOG AAPL MSFT YHOO", "GOOG AAPL MSFT YHOO",
                          "HPQ AMD SNE CRM", "BATS.L NG.L RR.L BA.L" ];
    Ext.each(marketSymbols, function(symbols) {
        stockStores.push(Ext.create("Ext.data.Store", {
            model: "StockPrice",
            autoLoad: false,
            proxy: {
                type: 'ajax',
                url: 'demo/stock.php',
                actionMethods : {
                    read: 'POST'
                },
                reader: {
                    type: 'json',
                    root: 'rows'
                },
                extraParams: {
                    // Initially with Nasdaq stock symbols
                    s: symbols,
                    f: "sl1c1p2x"
                }
            }
        }));
    });

    // First store is for demo 1 - 4
    // Rest are created for demo 5 and 6
    var stockStore = stockStores.shift();

    /***
     * Common ticker message format handler for the demos
     */
    var messageFormat = function(record) {
        var percent = record.data.percent;
        var change = record.data.change;
        if (change >= 0) {
            change = "<font color='green'>▲ " + change + "</font>";
        } else {
            change = "<font color='red'>▼ " + change + "</font>";
        }
        if (percent.substr(0,1) == "+") {
            percent = "<font color='green'>" + percent + "</font>";
        } else {
            percent = "<font color='red'>" + percent + "</font>";
        }
        return record.data.symbol + ": " + record.data.price + " " + change + " " + percent;
    };

    // message format handler with stock exchange info
    var messageFormatGrp = function(record) {
        var percent = record.data.percent;
        var change = record.data.change;
        if (change >= 0) {
            change = "<font color='green'>▲ " + change + "</font>";
        } else {
            change = "<font color='red'>▼ " + change + "</font>";
        }
        if (percent.substr(0,1) == "+") {
            percent = "<font color='green'>" + percent + "</font>";
        } else {
            percent = "<font color='red'>" + percent + "</font>";
        }
        return [ record.data.exchange,
                 record.data.symbol + ": " + record.data.price + " " + change + " " + percent ];
    };

    /***
     * Ticker on click screener
     */
    function stockDetail(record) {
        var url = 'http://uk.finance.yahoo.com/q?s=' + record.data.symbol + '&ql=1';
        Ext.create('Ext.window.Window', {
            width: 550,
            height: 400,
            title: record.data.symbol,
                layout: 'fit',
            items:[{
                xtype: 'panel',
                html : '<iframe width ="100%" height="100%" src="' + url +
                    '"><p>Your browser does not support iframes.</p></iframe>'
            }]
        }).show();
    }

    /***
     * quick and VERY crappy code to quickly create a demo panel with ticker
     */
    var tickerDemo = function (demoConfig, tickerConfig) {

        var formConfig = {
            frame: true,
            width: 520,
            height: 350,
            border: false,
            defaults: {
                labelWidth: 180
            },
            items: [{
                xtype: 'label',
                text: demoConfig.demoMessage,
                shrinkWrap: 1,
                style: {
                    fontWeight: 'bold',
                    'margin-bottom': 20
                }
            }, {
                xtype: 'tbspacer',
                height: 10

            }, {
                // Speed
                xtype: 'numberfield',
                allowBlank: false,
                value: 2,
                fieldLabel: 'Scroll speed',
                minValue: 1,
                listeners: {
                    change: function(field, newVal) {
                        newVal && Ext.getCmp(tickerConfig.id).setSpeed(newVal);
                    }
                }
            }, {
                // Animation interval
                xtype: 'numberfield',
                allowBlank: false,
                value: 30,
                fieldLabel: 'Animation Interval',
                minValue: 1,
                listeners: {
                    change: function(field, newVal) {
                        var ticker = Ext.getCmp(tickerConfig.id);
                        newVal && ticker.setAnimateInterval(newVal);
                        ticker.stop();
                        ticker.start();
                    }
                }
            }, {
                // Store reload interval
                xtype: 'numberfield',
                allowBlank: false,
                value: (demoConfig.storeRefresh !== undefined) ? demoConfig.storeRefresh : 30000,
                disabled: (demoConfig.storeDisabled !== undefined) ? demoConfig.storeDisabled : false,
                fieldLabel: 'Store refresh Interval (msecs - 0 to disable)',
                minValue: 0,
                listeners: {
                    change: function(field, newVal) {
                        var ticker = Ext.getCmp(tickerConfig.id);
                        newVal && ticker.setStoreRefresh(newVal);
                        ticker.stop();
                        ticker.start();
                    }
                }
            }, {
                // Direction
                xtype: 'combo',
                store: Ext.create("Ext.data.Store", {
                    model: "TickerDirection",
                    data: [{ direction: 'left' },
                           { direction: 'right' } ]
                }),
                editable: false,
                triggerAction: 'all',
                queryMode: 'local',
                displayField: 'direction',
                valueField: 'direction',
                value: tickerConfig.direction ? tickerConfig.direction : 'left',
                fieldLabel: 'Direction',
                listeners: {
                    change: function(field, newVal) {
                        Ext.getCmp(tickerConfig.id).setDirection(newVal);
                    }
                }
            }, {
                // interrupt update
                xtype: 'checkbox',
                fieldLabel: 'Interrupt Update',
                checked: false,
                handler: function(field, checked) {
                    Ext.getCmp(tickerConfig.id).setInterruptUpdate(checked);
                }
            }, {
                // Message delimiter
                xtype: 'textfield',
                fieldLabel: 'Message Separator (for store setup, appear in next reload)',
                value: (Ext.isString(tickerConfig.messageSeparator)) ? tickerConfig.messageSeparator : ' ',
                enableKeyEvents: true,
                listeners: {
                    keyup: function(field) {
                        Ext.getCmp(tickerConfig.id).setMessageSeparator(field.getValue());
                    }
                }
            }],
            buttons:[{
                xtype: 'button',
                checked: true,
                text: 'Play',
                id: 'play_btn_' + demoConfig.demoId,
                allowDepress: false,
                pressed: (tickerConfig.autoStart === false) ? false : true,
                toggleGroup: 'ticker',
                toggleHandler: function(item, pressed) {
                    if (pressed) {
                        // Resume or start from the beginning
                        Ext.getCmp(tickerConfig.id).start({ resume: Ext.getCmp(tickerConfig.id).getStatus() === 'pause' });
                        Ext.getCmp('pause_btn_' + demoConfig.demoId).setDisabled(false);
                    } else {
                        Ext.getCmp(tickerConfig.id).pause();
                        Ext.getCmp('pause_btn_' + demoConfig.demoId).toggle(true, true);
                    }
                }
            }, {
                xtype: 'button',
                checked: true,
                id: 'pause_btn_' + demoConfig.demoId,
                allowDepress: false,
                text: 'Pause',
                disabled: (tickerConfig.autoStart === false) ? true : false,
                toggleGroup: 'ticker',
                toggleHandler: function(item, pressed) {
                    (pressed) && Ext.getCmp(tickerConfig.id).pause();
                }
            }, {
                xtype: 'button',
                text: 'Stop',
                handler: function(item, pressed) {
                    Ext.getCmp('pause_btn_' + demoConfig.demoId).setDisabled(pressed);
                    Ext.getCmp('play_btn_' + demoConfig.demoId).toggle(false, true);
                    pressed && Ext.getCmp(tickerConfig.id).stop();
                }
            }],
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'bottom',
                ui: 'footer',
                // VERY IMPORTANT: THIS AFFECT THE ORIENTATION OF THE SCROLL
                // DIRECTION
                layout: (tickerConfig.direction == 'up' || tickerConfig.direction == 'down') ? 'vbox' : 'hbox',
                align: 'stretch',
                items: [ tickerConfig ]
            }]
        };

        // Include toolbar buttons demo
        if (demoConfig.toolbarButtons) {
            formConfig.dockedItems[0].items = formConfig.dockedItems[0].items.concat([
                '-', {
                    text: 'NASDAQ',
                    id: 'nasdaq',
                    pressed: true,
                    allowDepress: false,
                    toggleGroup: 'market',
                    toggleHandler: function(button, pressed) {
                        Ext.getCmp(tickerConfig.id).stop(true);
                        stockStore.getProxy().extraParams.s = "GOOG AAPL MSFT YHOO";
                        stockStore.load({
                            scope: Ext.getCmp(tickerConfig.id),
                            callback: function() {
                                // Just grep the records, format and scroll
                                this.start({ autoLoad: false });
                            }
                        });
                    }
                }, {
                    text: 'NYSE',
                    id: 'nyse',
                    allowDepress: false,
                    toggleGroup: 'market',
                    toggleHandler: function(button, pressed) {
                        Ext.getCmp(tickerConfig.id).stop(true);
                        stockStore.getProxy().extraParams.s = "HPQ AMD SNE CRM";
                        stockStore.load({
                            scope: Ext.getCmp(tickerConfig.id),
                            callback: function() {
                                // Just grep the records, format and scroll
                                this.start({ autoLoad: false });
                            }
                        });
                    }
                }, {
                    text: 'FTSE',
                    id: 'ftse',
                    allowDepress: false,
                    toggleGroup: 'market',
                    toggleHandler: function(button, pressed) {
                        Ext.getCmp(tickerConfig.id).stop(true);
                        stockStore.getProxy().extraParams.s = "BATS.L NG.L RR.L BA.L";
                        stockStore.load({
                            scope: Ext.getCmp(tickerConfig.id),
                            callback: function() {
                                // Just grep the records, format and scroll
                                this.start({ autoLoad: false });
                            }
                        });
                    }
                }]);
        }

        // Construct multiple bottom toolbars with each a ticker object
        if (demoConfig.multipleToolbars) {
            formConfig.dockedItems = [];
            // Disable everything - this causes confusion with controlling
            // multiple ticker objects
            Ext.each(formConfig.items, function(item) {
                item.disabled = true;
            });
            Ext.each(demoConfig.tbsTextLabel, function(label, index) {
                formConfig.dockedItems.push({
                    xtype: 'toolbar',
                    dock: 'bottom',
                    ui: 'footer',
                    // VERY IMPORTANT: THIS AFFECT THE ORIENTATION OF THE SCROLL
                    // DIRECTION
                    layout: (tickerConfig.direction == 'up' || tickerConfig.direction == 'down') ? 'vbox' : 'hbox',
                    align: 'stretch',
                    items: [ label, '-', tickerConfig[index] ]
                });
            });
            // Reassign the stop, pause and play buttons handler for multiple ticker objects
            formConfig.buttons[0].pressed = true;
            formConfig.buttons[0].toggleHandler = function(item, pressed) {
                if (pressed) {
                    // Resume or start from the beginning
                    Ext.getCmp('ticker_demo_6_1').start({ resume: Ext.getCmp('ticker_demo_6_1').getStatus() === 'pause' });
                    Ext.getCmp('ticker_demo_6_2').start({ resume: Ext.getCmp('ticker_demo_6_2').getStatus() === 'pause' });
                    Ext.getCmp('ticker_demo_6_3').start({ resume: Ext.getCmp('ticker_demo_6_3').getStatus() === 'pause' });
                    Ext.getCmp('pause_btn_' + demoConfig.demoId).setDisabled(false);
                } else {
                    Ext.getCmp('ticker_demo_6_1').pause();
                    Ext.getCmp('ticker_demo_6_2').pause();
                    Ext.getCmp('ticker_demo_6_3').pause();
                    Ext.getCmp('pause_btn_' + demoConfig.demoId).toggle(true, true);
                }
            };
            formConfig.buttons[1].disabled = true;
            formConfig.buttons[1].toggleHandler = function(item, pressed) {
                    (pressed) && Ext.getCmp('ticker_demo_6_1').pause();
                    (pressed) && Ext.getCmp('ticker_demo_6_2').pause();
                    (pressed) && Ext.getCmp('ticker_demo_6_3').pause();
            };
            formConfig.buttons[2].handler = function(item, pressed) {
                    Ext.getCmp('pause_btn_' + demoConfig.demoId).setDisabled(pressed);
                    Ext.getCmp('play_btn_' + demoConfig.demoId).toggle(false, true);
                    (pressed) && Ext.getCmp('ticker_demo_6_1').stop();
                    (pressed) && Ext.getCmp('ticker_demo_6_2').stop();
                    (pressed) && Ext.getCmp('ticker_demo_6_3').stop();
            };

        }

        if (demoConfig.allowUpdateMessages) {
            formConfig.items.push({
                // textarea to type messages
                xtype: 'textareafield',
                id: 'messages_' + tickerConfig.id,
                fieldLabel: 'Set messages manually (separated with carriage return)',
                enableKeyEvents: true,
                resizable: true,
                value: tickerConfig.messages.join("\n"),
                cols: 40
            });

            formConfig.buttons.splice(0, 0, {
                text: 'Update Messages',
                handler: function(field) {
                    var val = Ext.getCmp('messages_' + tickerConfig.id).getValue().split('\n');
                    Ext.getCmp(tickerConfig.id).setMessages(val);
                }
            });
        }

        // Create demo for vertical ticker
        if (tickerConfig.direction == 'up' || tickerConfig.direction == 'down') {
            formConfig.dockedItems[0].dock = 'right';
            formConfig.dockedItems[0].items[0].width = 16;
            formConfig.items[5].store.loadData(
                [ { direction: 'up' },
                  { direction: 'down' }
                ]
            );
            formConfig.items[5].value = tickerConfig.direction;

            // Add text rotation option
            formConfig.items.push({
                xtype: 'combo',
                store: Ext.create("Ext.data.Store", {
                    model: "TextRotation",
                    data: [{ degree: -90 },
                           { degree: 90 } ]
                }),
                editable: false,
                triggerAction: 'all',
                queryMode: 'local',
                displayField: 'degree',
                valueField: 'degree',
                value: -90,
                fieldLabel: 'Text Rotation',
                listeners: {
                    change: function(field, newVal) {
                        Ext.getCmp(tickerConfig.id).setTextRotation(newVal);
                    }
                }
            });
        }

        return Ext.create('Ext.form.Panel', formConfig);
    };

    var win = Ext.create('Ext.window.Window', {
        closable: false,
        title: 'Ticker Demos',
        layout: 'fit',
        id: 'demo',
        items: [{
            xtype: 'tabpanel',
            activeTab: 0,
            items:[{
                // First tab - create a simple demo scrolling along the bottom toolbar
                title: 'Demo 1',
                layout: 'fit',
                // When this tab is activated, start the ticker
                listeners: {
                    activate: function(tab) {
                        Ext.getCmp('ticker_demo_1').start();
                    },
                    deactivate: function(tab) {
                        Ext.getCmp('ticker_demo_1').stop();
                    }
                },
                frame: true,
                border: false,
                items:[
                    tickerDemo({
                        demoMessage: 'This is a simple demo showing the ticker message scrolling along the bottom toolbar',
                        demoId: 1
                    }, {
                        id: 'ticker_demo_1',
                        store: stockStore,
                        messageFormat: messageFormat,
                        height: 16,
                        xtype: 'ticker'
                    })
                ]
            }, {
                // Second tab - create a simple demo scrolling along the bottom toolbar
                title: 'Demo 2',
                layout: 'fit',
                // When this tab is activated, start the ticker
                listeners: {
                    activate: function(tab) {
                        Ext.getCmp('ticker_demo_2').start();
                    },
                    deactivate: function(tab) {
                        Ext.getCmp('ticker_demo_2').stop();
                    }
                },
                frame: true,
                border: false,
                items:[
                    tickerDemo({
                        demoMessage: 'Scrolling ticker messages align with toolbar buttons and enable message on click',
                        // Set the ticker scroll messages next to toolbar buttons
                        toolbarButtons: true,
                        demoId: 2
                    }, {
                        height: 16,
                        xtype: 'ticker',
                        messageFormat: messageFormat,
                        id: 'ticker_demo_2',
                        store: stockStore,
                        // See Ext.dom.Element click event
                        messageOnClick: function(evt, el, record) {
                            stockDetail(record);
                        },
                        // Important you need this if you want to display along
                        // with other toolbar items
                        flex: 2
                    })
                ]
            }, {
                // Third tab - with ticker message scrolling vertically
                title: 'Demo 3',
                layout: 'fit',
                // When this tab is activated, start the ticker
                listeners: {
                    activate: function(tab) {
                        Ext.getCmp('ticker_demo_3').start();
                    },
                    deactivate: function(tab) {
                        Ext.getCmp('ticker_demo_3').stop();
                    }
                },
                frame: true,
                border: false,
                items:[
                    tickerDemo({
                        demoMessage: 'Ticker messages scroll vertically',
                        demoId: 3
                    }, {
                        height: 16,
                        xtype: 'ticker',
                        id: 'ticker_demo_3',
                        store: stockStore,
                        // Scroll vertically down
                        direction: 'down',
                        messageFormat: messageFormat
                    })
                ]
            }, {
                // Fourth tab - without store, manual setting messages and not autostart
                title: 'Demo 4',
                layout: 'fit',
                frame: true,
                border: false,
                // When this tab is activated, start the ticker
                listeners: {
                    deactivate: function(tab) {
                        Ext.getCmp('ticker_demo_4').stop();
                    }
                },
                items:[
                    tickerDemo({
                        demoMessage: "This demo tests the ticker component setup without store. Messages are setup manually. Disable pause on mousehover. Click 'Play' to start the ticker.",
                        // Fixate the field to avoid violation
                        storeRefresh: 0,
                        storeDisabled: true,
                        demoId: 4,
                        allowUpdateMessages: true
                    }, {
                        height: 16,
                        xtype: 'ticker',
                        id: 'ticker_demo_4',
                        autoStart: false,
                        pauseOnMouseOver: false,
                        messages: [ "This demo tests the ticker component setup without store.",
                                    "Messages are setup manually.",
                                    "Disable pause on mousehover.",
                                    "Click 'Play' to start the ticker."
                                  ]
                    })
                ]
            }, {
                // Fifth tab - Messages with categories
                title: 'Demo 5',
                layout: 'fit',
                frame: true,
                border: false,
                // When this tab is activated, start the ticker
                listeners: {
                    activate: function(tab) {
                        Ext.getCmp('ticker_demo_5').start();
                    },
                    deactivate: function(tab) {
                        Ext.getCmp('ticker_demo_5').stop();
                    }
                },
                items:[
                    tickerDemo({
                        demoMessage: "Ticker messages are categorised into groups with a group tag with multiple stores support. Each stock symbol also responds to click action",
                        demoId: 5
                    }, {
                        height: 16,
                        xtype: 'ticker',
                        id: 'ticker_demo_5',
                        store: stockStores,
                        messageFormat: messageFormatGrp,
                        enableCategory: true,
                        // we didn't specify FTSE which should be regarded as
                        // the last in sequence
                        categoryOrder: [ 'NasdaqNM', 'NYSE' ],
                        categoryTagsStyle: {
                            NasdaqNM: 'x-ticker-nasdaq',
                            London: 'x-ticker-ftse',
                            NYSE: 'x-ticker-nyse'
                        },
                        // See Ext.dom.Element click event
                        messageOnClick: function(evt, el, record) {
                            stockDetail(record);
                        }
                    })
                ]
            }, {
                // Sixth tab - Multiple tickers with multiple store
                title: 'Demo 6',
                layout: 'fit',
                frame: true,
                border: false,
                // When this tab is activated, start the ticker
                listeners: {
                    activate: function(tab) {
                        Ext.getCmp('ticker_demo_6_1').start();
                        Ext.getCmp('ticker_demo_6_2').start();
                        Ext.getCmp('ticker_demo_6_3').start();
                    },
                    deactivate: function(tab) {
                        Ext.getCmp('ticker_demo_6_1').stop();
                        Ext.getCmp('ticker_demo_6_2').stop();
                        Ext.getCmp('ticker_demo_6_3').stop();
                    }
                },
                items:[
                    tickerDemo({
                        demoMessage: "Multiple bottom toolbars, each associated with a ticker and a store",
                        multipleToolbars: true,
                        demoId: 6,
                        tbsTextLabel: [{
                            xtype: 'label', text: 'Nasdaq', cls: 'x-ticker-nasdaq'
                        }, {
                            xtype: 'label', text: 'NYSE', cls: 'x-ticker-nyse'
                        }, {
                            xtype: 'label', text: 'FTSE', cls: 'x-ticker-ftse'
                        }]
                    }, [{
                        height: 16,
                        xtype: 'ticker',
                        id: 'ticker_demo_6_1',
                        store: stockStores[0],
                        messageFormat: messageFormat
                    }, {
                        height: 16,
                        xtype: 'ticker',
                        id: 'ticker_demo_6_2',
                        store: stockStores[1],
                        messageFormat: messageFormat
                    }, {
                        height: 16,
                        xtype: 'ticker',
                        id: 'ticker_demo_6_3',
                        store: stockStores[2],
                        messageFormat: messageFormat
                    }])
                ]
            }]
        }]
    }).show();

    // Ext.getCmp('ticker_demo').start();

});
