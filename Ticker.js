/***
 * @author Joe Kuan 
 * @docauthor Joe Kuan
 * Created and documented by Joe Kuan <kuan.joe@gmail.com> 
 * Last Updated 2nd Feb 2013
 *
 * Ticker class creates a messages scrolling component that can move horizontally from left to right or vice versa, 
 * or even vertically moving from top to bottom or vice versa. This component can be used as a stocks, 
 * news or events ticker. The class offers a number of flexibilities and features. Here are some of them:
 *
 * * Supports horizontal and vertical (offers -90 and 90 degree verical facing) scrolling banners with either directions
 * * Scrolling speed control
 * * Supports single or multiple binding of Store objects or manually update without relying on Store 
 * * Supports ticker messages categorisation and displays them with category labels with own CSS class
 * * Supports ticker messages onclick action e.g. click to zoom into information of a stock, news or an event
 * * Supports mouseover pause on ticker messages, so viewer can read or click them easily
 * 
 * A variety of online demos can be found at [joekuan.org](http://joekuan.org/demos/Ticker_ExtJs_4).
 *
 * # Create a simple stock ticker
 * Suppose we already have stock JSON data returning from the server side and we have defined a Store as follows:
 *     Ext.define("StockPrice", {
 *         extend: "Ext.data.Model",
 *         fields: [ "symbol", 
 *                   { name: "price", type: "float" }, 
 *                   { name: "change", type: "float" },
 *                  "percent", "exchange"
 *                 ]
 *     });
 *
 *     var store = Ext.create("Ext.data.Store", {
 *          model: "StockPrice",
 *          autoLoad: false,
 *          proxy: {
 *              type: 'ajax',
 *              url: 'demo/stock.php',
 *              ....
 *          }
 *     });
 * First we need to define a message formatter ({@link #cfg-messageFormat}) for Store's records for the Ticker class.
 *     var messageFormat = function(record) {
 *         var percent = record.data.percent;
 *         var change = record.data.change;
 *         if (change >= 0) {
 *             change = "<font class='up'>▲ " + change + "</font>";
 *         } else {
 *             change = "<font class='down'>▼ " + change + "</font>";
 *         }
 *         if (percent.substr(0,1) == "+") {
 *             percent = "<font class='up'>" + percent + "</font>";
 *         } else {
 *             percent = "<font class='down'>" + percent + "</font>";
 *         }
 *         return record.data.symbol + ": " + record.data.price + " " + change + " " + percent;
 *     };
 * Then we create a window with bottom toolbar binded to Ticker and Store objects.
 *     Ext.create('Ext.window.Window', {
 *         title: 'Ticker Demos',
 *         layout: 'fit',
 *         width: 520,
 *         height: 250,
 *         dockedItems: [{
 *             xtype: 'toolbar',
 *             dock: 'bottom',
 *             ui: 'footer',
 *             layout: 'hbox',
 *             align: 'stretch',
 *             items: [{
 *                 xtype: 'ticker',
 *                 store: store,
 *                 messageFormat: messageFormat,
 *                 height: 16
 *             }]
 *         }]
 *     });
 * Here is a screenshot of bottom toolbar containing ticker withc stock symbols:
 * {@img ticker.png}
 * 
 * # Create categorised multiple stores ticker symbol
 * For categrised (or grouping ticker messages) the {@link #cfg-messageFormat} handler need to be 
 * slighlty different which also returns the group name in the form of array, such as: 
 *     [ group_name, message ]
 * If we use multiple Stores with the Ticker class, they all need to be run through 
 * the same message handler. Here is slightly modified version for categorised messages
 *     var messageFormatGrp = function(record) {
 *         var percent = record.data.percent;
 *         var change = record.data.change;
 *         // Same as above code
 *         ....
 *         return [ record.data.exchange, 
 *                  record.data.symbol + ": " + record.data.price + 
 *                  " " + change + " " + percent ];
 *     };
 * The xtype ticker part can be declared as follows:
 *         xtype: 'ticker',
 *         height: 16,
 *         // An array of Store objects
 *         store: stockStores,
 *         messageFormat: messageFormatGrp,
 *         enableCategory: true,
 *         // Any groups that are not listed in categoryOrder
 *         // are appended to the end of the group order
 *         categoryOrder: [ 'NasdaqNM', 'NYSE' ],
 *         // CSS class for the group label before the ticker messages
 *         categoryTagsStyle: {
 *             NasdaqNM: 'x-ticker-nasdaq',
 *             London: 'x-ticker-ftse',
 *             NYSE: 'x-ticker-nyse'
 *         },
 *         // Popup a window to show higher detail of the stocks
 *         messageOnClick: function(evt, el, record) {
 *             showStockDetails(record);
 *         }
 * Here is a screenshot showing categorised ticker messages with 'NYSE' being displayed as a category tag
 * {@img ticker_group.png}
 *
 * ## Layout & CSS Classes
 * For vertical scrolling ticker, configures the container layout as 'vbox', e.g.
 *     dockedItems[{
 *         xtype: 'toolbar',
 *         dock: 'right',
 *         ui: 'footer',
 *         layout: 'vbox',
 *         align: 'stretch',
 *         items: [{
 *             xtype: 'ticker',
 *             direction: 'down',
 *             ....
 *         }]
 * The ticker object is created with CSS class 'x-ticker-wrap' and setup as follows
 * in the demo:
 *     .x-ticker-wrap {
 *          overflow: hidden;
 *     }
 */
Ext.define("Ext.ux.Ticker", {
    extend: "Ext.Component",
    alias: "widget.ticker",
    baseCls : 'x-ticker',

    config: {
        /***
         * @cfg {Number} [textRotation=-90]
         * If ticker {@link #cfg-direction} is configured 'up' or 'down', then this option changes the rotation
         * of the ticker message. Possible values: 90 or -90. 
         */
        textRotation: -90,
        /***
         * This is the interval (in msecs) to call the internal routine to move the ticker messages.
         * If the value is higher, the movement becomes choppy or smoother with lower value.
         * **Warning**: this option can affect the performance of your application if set it to too low.
         */
        animateInterval: 30,
        /***
         * Direction of the ticker horizontal and vertical movement. Possible values: 'left', 'right', 
         * 'up', and 'down'
         */
        direction : 'left',
        /***
         * This config controls the speed of the movement. The value is actually number of pixels moves
         * towards the configured {@link #cfg-direction} in every {@link #cfg-animateInterval}. 
         */
        speed: 2,
        /***
         * If the ticker is setup with store, this variable configures the reload interval (in msecs)
         * for the store. Zero value means never refresh, default 30 secs
         */
        storeRefresh: 30000,
        /***
         * This config controls whether to suppress new messages update until all the ticker messages
         * have been scrolled off even the {@link #cfg-storeRefresh} timeout is up. Setting this to true means
         * may cause update appear interruptive
         */
        interruptUpdate: false,
        /***
         * When the mouse is hovered over the ticker messages, the default action is the messages stop
         * scrolling. So the user can read it or click it when it stops scrolling.
         */
        pauseOnMouseOver: true,
        /***
         * Separator between ticker messages
         */
        messageSeparator: ' ',
        /***
         * Separator between message groups. Only valid if option enableGroup is set to true
         */
        categorySeparator: ' -- ',
        /***
         * categoryOrder controls how the order of categorised messages appearing in the
         * ticker component. An array of a sequence of group names
         */
        categoryOrder: [],
        /***
         * @cfg {Function} [messageOnClick=null]
         * If this handler option is defined, then each ticker message will become clickable and calls this
         * handler. A CSS class, x-ticker-messageclick, is also inserted into each ticker message element.
         * Users can style this class as:
         *     .x-ticker-messageclick {
         *         cursor: pointer;
         *     }
         * For implementation of handler, See {@link Ext.dom.Element#event-click}. The Store's Record 
         * object is passed as an opts parameter.
         *     messageOnClick: function(evt, el, record) {
         *         stockDetails(record);
         *     }
         */
        messageOnClick: null,
        /***
         * @cfg {Function} [messageFormat=null]
         * Required field if this component is defined with {@link #cfg-store}. 
         * A message formatting function converts from a Record object to ticker message. Caller
         * must deal with the situation if {@link #cfg-enableCategory} is enabled.
         *
         *     // Normal ticker message situation
         *     messageFormat: function(record) {
         *         return record.data.message;
         *     }
         * Or categoried message record
         *     messageFormat: function(record) {
         *         return [ record.data.groupName. record.data.message ];
         *     }    
         */
        messageFormat: null
    },

    flex: 2,

    /***
     * @cfg
     * Setting this option to true will automatically start displaying the ticker messages once
     * the component is rendered
     */
    autoStart: true,

    /***
     * @cfg
     * This option allows ticker messages to be grouped into categories.
     * The {@link #cfg-messageFormat} must be defined to return an array of two items from a record: group name and message 
     */
    enableCategory: false,

    /***
     * @cfg
     * groupTagsStyle set the dislay style of each category tag. Each field name inside
     * the object must match against the group name returned from {@link #cfg-messageFormat} handler
     *     groupTagsStyle: {
     *         warn: 'x-ticker-warn',
     *         info: 'x-ticker-info'
     *     }
     */
    categoryTagsStyle: {},

    /***
     * @cfg
     * Define default CSS style for category tag instead of specifying for each group
     */
    defaultTagStyle: '',

    /***
     * @private
     * internally use forcing displaying new message conditionally
     */
    checkNewMsg: false,

    /***
     * @private
     * internal variable to sync multiple stores load
     */
    storeLoadCount: 0,

    /***
     * @cfg
     * The ticker component can be setup with an array of messages
     * instead of using Store. For simple messages setup, use this 
     * configuration as an array of strings
     *     messages: [ 'Message 1', 'Message 2' ]
     * If {@link #cfg-enableCategory} option is set to true, then the 
     * {@link #cfg-messages} option must contains an array of category and
     * message pair
     *     messages: [ [ 'Group A', 'Message A1' ], [ 'Group A', 'Message A2' ],
     *                 [ 'Group B', 'Message B1' ], .... ]
     */
    messages: [],

    /***
     * This is **not** the width of containing element for the ticker.
     * It is the whole width of the ticker element with the entire message string. 
     * @readonly
     */
    tickerTextWidth: 0,

    /***
     * Current ticker scroll status: 'play', 'pause', 'stop'
     * @readonly
     */
    status: 'stop',

    /***
     * Size of the container in terms of the viewable part to the ticker component
     * whenever the ownerCt is resize, this value is also adjusted
     * @readonly
     */
    ownerSize: { width: 0, height: 0 },

    /***
     * @cfg 
     * Ticker component can be optionally binded with single or multiple stores. If multiple stores, the
     * option is simply an array of Store objects.
     *     store: [ nasdaqStore, nyseStore, ftseStore ]
     * If store not use, then {@link #cfg-messages} option should be used.
     */
    store: null,

    // Set by reload method to tell the store to reload once
    // the ticker is scrolled to the end
    reloadStore : false,

    els : [],

    msgHandlers : {},

    autoEl : {
        tag : 'div',
        cls : 'x-ticker-wrap'
    },

    debug: false,

    /***
     * Easy for me to debug my crap code. For deployment, initiate the class as:
     *     log: Ext.emptyFn
     */
    log: function(msg) {
        (this.debug && typeof console != 'undefined' && console.log) && console.log(msg);
    },

    /***
     * Return the current ticker scroll status
     * @return {String} - 'stop', 'pause', 'start'
     */
    getStatus: function() {
        return this.status;
    },

    /***
     * Set the current direction of the scrolling messages. This method
     * only allows direction to be changed along the same horizontal or
     * or verical movement, i.e. passing 'up' while the component is
     * in 'left' or 'right' directions will ignore it the parameter
     */
    setDirection: function(direction) {
        // Make sure same alignment
        if (this.direction == 'up' || this.direction == 'down') {
            if (direction == 'left' || direction == 'right')
                return this;
        } else if (this.direction == 'left' || this.direction == 'right') {
            if (direction == 'up' || direction == 'down')
                return this;
        }

        this.direction = direction;

        (direction == 'up' || direction == 'down') && (this.setHeight('100%'));

        // Update the new directional scrolling
        this.rendered && this.setPosInfo(); 

        return this;
    },

    /***
     * This method only has effect when the {@link #cfg-direction} is configured 'up' 
     * or 'down'
     */
    setTextRotation: function(degree) {
        if (Ext.isNumeric(degree)) {

            if (parseInt(degree, 10) == this.textRotation)
                return this;

            this.textRotation = degree;
            // Update the new directional scrolling
            if (this.rendered)  {
                // For text rotation, we cannot 
                this.setPosInfo();
                this.contentEl = this.contentEl.destroy();
                this.setMessages(this.currentMessages);
            } 
            return this;
        }
        return null;
    },

    /***
     * @private
     */
    setPosInfo : function() {
        var posInfo;
        this.log("setPosInfo: " + this.getDirection() + ", height " + this.el.getHeight() + ", width " + this.getSize().width);
        switch (this.direction) {
        case "left":
        case "right":
            posInfo = {
                left : '100%',
                display: 'block',
                "white-space": "nowrap"
            };
            this.task.run = this.scroll.horz;
            break;
        case "up":
        case "down":
            posInfo = {
                top : this.height || this.el.getHeight(),
                "white-space": "nowrap",
                display: 'block',
                "-webkit-transform": "rotate(" + this.textRotation + "deg)", 
                "-moz-transform": "rotate(" + this.textRotation + "deg)",
                "-ms-transform": "rotate(" + this.textRotation + "deg)",
                "-o-transform": "rotate(" + this.textRotation + "deg)"
            };
            this.task.run = this.scroll.vert;
            break;
        }
        posInfo.position = 'relative';

        this.posInfo = posInfo;
    },

    /***
     * @private
     * Format message for both simple or categorised messages from stores
     */
    formatStoreMessage: function(store, displayMessages) {
        if (this.enableCategory) {
            // Putting messages into groups
            store.each(function(record) {
                var grpMsg = this.messageFormat(record);
                displayMessages[grpMsg[0]] = displayMessages[grpMsg[0]] || [];
                displayMessages[grpMsg[0]].push( [ grpMsg[1], record ] );
            }, this);                
        } else {
            // Simply appending messages
            store.each(function(record) {
                displayMessages.push([ this.messageFormat(record), record ]);
            }, this);
        }
    },

    setReload : function() {
        this.log("Call setReload with number of store " + this.store.length);

        var displayMessages = (this.enableCategory) ? {} : [];

        Ext.each(this.store, function(store) {
            store.on('load', function(s) {
                this.formatStoreMessage(s, displayMessages);
                this.reloadStore = false;

                // Setup the next interval to reload if configured
                this.storeLoadCount++;
                this.log("store load: count:" + this.storeLoadCount + ", total:" + this.store.length);
                if (this.storeLoadCount == this.store.length) {
                    this.log("Delay store reload " + this.storeRefresh + "(" + this.store.length + ")" );
                    // We got all the messages in groups or a big list and display them
                    this.updateMessages(displayMessages);
                    this.storeRefresh && (this.storeLoadCount = 0) && this.reloadTask.delay(this.storeRefresh);
                }

            }, this);

        }, this);
    },

    setAnimateInterval: function(interval) {
        if (interval) {
            this.animateInterval = interval;
            this.task && (this.task.interval = this.getAnimateInterval());
        }
    },

    /***
     * @private
     * Store the messages and when the ticker scrolls to the end
     * then format the new messages
     */
    updateMessages : function(msgs, force) {

        // If no content setup yet, then setup now
        if(!this.contentEl && this.rendered) {
            this.log("updateMessages - format event msgs");
            this.setMessages(msgs);
        } else if (force) {
            this.log("force updateMessages - format event msgs");
            this.setMessages(msgs);
        } else {
            this.log("updateMessages - store new msgs " + msgs);
            this.newMessages = msgs;
        }
    },

    // If msgs is string, then just update element
    // If object with warn or info fields, then add some color tags
    setMessages : function(msgs) {
        if(!this.contentEl) {
            this.contentEl = this.el.createChild({
                tag : 'span',
                style : this.posInfo
            });
            // Mouse over stop ticking
            this.contentEl.on('mouseover', function() {
                if (this.pauseOnMouseOver) {
                    this.speed_save = this.speed;
                    this.speed = 0;
                }
            }, this);

            // Mouse out - resume
            this.contentEl.on('mouseout', function() {
                this.pauseOnMouseOver && (this.speed = this.speed_save);
            }, this);


            this.contentEl.removeCls(['x-hidden', 'x-hide-display']);
        }

        if (msgs) {
            var msgsStr = '';

            // Initialise and cleanup
            this.grpEls = this.grpEls || [];
            Ext.each(this.grpEls, function(el) {
                el.remove();
            });
            this.grpEls = [];

            if (Ext.isArray(msgs)) {
                // Array of normal ticker messages
                // If onlick is defined, then define onclick handler 
                // with the record object
                if (this.messageOnClick) {
                    Ext.each(msgs, function(message, index) {
                        var el = this.contentEl.createChild({
                            tag: 'span',
                            html: message[0],
                            cls: (this.messageOnClick) ? 'x-ticker-message x-ticker-messageclick' : 'x-ticker-message'
                        });

                        this.grpEls.push(el);

                        (this.messageSeparator) && 
                            (this.grpEls.push(this.contentEl.createChild({ tag: 'span', html: this.messageSeparator })));

                        // If onlick is defined, then define onclick handler 
                        // with the record object
                        (this.messageOnClick) && el.on('click', this.messageOnClick, el, message[1]);

                    }, this);

                } else {
                    this.currentMessages = '';
                    Ext.each(msgs, function(message) {
                        this.currentMessages += this.messageSeparator + message[0]; 
                    }, this);
                    this.contentEl.update(this.currentMessages);
                }
            } else if (Ext.isObject(msgs)) {
                // Array of ticker messages in category group
                // First format the group in sequence according to the
                // groupOrder option
                // Copy a group order first in array of array first
                var grpOrderMsgs = [];
                Ext.each(this.categoryOrder, function(grpName) {
                    grpOrderMsgs.push([ grpName ]);
                });
                for (var grpName in msgs) {

                    var idx = Ext.Array.indexOf(this.categoryOrder, grpName);
                    if (idx === -1) {
                        grpOrderMsgs.push([ grpName, msgs[grpName] ]);
                    } else {
                        grpOrderMsgs[idx].push(msgs[grpName]);
                    }
                }
                // At here, we will have an ordered grouped messages in
                // form of
                // [ [ 'first',  [ ['msgA', record], ['msgB', record] ] ],
                //   [ 'second', [ ['msgC', record], ['msgD', record] ] ],
                //   ....
                // Now we format each group based on the categoryTagsStyle
                Ext.each(grpOrderMsgs, function(groupMessages) {
                    // Find the matching group style
                    var cls = ( this.categoryTagsStyle[groupMessages[0]] ) || this.defaultTagStyle;

                    // Create the group tag
                    var tagStyle = {
                        tag: 'font',
                        html: groupMessages[0],
                        cls: cls
                    };

                    this.grpEls.push(this.contentEl.createChild(tagStyle));

                    // Add group separator if defined
                    (this.categorySeparator) && 
                        (this.grpEls.push(this.contentEl.createChild({ tag: 'span', 
                                                                       html: this.categorySeparator })));

                    // Create each message element following the group tag
                    Ext.each(groupMessages[1], function(message, index) {
                        var el = this.contentEl.createChild({
                            tag: 'span',
                            html: message[0],
                            cls: (this.messageOnClick) ? 'x-ticker-message x-ticker-messageclick' : 'x-ticker-message'
                        });

                        this.grpEls.push(el);

                        (this.messageSeparator) && 
                            (this.grpEls.push(this.contentEl.createChild({ tag: 'span', html: this.messageSeparator })));

                        // If onlick is defined, then define onclick handler 
                        // with the record object
                        (this.messageOnClick) && el.on('click', this.messageOnClick, el, message[1]);

                    }, this);

                }, this);

            } else if (Ext.isString(msgs)) {
                this.currentMessages = msgs;  
                this.contentEl.update(this.currentMessages);
            }
            this.log(this.currentMessages);
            this.tickerTextWidth = this.contentEl.getTextWidth();
        }
    },

    reload : function() {
        this.reloadStore = true;
        if(this.status === 'stop') {
            //console.log("Ticker: in reload method. Not running. run start()");
            this.start();
        } else if(this.store) {
            // Call the load method. If there are records returned, the handler
            // will pack the records into event message and create the scrolling
            // DOM elements inside the ticker
            this.store.load();
        }
    },

    bindMsgHandler : function(type, handler) {
        this.msgHandlers[type] = handler;
    },

    constructor: function(cfg) {
        (Ext.isObject(cfg.store)) && (cfg.store = [ cfg.store ]);
        this.initConfig(cfg);
        this.callParent(arguments);

        // Turn store into an array away, consistent way to deal
        // with multiple stores
    },

    beforeRender: function() {

        this.ownerCt.on('resize', function(container) {
            this.ownerSize = container.getSize();
        }, this);

    },

    afterRender : function() {

        this.ownerSize = this.ownerCt.getSize();
        console.log("afterRender ---> " + this.ownerSize.height + ", " + this.ownerSize.width);

        this.task = {
            interval : this.getAnimateInterval(),
            scope : this
        };

        // Setup delay task for the store reload timer
        this.reloadTask = new Ext.util.DelayedTask(function(){
            this.store && this.store.load();
        }, this);
        
        this.setPosInfo();

        if(this.contentEl) {
            var ce = Ext.getDom(this.contentEl);
            this.el.dom.appendChild(ce);
            this.contentEl = Ext.get(ce);
            this.contentEl.setPositioning(this.posInfo);
            this.contentEl.removeClass(['x-hidden', 'x-hide-display']);
        }

        this.callParent(arguments);

        // If store is provided, then bind the load method
        if(this.store) {
            this.setReload();
        } else if (this.messages) {
            // If messages are already defined, then initialise it
            this.currentMessages = this.messages;
            this.setMessages(this.messages);
        }

        console.log("autoStart " + this.autoStart);
        if(this.autoStart && this.contentEl) {
            this.status = 'play';
            Ext.TaskManager.start(this.task);
        } 
    },

    /***
     * @private
     * initialise the ticker banner to the start position according to the direction
     */
    initMessagePos: function() {

        if (!this.contentEl)
            return;

        var left = null, top = null; 
        switch (this.direction) {
        case 'left':
            left = this.getBox().width;
            break;
        case 'right':
            left = -this.tickerTextWidth;
            break;
        case 'up':
            top = (this.textRotation == -90) ? this.tickerTextWidth + this.ownerSize.height : this.ownerSize.height;
            break;
        case 'down':
            top = (this.textRotation == -90) ? 0 : -(this.tickerTextWidth + this.ownerSize.height);
            break;
        }

        Ext.isNumber(left) && this.contentEl.setLeft(left);
        Ext.isNumber(top) && this.contentEl.setTop(top);
    },

    // Stop scroll and clear the content
    pause : function() {
        if(this.task) {
            Ext.TaskManager.stop(this.task);
            this.status = 'pause';
        }
    },

    /***
     * Stop scroll and clear the content
     * @param removeCache {Boolean} true to remove the current ticker messages 
     * in display, not the store records. Default false
     */
    stop : function(removeCache) {
        if(this.task) {
            Ext.TaskManager.stop(this.task);
            this.status = 'stop';
        }

        (this.contentEl) && (this.contentEl.update(''));

        removeCache && (this.currentMessages = '') && (this.newMessages = '');
    },

    /***
     * This function is for starting the Ticker component manually. There are different ways
     * to start the ticker: start from pause, return from asyn store load, or fetch from store
     * records directly
     * @param opts {Object} contains option variables controlling different way to restart
     * the ticker
     * @param opts.resume {Boolean} true to continue scrolling from the paused status. Otherwise
     * restart the current displayed messages from the beginning
     * @param opts.autoLoad {Boolean} If the ticker component is configured with store, then with 
     * autoLoad set to true will cause this component started by internally calling the store's 
     * load method (ACTIVE). Alternative, just let the external caller to handle the store's async load method
     * to invoke the this method with autoLoad setting to false. This will cause the ticker component to get records
     * directly from the store (PASSIVE). Default true. Note that the store will
     * still be refreshed if {@link #cfg-storeRefresh} option is set to non zero value.
     */
    start : function(opts) {
        
        var resume = opts && opts.resume;
        var storeLoad = (opts) ? opts.autoLoad : true;

        if (!resume) {
            // Restart the ticker scroll back to the starting position
            // and resume the current messages
            if (this.contentEl && this.currentMessages) {
                // Force to set the currentMessages to the contentEl
                this.updateMessages(this.currentMessages, true);
            }

            // Reload the store if configured for new update messages
            if(this.store) {
                this.newMessages = '';
                this.checkNewMsg = true;
                if (storeLoad) {
                    this.log("Ticker: Load ticker store, then start the task manager");
                    Ext.each(this.store, function(store) {
                        store.load({
                            scope: this,
                            callback: function() {
                                this.initMessagePos();
                                Ext.TaskManager.start(this.task);
                                this.status = 'play';
                            }
                        });
                    }, this);
                } else {
                    // Because the caller deal with the store load async
                    // we need to manually update the messages from the record
                    var displayMessages = (this.enableCategory) ? {} : [];
                    
                    Ext.each(this.store, function(store) {
                        this.formatStoreMessage(store, displayMessages);
                    }, this);
                    this.initMessagePos();
                    this.updateMessages(displayMessages);
                }
            }
        }

        if(this.rendered) {
            // Start the animateInterval call - this just resumes the scroller
            this.log("Ticker " + this.id + " : start - rendered. Animate interval " + 
                     this.task.interval + ". Resume: " + resume);
            Ext.TaskManager.start(this.task);
            this.status = 'play';
        }
    },

    onDestroy : function() {
        if(this.task) {
            Ext.TaskManager.stop(this.task);
        }
        this.callParent(arguments);
    },

    /***
     * @private
     * Internal scrolling functions picked by internal TaskManager 
     * depending on message, direction and orientation setup
     */
    scroll : {
        horz : function() {
            if(!this.contentEl)
                return;
            var contentEl = this.contentEl;
            var left = contentEl.getLeft(true);
            //console.log('horz ' + left);
            if(this.direction == 'left') {
                if(left <= -this.tickerTextWidth) {
                    // Finished scrolling the ticker messages, check for new messages
                    this.checkNewMsg = true;
                    left = this.getSize().width;
                } else {
                    left -= this.speed;
                }
            } else {
                // Based on the constraint of its own visible size
                if(left >= this.getBox().width) {
                    left = -this.tickerTextWidth;
                } else {
                    left += this.speed;
                }
            }
            contentEl.setLeft(left);

            if (this.interruptUpdate || this.checkNewMsg) {
                // This is the wrap over. If set for reload, then stop the ticking task
                if(this.newMessages) {
                    this.log('horz - update new messages');
                    this.setMessages(this.newMessages);
                    this.newMessages = null;
                    this.checkNewMsg = false;
                    this.interruptUpdate && contentEl.setLeft((this.direction == 'left') ? width : -width);
                }
            }
        },

        vert : function() {
            var contentEl = this.contentEl;
            var top = contentEl.getTop(true);
            //console.log("top: " + top + ", tickerTextWidth: " + this.tickerTextWidth + ", ownerSize " + this.ownerSize.height);
            // '^' is the message moving direction
            //     ^
            //     ^
            //     ^
            //     ^ <--- this is top coordinate
            if(this.direction == 'up') {
                // Get the current ticker top position
                // If going 'up' hits the top end of the container
                // then move the message right back down to the container
                // including the size of the whole message content
                if (this.textRotation == -90) {
                    if(top <= 0) {
                        top = (this.tickerTextWidth + this.ownerSize.height);
                    } else {
                        top -= this.speed;
                    }
                } else {
                    if (top <= -(this.tickerTextWidth)) {
                        // Start from the bottom
                        top = this.ownerSize.height;
                    } else {
                        top -= this.speed;
                    }
                }
            } else {
                // If going 'down' and the 'end' of the ticker message 
                // i.e. the end of the message width hits the bottom end
                // of the container, reset back to the 'top' position
                if (this.textRotation == -90) {
                    if(top >= (this.tickerTextWidth + this.ownerSize.height)) {
                        top = 0;
                    } else {
                        top += this.speed;
                    }
                } else {
                    if(top >= this.ownerSize.height) {
                        top = -(this.tickerTextWidth + this.ownerSize.height);
                    } else {
                        top += this.speed;
                    }
                }
            }
            contentEl.setTop(top);
        }

    }
});

