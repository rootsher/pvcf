define('pvcf', ['when', 'node', 'callbacks'], function pvcf(when, nodefn, callbacks) {
    var util = {};

    util.ajax = {
        /**
         *
         * @param {string} method
         * @param {string} url
         * @param {Object} data
         * @returns {external:Promise}
         */
        load: function load(method, url, data) {
            var request = new XMLHttpRequest();
            var commandDeferred = when.defer();

            method = method.toUpperCase();
            data = data || {};

            request.open(method, url, true);

            request.onreadystatechange = function () {
                if (this.readyState === 4) {
                    if (this.status >= 200 && this.status < 400) {
                        commandDeferred.resolve(this.responseText);
                    } else {
                        commandDeferred.reject({
                            status: this.status,
                            body: this.responseText
                        });
                    }
                }
            };

            request.send(data);
            request = null;

            return commandDeferred.promise;
        }
    };

    /**
     * 
     * @param {string} templatePath
     * @param {string[]} scriptPaths
     * @param {boolean} multiple
     * @param {string[]} CSSPaths
     */
    function ViewDefinition(templatePath, scriptPaths, multiple, CSSPaths) {
        /**
         * 
         * @type {string}
         */
        this.templatePath = templatePath;
        /**
         * 
         * @type {string[]}
         */
        this.scriptPaths = scriptPaths;
        /**
         * 
         * @type {boolean}
         */
        this.multiple = multiple;
        /**
         * 
         * @type {string[]}
         */
        this.CSSPaths = CSSPaths;
    }

    /**
     * 
     * @param {string} pattern
     * @param {ViewDefinition} viewDefinition
     */
    function PatternDefinition(pattern, viewDefinition) {
        /**
         * 
         * @type {string}
         */
        this.pattern = pattern;
        /**
         * 
         * @type {ViewDefinition}
         */
        this.viewDefinition = viewDefinition;
    }

    /**
     * 
     * @constructor
     */
    function View() {
        /**
         * 
         * @type {DOMElement}
         */
        this._containerElement = document.createElement('div');
        /**
         * 
         * @type {external:Promise}
         */
        this._initializationPromise = undefined;
        /**
         * 
         * @type {external:Promise}
         */
        this._destructionPromise = undefined;
        /**
         * 
         * @type {string}
         */
        this._currentStage = 'none';
        /**
         * 
         * @type {Array}
         */
        this._cleanupHandlers = [];
    }

    /**
     * 
     * @method
     * @param {ViewDefinition} viewDefinition
     * @returns {external:Promise}
     */
    View.prototype.initialize = function initialize(viewDefinition) {
        var self = this;

        if (this._initializationPromise) {
            return this._initializationPromise;
        }

        this._initializationPromise = util.ajax.load('GET', viewDefinition.templatePath).then(function (templateContent) {
            self._containerElement.innerHTML = templateContent;

            self._currentStage = 'initializing';

            var promisedRequire = callbacks.call(require, viewDefinition.scriptPaths);

            return promisedRequire.then(function () {
                function addCleanupHandler(cleanupHandler) {
                    self._cleanupHandlers.push(cleanupHandler);
                }

                //TODO: Think whether is sense include CSS files.
                viewDefinition.CSSPaths.forEach(function (CSSPath) {
                    var link = document.createElement('link');
                    link.type = 'text/css';
                    link.rel = 'stylesheet';
                    link.href = CSSPath;
                    document.getElementsByTagName('head')[0].appendChild(link);
                });

                Array.prototype.forEach.call(arguments, function (module) {
                    var params = {};

                    module(self._containerElement, params, addCleanupHandler);
                });

                self._currentStage = 'initialized';
            });
        });

        return this._initializationPromise;
    };

    /**
     * 
     * @method
     * @returns {DOMElement}
     */
    View.prototype.getContainerElement = function getContainerElement() {
        return this._containerElement;
    };

    /**
     * 
     * @method
     * @returns {external:Promise}
     */
    View.prototype.destroy = function destroy() {
        var self = this;

        if (this._destructionPromise) {
            return this._destructionPromise;
        }

        var initializePromise = this._initializationPromise || when.resolve();

        this._destructionPromise = initializePromise.then(function () {
            return when.all(self._cleanupHandlers.map(function (handler) {
                self._currentStage = 'destroying';

                return when.try(handler);
            })).then(function () {
                self._currentStage = 'destroyed';
            });
        });

        return this._destructionPromise;
    };

    /**
     * 
     * @constructor
     */
    function PatternManager() {
        this._patternTree = {
            children: {}
        };
    }

    /**
     * 
     * @method
     * @param {PatternDefinition} patternDefinition
     */
    PatternManager.prototype.addPattern = function addPattern(patternDefinition) {
        var pattern = patternDefinition.pattern;
        var view = patternDefinition.viewDefinition;

        var patternPartList = pattern.split('/');

        var current = this._patternTree;
        var paramNames = [];

        function PathNode() {
            this.children = {};
        }

        patternPartList.forEach(function (part) {
            if (part[0] === ':') {
                if (!current.paramNode) {
                    current.paramNode = new PathNode();
                }

                paramNames.push(part.slice(1));
                current = current.paramNode;
            } else {
                if (!current.children[part]) {
                    current.children[part] = new PathNode();
                }

                current = current.children[part];
            }
        });

        if (current.view) {
            if (current.view !== view) {
                throw new Error('Routing path collision: ' + pattern);
            }
        } else {
            current.paramNames = paramNames;
            current.view = view;
        }
    };

    /**
     * 
     * @constructor
     */
    function Tab() {
        /**
         * 
         * @type {DOMElement}
         */
        this._containerElement = document.createElement('div');
        /**
         * 
         * @type {View}
         */
        this._currentView = undefined;
        /**
         * 
         * @type {external:Promise}
         */
        this._openViewPromise = when.resolve();
        /**
         * 
         * @type {external:Promise}
         */
        this._closeViewPromise = undefined;
        /**
         * 
         * @type {boolean}
         */
        this._isClosed = false;
    }

    /**
     * 
     * @method
     * @param {ViewDefinition} viewDefinition
     * @returns {external:Promise}
     */
    Tab.prototype.openView = function openView(viewDefinition) {
        var self = this;
        var view = new View();

        if (this._isClosed) {
            return when.resolve();
        }

        this._openViewPromise = this._openViewPromise.then(function () {
            return self.closeView();
        }).then(function () {
            if (self._isClosed) {
                return when.resolve();
            }

            self._currentView = view;

            return view.initialize(viewDefinition).then(function () {
                self.getContainerElement().appendChild(view.getContainerElement());
            });
        });

        return this._openViewPromise;
    };

    /**
     * 
     * @method
     * @returns {external:Promise}
     */
    Tab.prototype.closeView = function closeView() {
        var self = this;
        var destroyPromise;

        var view = this._currentView;

        if (this._closeViewPromise) {
            return this._closeViewPromise;
        }

        if (view) {
            this._closeViewPromise = view.destroy().then(function () {
                self.getContainerElement().removeChild(view.getContainerElement());
                self._closeViewPromise = undefined;
                self._currentView = undefined;
            });

            destroyPromise = this._closeViewPromise;
        } else {
            destroyPromise = when.resolve();
        }

        return destroyPromise;
    };

    /**
     * 
     * @method
     * @returns {DOMElement}
     */
    Tab.prototype.getContainerElement = function getContainerElement() {
        return this._containerElement;
    };

    /**
     * 
     * @method
     * @returns {external:Promise}
     */
    Tab.prototype.close = function close() {
        this._isClosed = true;

        return this.closeView();
    };

    /**
     * 
     * @constructor
     */
    function TabManager() {
        /**
         * 
         * @type {DOMElement}
         */
        this._containerElement = document.createElement('div');
        /**
         * 
         * @type {Tab}
         */
        this._currentTab = undefined;
        /**
         * 
         * @type {Tab[]}
         */
        this._tabList = [];
    }

    /**
     * 
     * @method
     * @returns {Tab}
     */
    TabManager.prototype.openTab = function openTab() {
        var tab = new Tab();

        if (this._tabList.length === 0) {
            this.switchTab(tab);
        }

        this._tabList.push(tab);

        return tab;
    };

    /**
     * 
     * @method
     * @param {Tab} tab
     */
    TabManager.prototype.switchTab = function switchTab(tab) {
        this._currentTab = tab;
    };

    /**
     * 
     * @method
     * @returns {Tab}
     */
    TabManager.prototype.getCurrentTab = function getCurrentTab() {
        return this._currentTab;
    };

    /**
     * 
     * @method
     * @returns {DOMElement}
     */
    TabManager.prototype.getContainerElement = function getContainerElement() {
        return this._containerElement;
    };

    /**
     * 
     * @method
     * @param {Tab} tab
     * @returns {external:Promise}
     */
    TabManager.prototype.closeTab = function closeTab(tab) {
        var self = this;
        var tabIndex = this._tabList.indexOf(tab);

        if (tabIndex < 0) {
            throw new Error();
        }

        return tab.close().then(function () {
            var currentTabIndex = self._tabList.indexOf(tab);

            if (currentTabIndex < 0) {
                return;
            }

            self.getContainerElement().removeChild(tab.getContainerElement());

            self._chooseCurrentTab(tabIndex);

            self._tabList.splice(tabIndex, 1);
        });
    };

    /**
     * 
     * @method
     * @param {number} previousTabIndex
     */
    TabManager.prototype._chooseCurrentTab = function _chooseCurrentTab(previousTabIndex) {
        var currentTab;

        if (this._tabList[previousTabIndex + 1]) {
            currentTab = this._tabList[previousTabIndex + 1];
        } else if (this._tabList[previousTabIndex - 1]) {
            currentTab = this._tabList[previousTabIndex - 1];
        } else {
            currentTab = undefined;
        }

        this.switchTab(currentTab);
    };

    return {
        definitions: {
            ViewDefinition: ViewDefinition,
            PatternDefinition: PatternDefinition
        },
        PatternManager: PatternManager,
        TabManager: TabManager
    };
});