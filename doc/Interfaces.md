# Definitions

## ViewDefinition

* @property {string} templatePath
* @property {string[]} scriptPaths
* @property {boolean} multiple

# Interfaces

## View

* properties
    * _containerElement = document.createElement();
    * _initializationPromise
    * _destructionPromise
    * _currentStage
        * none
        * initializing
        * initialized
        * destroying
        * destroyed
    * _cleanupHandlers
* methods
    * initialize
        * @param {ViewDefinition} viewDefinition
        * @returns {external:Promise}
    * getContainerElement
        * @returns {DOMElement} _containerElement
    * destroy
        * @returns {external:Promise}

## Tab

* properties
    * _containerElement = document.createElement();
    * _currentView = undefined (||View)
* methods
    * openView
        * @param {ViewDefinition} viewDefinition
        * @returns {external:Promise}
    * closeView
        * @returns {external:Promise}

## TabManager

* properties
    * _containerElement = document.createElement();
    * _currentTab
    * _tabList
* methods
    * openTab
        * @returns {Tab}
    * switchTab
    * getCurrentTab
        * @returns {Tab}
    * getContainerElement
        * @returns {DOMElement} _containerElement
    * closeTab

## Pattern

