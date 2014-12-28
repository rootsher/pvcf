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

    var index = new ViewDefinition('/test/templates/index.html', ['/test/modules/index.js'], true);
    var _notFound = new ViewDefinition('/test/templates/notFound.html', ['/test/modules/notFound.js'], true);

    // # Events #

    var addEvent = new ViewDefinition('/test/templates/addEvent.html', ['/test/modules/addEvent.js'], true);
    var showEvent = new ViewDefinition('/test/templates/showEvent.html', ['/test/modules/showEvent.js'], true);
    var editEvent = new ViewDefinition('/test/templates/editEvent.html', ['/test/modules/editEvent.js'], true);




    // ### Pattern handling ###

    // Here is pattern handling. It is manage via pattern manager. Here we create pattern tree.
    // When user show site /event/add should looks related view template.
    // Yes, here we define pattern definition, where we passed pattern and view reference.

    var patternManager = new PatternManager();

    patternManager.addPattern(new PatternDefinition('index', index));

    // # Events #

    patternManager.addPattern(new PatternDefinition('event/add', addEvent));
    patternManager.addPattern(new PatternDefinition('event/show/:id', showEvent));
    patternManager.addPattern(new PatternDefinition('event/show/:edit_id/edit', editEvent));


    // # Tab manager #

    // Tab manager is main managing in system. Is used for manage tabs.

    var tabManager = new TabManager();

    // Set start view.
    var startView = index;


    // This function is run when application started and when hash is change.
    function main() {
        var hash = window.location.hash.slice(1);
        var patternData, view;

        var params = {};

        if (hash) {
            patternData = patternManager.recognizeHash(hash);

            if (patternData) {
                view = patternData.view;
            } else {
                // Run not found page error.
                view = _notFound;
            }
        } else {
            view = startView;
        }

        if (patternData) {
            params = patternData.params;
        }

        startTab.openView(view, params);
        tabManager.getContainerElement().appendChild(startTab.getContainerElement());
    }


    // Actions running when document is ready, and DOM content loaded:

    var startTab = tabManager.openTab();

    main();


    // Tab list container element is create dynamically. Here we can create style for it and appends to document.
    // Currently, only appends to mainContent element.
    document.querySelector('.mainContent').appendChild(tabManager.getContainerElement());


    // Actions running when hash is change:

    window.addEventListener('hashchange', main);
});