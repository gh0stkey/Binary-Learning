(function($) {
    window.SCROLL = window.SCROLL || {};

    SCROLL.initPageTree = function() {

        var queryString = window.location.search.slice(1);
        var pageId;

        if (queryString) {
            var param = queryString.split('=');
            if (param.length === 2 && param[0] === 'pageId') {
                pageId = param[1];
            }
        }

        $('a.ht-nav-page-link').each(function() {
            if ($(this).attr('data-destpageid') === pageId) {
                $(this).addClass('current');
            }
        });

        $('a.ht-nav-page-link.current').parents('li').addClass('active open').removeClass('collapsed');

        $('ul.ht-pages-nav-top').on('click', '.sp-toggle', function() {
            var li = $(this).parent('li');
            if (li.is('.collapsed')) {
                li.removeClass('collapsed')
                    .addClass('open');
            } else if (li.is('.open')) {
                li.removeClass('open')
                    .addClass('collapsed');
            } else {
                // we don't have children -> no-op
            }
        });
    };

    if (window.SCROLL && window.SCROLL.initPageTree) {
        $(document).ready(window.SCROLL.initPageTree);
    }
}($));



