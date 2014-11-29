requirejs.config({
    baseUrl: 'test',
    paths: {
        pvcf: '../../lib/pvcf',
        when: '../test/vendor/when/when',
        node: '../test/vendor/when/node',
        callbacks: '../test/vendor/when/callbacks'
    }
});

requirejs(['pvcf'], function run(pvcf) {
    var definitions = pvcf.definitions;
    var ViewDefinition = definitions.ViewDefinition;
    var TabManager = pvcf.TabManager;

    // ### View list. ###

    // # Events #

    var addEvent = new ViewDefinition('test/templates/addEvent.html', ['test/modules/addEvent.js'], true);


    // # Tab manager #

    var tabManager = new TabManager();
    var startTab = tabManager.openTab();

    startTab.openView(addEvent).done(function () {
        tabManager.closeTab(startTab);
    });

    tabManager.getContainerElement().appendChild(startTab.getContainerElement());

    document.body.appendChild(tabManager.getContainerElement());
});