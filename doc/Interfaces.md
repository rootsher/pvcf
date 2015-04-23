# Definitions

## ViewDefinition

* @property {string} templatePath
* @property {string[]} scriptPaths
* @property {boolean} multiple

## PatternDefinition

* @property {string} pattern
* @property {ViewDefinition} viewDefinition

# Interfaces

## View

* properties
    * _containerElement:private
    * _initializationPromise:private
    * _destructionPromise:private
    * _currentStage:private
    * _cleanupHandlers:private
* methods
    * initialize
        * @param {ViewDefinition} viewDefinition
        * @param {Object} params
        * @returns {external:Promise}
    * getContainerElement
        * @returns {DOMElement}
    * destroy
        * @returns {external:Promise}

## PatternManager

* properties
    * _patternTree:private
    * _routeSeparator:private
    * _paramPrefix:private
    * _queryStringInitiator:private
* methods
    * addPattern
        * @param {PatternDefinition} patternDefinition
    * resolveHash
        * @param {string} hash
        * @returns {Object|undefined}

## Tab

* properties
    * _containerElement:private
    * _currentView:private
    * _openViewPromise:private
    * _closeViewPromise:private
    * _isClosed:private
* methods
    * openView
        * @param {ViewDefinition} viewDefinition
        * @param {Object} params
        * @returns {external:Promise}
    * closeView
        * @returns {external:Promise}
    * getContainerElement
        * @returns {DOMElement}
    * close
        * @returns {external:Promise}

## TabManager

* properties
    * _containerElement:private
    * _currentTab:private
    * _tabList:private
* methods
    * setStartView
        * @param {ViewDefinition} startView
    * getStartView
        * @returns {ViewDefinition}
    * setErrorView
        * @param {ViewDefinition} errorView
    * getErrorView
        * @returns {ViewDefinition}
    * openTab
        * @returns {Tab}
    * switchTab
        * @param {Tab} tab
    * getCurrentTab
        * @returns {Tab}
    * getTabList
        * @returns {Tab[]}
    * getContainerElement
        * @returns {DOMElement}
    * closeTab
        * @param {Tab} tab
        * @returns {external:Promise}
    * _chooseCurrentTab:private
        * @param {number} previousTabIndex

## Navigation

* properties
    * _navigationEventHandlers:private
    * _currentHash:private
* methods
    * _runNavigationEventHandlers:private
        * @param {string} path
        * @param {Object} options
    * start
    * addNavigationEventHandler
        * @param {function} eventHandler
    * go
        * @param {string} path
        * @param {Object} options
    * handleNavigationEvent:static
        * @param {PatternManager} patternManager
        * @param {TabManager} tabManager
        * @param {string} path
        * @param {Object} options