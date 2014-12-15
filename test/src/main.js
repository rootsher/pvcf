requirejs.config({
    baseUrl: '/test/vendor/when/',
    paths: {
        pvcf: '/lib/pvcf',
        when: '/test/vendor/when/when',
        node: '/test/vendor/when/node',
        callbacks: '/test/vendor/when/callbacks'
    }
});

requirejs(['pvcf'], function run(pvcf) {
    var definitions = pvcf.definitions;

    var ViewDefinition = definitions.ViewDefinition;
    var PatternDefinition = definitions.PatternDefinition;

    var PatternManager = pvcf.PatternManager;
    var TabManager = pvcf.TabManager;



    // ### View definitions ###

    // Here define views, template to load and script list to include. Maybe later I add loading CSS files.
    // Additional option in view definition is it whether view can be load more than once.

    // # Events #

    var addEvent = new ViewDefinition('/test/templates/addEvent.html', ['/test/modules/addEvent.js'], true, ['/test/css/addEvent.css']);
    var showEvent = new ViewDefinition('/test/templates/showEvent.html', ['/test/modules/showEvent.js'], true, ['/test/css/showEvent.css']);




    // ### Pattern handling ###

    // Here is pattern handling. It is manage via pattern manager. Here we create pattern tree.
    // When user show site /event/add should looks related view template.
    // Yes, here we define pattern definition, where we passed pattern and view reference.

    var patternManager = new PatternManager();

    // # Events #

    patternManager.addPattern(new PatternDefinition('event/add', addEvent));
    patternManager.addPattern(new PatternDefinition('event/show/:id', showEvent));




    // # Tab manager #

    // Tab manager is main managing in system. Is used for manage tabs.

    var tabManager = new TabManager();






    // This function is run when application started and when hash is change.
    function main() {
        console.log('Appliaction started!');
    }





    // Actions running when document is ready, and DOM content loaded:

    var startTab = tabManager.openTab();

    startTab.openView(addEvent).done(function () {
        /*startTab.openView(showEvent).done(function () {
            //startTab.closeView();
        });*/
    });

    //tabManager.closeTab(startTab);

    tabManager.getContainerElement().appendChild(startTab.getContainerElement());

    main();



    // Tab list container element is create dynamically. Here we can create style for it and appends to document.
    // Currently, only appends to document.
    document.body.appendChild(tabManager.getContainerElement());





    // Actions running when hash is change:

    window.addEventListener('hashchange', main);
});