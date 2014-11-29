define('pvcf', ['when', 'node', 'callbacks'], function pvcf(when, nodefn, callbacks) {
    var util = {};

    util.ajax = {
        /**
         *
         * @param {string} method
         * @param {string} url
         * @param {Object} data
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
     */
    function ViewDefinition(templatePath, scriptPaths, multiple) {
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

        this._destructionPromise = when.all(this._cleanupHandlers.map(function (handler) {
            self._currentStage = 'destroying';

            return when.try(handler).then(function () {
                self._currentStage = 'destroyed';
            });
        }));

        return this._destructionPromise;
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

        return this.closeView().then(function () {
            self._currentView = view;

            return view.initialize(viewDefinition);
        }).then(function () {
            self.getContainerElement().appendChild(view.getContainerElement());
        });
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

        if (view) {
            destroyPromise = view.destroy().then(function () {
                self.getContainerElement().removeChild(view.getContainerElement());
            });
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
     */
    TabManager.prototype.getCurrentTab = function getCurrentTab() {
        return this._currentTab;
    };

    /**
     * 
     * @method
     */
    TabManager.prototype.getContainerElement = function getContainerElement() {
        return this._containerElement;
    };

    /**
     * 
     * @method
     * @param {Tab} tab
     */
    TabManager.prototype.closeTab = function closeTab(tab) {
        var self = this;
        var tabIndex = this._tabList.indexOf(tab);

        if (tabIndex < 0) {
            throw new Error();
        }

        //TODO: Add append tab to container for tab manager.
        return tab.closeView().then(function () {
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

    return {
        definitions: {
            ViewDefinition: ViewDefinition,
            PatternDefinition: PatternDefinition
        },
        TabManager: TabManager,
        PatternManager: PatternManager
    };
});