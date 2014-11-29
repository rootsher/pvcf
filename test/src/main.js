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
    var PatternDefinition = definitions.PatternDefinition;

    var PatternManager = pvcf.PatternManager;
    var TabManager = pvcf.TabManager;

    // ### View list ###

    // # Events #

    var addEvent = new ViewDefinition('test/templates/addEvent.html', ['test/modules/addEvent.js'], true);
    var showEvent = new ViewDefinition('test/templates/showEvent.html', ['test/modules/showEvent.js'], true);


    // # Pattern manager #

    var patternManager = new PatternManager();

    // ### Pattern list ###

    patternManager.addPattern(new PatternDefinition('event/add', addEvent));
    patternManager.addPattern(new PatternDefinition('event/show/:id', showEvent));


    // # Tab manager #

    var tabManager = new TabManager();
    document.body.appendChild(tabManager.getContainerElement());


    function main() {
        console.log('Appliaction started!');
    }


    // window.onload actions:
    var startTab = tabManager.openTab();

    startTab.openView(addEvent).done(function () {
        tabManager.closeTab(startTab);
    });

    tabManager.getContainerElement().appendChild(startTab.getContainerElement());

    main();


    // window.hashchange actions:
    window.addEventListener('hashchange', main);
});