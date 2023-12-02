(function($) {
    /*
     *
     * K15t Help Theme
     * Main Javascript
     *
     */

    // This object holds all i18n messages used in the Scroll WebHelp Theme. See https://github.com/musterknabe/translate.js
    // The first level members correspond to locale keys as used in Java, for example 'en', 'en_US' and so on.
    // The country specific locales override the generic ones, and fallbacks to the generic messages are implemented.
    // Example: If this object contained entries for 'en', 'en_US' and 'de' the following would happen:
    // - 'en_US' documents would use the 'en_US' messages
    // - 'en_GB' documents would use the 'en' messages
    // - documents from all 'de' variations such as 'de_DE' would fall back to 'de' messages
    // - all other documents would use 'en' because that's the global default
    var allI18nMessages = {
        en: {
            searchInputPlaceholder: 'Search',
            searchLabel: 'Search for: {query}',
            searchResultsTitle: {
                0: 'Search for <em>{query}</em> returned no results.',
                1: 'Search for <em>{query}</em> returned one result.',
                n: 'Search for <em>{query}</em> returned {n} results.'
            }
        },
        de: {
            searchInputPlaceholder: 'Suche',
            searchLabel: 'Suche nach: {query}',
            searchResultsTitle: {
                0: 'Suche nach <em>{query}</em> ergab keine Treffer.',
                1: 'Suche nach <em>{query}</em> ergab einen Treffer.',
                n: 'Suche nach <em>{query}</em> ergab {n} Treffer.'
            }
        },
        fr: {
            searchInputPlaceholder: 'recherche',
            searchLabel: 'Recherchez: {query}',
            searchResultsTitle: {
                0: 'Recherchez <em>{query}</em> aucun résultat trouvé.',
                1: 'Recherchez <em>{query}</em> un résultat trouvé.',
                n: 'Recherchez <em>{query}</em> {n} résultats trouvés.'
            }
        }
    };

    window.SCROLL_WEBHELP = window.SCROLL_WEBHELP || {};

    window.SCROLL_WEBHELP.escapeHtml = function(text) {
        return $('<div />').text(text).html()
    };

    var searchURL = 'search.json';
    var viewport = 'desktop';
    var svdropdown = false;
    //var pageId;

    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0; // At least Safari 3+: "[object HTMLElementConstructor]"

    $(document).ready(function() {
        initI18n();

        //pageId = $('body').attr('pageid');
        /* Set Type of Device */
        checkDevice();

        /* init Sidebar Functions */
        initDragbar();
        initSidebar();
        checkGrid();

        /* init Search Functions */
        initSearch();
        initButtons();
        initFooter();

        /* init Keyboard */
        initKeyboard();

        $('.sp-picker').change(function () {
            $(this).closest('form').trigger('submit');
        });

        $('#ht-error-search-button').bind('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            openSearch();
        });

        /* handle links to anchors correctly with the headerbar */
        scrollToPosition();

        //setTimeout(function() {$('#ht-loader').hide();}, 500);
        $('#ht-loader').hide();
    });

    function initI18n() {
        var currentMessages = allI18nMessages.en; // Default language is English

        var localeSegments = ($('meta[name=scroll-content-language-key]').attr('content') || '').split('_');
        while (localeSegments.length > 0) {
            var locale = localeSegments.join('_');
            if (allI18nMessages[locale]) {
                currentMessages = allI18nMessages[locale];
                break;
            } else {
                localeSegments.pop();
            }
        }

        window.SCROLL_WEBHELP.i18n = libTranslate.getTranslationFunction(currentMessages);
    }

    /*======================================
     =            Resize Sidebar            =
     ======================================*/

    function initDragbar() {
        setDragbar(parseInt(getCookie('sidebar-width')));

        $('#ht-sidebar-dragbar').mousedown(function (e) {
            e.preventDefault();
            $(document).mousemove(function (e) {
                var mousex = e.pageX + 2;

                if (mousex < 190 || mousex > $(window).innerWidth() - 455)return;

                if (mousex < 220)$('#ht-sidebar').addClass('small');
                else $('#ht-sidebar').removeClass('small');


                setDragbar(mousex);
                setCookie('sidebar-width', mousex);

                checkGrid();
            });

            // Disable mouse events for navigation bar iframe
            $('#ht-nav').css('pointer-events', 'none');

            $(document).mouseup(function (e) {
                $(document).unbind('mousemove');
                // Re-enable mouse events for navigation bar iframe
                $('#ht-nav').css('pointer-events', 'auto');
            });
        });

        setScrollVersionSelect();
    }

    function setDragbar(val) {
        if (viewport != 'desktop')return;

        if (val == NaN)val = 295;

        $('#ht-sidebar').width(val);
        if (val < 220)$('#ht-sidebar').addClass('small');

        $('#ht-wrap-container').css("left", val + 10);
        $('#ht-headerbar').css('left', val);
    }

    function endDragbar() {
        if ($('#ht-sidebar').attr('style') == '')return;
        $('#ht-sidebar').attr('style', '');
        $('#ht-wrap-container').attr('style', '');
    }

    function setScrollVersionSelect(visible) {
        $.each($('.ht-scroll-versions-select select'), function (index, val) {
            setDropdown($(this));
        });
    }


    /*=========================================
     =            Toggle Sidebarnav            =
     =========================================*/

    function initSidebar() {
        $('#ht-menu-toggle').bind('click', function (e) {
            e.preventDefault();
            setTimeout(toggleSidebar(), 0.05);
        });
    }

    var tmpscroll;

    var sidebarExpanded = false;

    function toggleSidebar() {
        if ($('html').hasClass('show-sidebar')) {
            $('.ht-content').css('margin-top', 'auto');
            $('html').removeClass('show-sidebar');
            sidebarExpanded = false;
            $('body').scrollTop(tmpscroll);
            $('#ht-wrap-container, #ht-wrap-container *').unbind('click', toggleSidebar);

            if (viewport == 'mobile' && isSafari) {
                $('body,html').scrollTop(0);
                setTimeout(function () {
                    $('body,html').scrollTop(tmpscroll);
                }, 500);
            }

        } else {
            tmpscroll = $('body').scrollTop();
            $('html').addClass('show-sidebar');
            sidebarExpanded = true;
            $('.ht-content').css('margin-top', '-' + tmpscroll + 'px');
            $('#ht-wrap-container, #ht-wrap-container *').bind('click', toggleSidebar);
        }
    }

    /*=========================================
     =               Headerbar                =
     =========================================*/

    function scrollToPosition() {
        var duration = 100;
        var additionalOffset = 10;

        if (window.location.hash) {
            // Net to put it at the end of the event loop for making it work in IE :-(
            setTimeout(function() {
                $(window).scrollTo(
                    document.getElementById(window.location.hash.substr(1)),
                    {
                        offset: -($('#ht-headerbar').height() + additionalOffset),
                        duration: duration,
                        interrupt: true,
                        axis: 'y'
                    }
                );
            }, 0);
        }

        $('.ht-content').on('click', 'a[href^="#"]:not(.tabs-menu *)', function(e) {
            e.preventDefault();
            var element = document.getElementById(this.hash.substr(1));
            if (!element) {
                // look for element with encoded ID - hash is provided different in Firefox
                element = document.getElementById(decodeURI(this.hash.substr(1)));
            }
            $(window).stop(true).scrollTo(
                element,
                {
                    offset: -($('#ht-headerbar').height() + additionalOffset),
                    duration: duration,
                    interrupt: true,
                    axis: 'y'
                }
            );

            // PushState is not supported for local files (file:///...)
            // See https://bugs.chromium.org/p/chromium/issues/detail?id=301210
            if (history && location.protocol.substr(0,4) != 'file') {
                history.pushState({}, '', $(e.target).attr('href'));
            }
            return false;
        });
    }


    /*=========================================
     =               Search                    =
     =========================================*/

    function initSearch() {
        $('input.search-input').attr('placeholder', SCROLL_WEBHELP.i18n('searchInputPlaceholder'));

        var debounce = function(func, wait) {
            var timeout;
            var result;
            return function() {
                var args = arguments;
                var context = this;
                var debounced = function() {
                    result = func.apply(context, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(debounced, wait);
                return result;
            };
        };

        var debouncedSearch = debounce(doSearch, 200);

        var input = $('#search input.search-input');
        input.on('focus', function (e) {
            searchFieldActive = true;

            input.on('blur', function (e) {
                searchFieldActive = false;
            });

            // This is needed so that the cql search works for searches < 3 characters or when hitting enter before receiving quick results
            $('input.search-input').bind('keydown', function (e) {
                if (e.key === "Enter") {
                    goToSelectedPageOrSearch();
                } else {
                    return;
                }
                e.preventDefault();
            });
        });


        input.on('input', function(e) {
            var str = input.val().trim();
            if (str.length >= 3) {
                debouncedSearch(str);
            }
            if (str.length == 0) {
                $('.ht-search-dropdown').removeClass('open');
            }
        });
    }


    function goToSelectedPageOrSearch() {
        var selected = $('.ht-search-dropdown a.hover');
        if (selected.length != 0) {
            if (selected.is('.search-key-button')) {
                navigateToSearchResultsPage($('.search-input').val().trim());
            } else {
                window.location.href = selected.attr('href');
            }
        } else {
            navigateToSearchResultsPage($('.search-input').val().trim());
        }
    }

    function openSearch() {
        $('body').bind('click', function (e) {
            if (!$(e.target).parents('#ht-search').length && $('#ht-search').hasClass('open')) {
                $('body').unbind('click');
                closeSearch();
            }
        });
        $('#ht-search').addClass('open');
        setTimeout(function () {
            $('.ht-search-clear').addClass('show');
        }, 250);
        searchFieldActive = true;
        $('.search-input')[0].focus();
    }

    function closeSearch() {
        input = $('#ht-search');
        input.find('input').val('');
        input.find('input').blur();
        input.removeClass('open');
        $('.ht-search-clear').removeClass('show');
        input.find('.ht-search-dropdown').removeClass('open');
        $(document).unbind('keydown');
    }


    function navigateToSearchResultsPage(query) {
        if (window.SCROLL_WEBHELP && window.SCROLL_WEBHELP.search) {
            window.SCROLL_WEBHELP.search.navigateToSearchPage(query);
            closeSearch();
        }
    }


    function doSearch(query) {
        var dropdown = $('.ht-search-input .ht-search-dropdown');
        var resultsList = dropdown.find('ul');

        resultsList.empty();

        var handleSearchResults = function(searchResults, query) {
            $(document).unbind('keydown');

            $.each(searchResults, function (index, searchResult) {
                resultsList.append('<li n="' + index + '" class="search-result"><a href="' + searchResult.link + '">' + SCROLL_WEBHELP.escapeHtml(searchResult.title) + '</a></li>');
            });

            var keybutton = $('<li class="search-key" n="' + searchResults.length + '"><a class="search-key-button" href="#">' + SCROLL_WEBHELP.i18n('searchLabel', {query: '<b>' + SCROLL_WEBHELP.escapeHtml(query) + '</b>'}) + '</a></li>');
            keybutton.bind('click', function(e) {
                navigateToSearchResultsPage($('.search-input').val().trim());
                e.preventDefault();
            });
            resultsList.append(keybutton);

            resultsList.children('li').each(function(index, item) {
                var li = $(item);
                li.bind('mouseover', function () {
                    resultsList.find('li a').removeClass('hover');
                    li.find('a').addClass('hover');
                });
            });

            $(document).bind('keydown', function (e) {
                switch (e.which) {
                    case 13:
                        goToSelectedPageOrSearch();
                        break;

                    case 38:
                        dropdownKeydown(-1, dropdown);
                        break;

                    case 40:
                        dropdownKeydown(1, dropdown);
                        break;

                    default:
                        return;
                }

                e.preventDefault();
            });

            dropdown.addClass('open');
        };

        if (window.SCROLL_WEBHELP && window.SCROLL_WEBHELP.search) {
            window.SCROLL_WEBHELP.search.performSearch(query, handleSearchResults);
        }
    }

    function dropdownKeydown(direction, dropdown) {
        var itemcount = dropdown.find('a').length;
        var currentitem = parseInt(dropdown.find('a.hover').parent().attr('n'));
        if (isNaN(currentitem))currentitem = -1;

        var nextitem = currentitem + direction;
        var dropdownHeight = dropdown.height() - 2;

        var itemheight = parseInt(dropdown.find('a.hover').outerHeight());

        if (nextitem < 0 || nextitem >= itemcount)return;

        $.each(dropdown.find('a'), function (index, val) {
            if (index == currentitem)$(this).removeClass('hover');
            if (index == nextitem) {
                $(this).addClass('hover');

                if ((itemheight * (index + 1)) - dropdown.scrollTop() > dropdownHeight) {
                    dropdown.scrollTop((itemheight * (index + 1)) - dropdownHeight);
                } else if ((itemheight * (index + 1)) - dropdown.scrollTop() < itemheight && dropdown.scrollTop() > 0) {
                    dropdown.scrollTop(itemheight * index);
                }
            }
        });
    }


    function initButtons() {

        $('#ht-search-button').bind('click', function (e) {
            e.preventDefault();
            openSearch();
        });

        $('.ht-search-clear').bind('click', function (e) {
            e.preventDefault();
            closeSearch();
        });
    }


    /*================================
     =            Dropdown            =
     ================================*/

    function setDropdown(select) {
        var container = select.parent();
        var svg = '<svg width="10px" height="10px" viewBox="0 0 10 10" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g class="ht-select-button-icon"><path d="M2,3 L8,3 L5,7 L2,3 Z"></path></g></svg>';
        var toggle = $('<a class="ht-select-button"><span></span></a>');
        toggle.find('span').text(select.find('option:selected').text());
        toggle.append(svg);
        container.append(toggle);

        var label = container.parent().find('label').remove();
        toggle.prepend(label);

        var dropdown = $('<div class="ht-dropdown ht-dropdown-select"><ul></ul></div>');
        container.append(dropdown);

        var allAccessible = allEntriesAccessible(select);
        $.each(select.find('option'), function(index, val) {
            var li = $('<li/>');
            li.attr('n', index);
            var a = $('<a/>');
            a.attr('data-scroll-integration-name', select.attr('name'));
            a.attr('data-scroll-integration-title', $(this).text());
            a.attr('data-scroll-integration-value', $(this).attr('value'));
            a.text($(this).text());
            li.append(a);
            if (!allAccessible) {
                li.append(versionAccessibilitySpan($(this)));
            }
            dropdown.find('ul').append(li);
        });

        select.on('change', function () {
            var val = select.val();
            toggle.find('span').text(select.find('option:selected').text());
        });

        toggle.bind('click', function (e) {
            e.preventDefault();
            e.stopPropagation();


            if ($(this).hasClass('active')) {
                toggleDropdown(container, false);
                $(this).removeClass('active');
            } else {
                $.each($('.' + container.attr('class')), function (index, val) {
                    if ($(this).find('.ht-select-button').hasClass('active')) {
                        toggleDropdown($(this), false);
                    }
                });

                toggleDropdown(container, true);
                $(this).addClass('active');
            }

            return false;
        });
    }

    /** Check if all of the entries in the given select are runtime accessible (currently relevant for versions and variants). */
    function allEntriesAccessible(select) {
        var allAccessible = true;
        if (select.attr('name') === 'scroll-versions:version-name' || select.attr('name') === 'scroll-versions:variant-name') {
            $.each(select.find('option'), function () {
                allAccessible &= ($(this).attr('data-version-accessible') === 'true');
            });
        }
        return allAccessible;
    }

    /** Returns a span containing Authors only if the option i.e. version/variant is only visible to authors. */
    function versionAccessibilitySpan(option) {
        var versionAccessible = option.attr('data-version-accessible');
        if (versionAccessible) {
            var span = $('<span/>');
            if (versionAccessible === 'true') {
                span.css('visibility', 'hidden');
            }
            span.addClass('versions-select-item-restriction');
            span.text('Authors only');
            return span;
        }
    }

    function toggleDropdown(container, open) {
        if (open) {
            $('body').bind('click', function (e) {
                e.preventDefault();
                if ($(e.target).is(container.find('*')))return;
                toggleDropdown(container, !open);
            });

        } else {
            $('body').unbind('click');
        }

        var toggle = container.find('.ht-select-button');
        var dropdown = container.find('.ht-dropdown');
        var togglePosition = toggle.position();
        togglePosition.top += toggle.height() + $(document).scrollTop();
        dropdown.offset(togglePosition);

        if (open) {
            toggle.addClass('active');
            dropdown.addClass('open');

            $.each(dropdown.find('li'), function (index, val) {
                $(this).bind('click', function (e) {
                    e.preventDefault();

                    var name = $(e.target).closest('li').children('a').attr('data-scroll-integration-name');
                    var value = $(e.target).closest('li').children('a').attr('data-scroll-integration-value');
                    var title = $(e.target).closest('li').children('a').attr('data-scroll-integration-title');

                    toggle.find('span').text(title);

                    var isSearch = $('meta[name=isSearch]').attr('content') === 'true';

                    var target;
                    if (isSearch){
                        target = updateQueryStringParameter(window.location.href, name, value);
                        getSearchQueryParametersForContext(name, value).forEach(function(param) {
                            target = updateQueryStringParameter(target, param.key, param.value);
                        });
                    } else {
                        target = window.location.pathname + '?' + encodeURI(name + '=' + value);
                    }
                    var context = toggle.closest('form').find('input[name=context]').val();
                    if (context) {
                        target += '&context=' + context;
                    }

                    window.location.href = target;
                });
            });
        } else {
            toggle.removeClass('active');
            dropdown.removeClass('open');
        }
    }


    // taken from https://stackoverflow.com/questions/5999118/how-can-i-add-or-update-a-query-string-parameter
    function updateQueryStringParameter(uri, key, value) {
        var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
        var separator = uri.indexOf('?') !== -1 ? "&" : "?";
        if (uri.match(re)) {
            return uri.replace(re, '$1' + key + "=" + encodeURIComponent(value) + '$2');
        } else {
            return uri + separator + key + "=" + encodeURIComponent(value);
        }
    }


    function getSearchQueryParametersForContext(name, value) {
        if (window.SCROLL_WEBHELP && window.SCROLL_WEBHELP.search) {
            return window.SCROLL_WEBHELP.search.getSearchQueryParametersForContext(name, value);
        } else {
            return [];
        }
    }

    /*===================================
     =            Init Footer            =
     ===================================*/
    function initFooter() {
        checkFooter();

        $('#ht-jump-top').bind('click', function (e) {
            e.preventDefault();
            $('body,html').animate({
                    scrollTop: 0},
                100);
        });
    }

    function checkFooter() {
        if ($('article.ht-content').outerHeight() < $(window).innerHeight()) {
            $('#ht-jump-top').fadeOut();
        } else {
            $('#ht-jump-top').fadeIn();
        }
    }


    /*=============================================
     =            Media Query Detection            =
     =============================================*/
    function checkDevice() {
        var i = parseInt($('#ht-mq-detect').css('width').replace('px', ''));

        switch (i) {
            case 1:
                viewport = 'mobile';
                break;

            case 2:
                viewport = 'tablet';
                break;

            case 3:
                viewport = 'tablet';
                break;

            case 4:
                viewport = 'desktop';
                break;

            case 5:
                viewport = 'desktop';
                break;
        }

        if (viewport != 'desktop')endDragbar();
        else {
            setDragbar(parseInt(getCookie('sidebar-width')));
            $('html').removeClass('show-sidebar');
        }
    }


    /*=====================================
     =            Window Resize            =
     =====================================*/
    var rtime = new Date(1, 1, 2000, 12, 00, 00);
    var timeout = false;
    var delta = 200;
    $(window).resize(function () {
        rtime = new Date();
        if (timeout === false) {
            timeout = true;
            setTimeout(resizeend, delta);
        }
    });

    function resizeend() {
        if (new Date() - rtime < delta) {
            setTimeout(resizeend, delta);
        } else {
            timeout = false;
            checkFooter();
            checkDevice();
            checkGrid();
        }
    }


    /*=====================================
     =             Keyboard              =
     =====================================*/
    var searchFieldActive;
    var lastKey;
    var activeElement;

    function initKeyboard() {
        searchFieldActive = false;

        $('body').bind('keyup', function (e) {
            activeElement = document.activeElement;

            if ((searchFieldActive && e.which != 27)
                || (activeElement && (activeElement.type === 'text' || activeElement.type === 'textarea'))) {
                return;
            }

            switch (e.which) {
                case 219: // [
                    if (viewport !== 'desktop') {
                        toggleSidebar();
                    }
                    break;

                case 191: // /
                    if (!sidebarExpanded) {
                        openSearch();
                    }
                    break;

                case 71: // g
                    if (lastKey == 71) {
                        if (!sidebarExpanded) {
                            openSearch();
                        }
                    }
                    break;

                case 27: // esc
                    closeSearch();
                    break;
            }

            lastKey = e.which;
        });
    }


    /*=====================================
     =              Cookies               =
     =====================================*/

    function setCookie(cname, cvalue) {
        if (window.location.origin == 'file://') {
            try {
                localStorage.setItem(cname, cvalue);
            } catch (e) {
                console.log('Saving the state of the drag-bar is not supported because localStorage is not available');
            }
        } else {
            var d = new Date();
            d.setTime(d.getTime() + (24 * 60 * 60 * 1000));
            var expires = "expires=" + d.toUTCString();
            document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/";
        }
    }

    function getCookie(cname) {
        if (window.location.origin == 'file://') {
            try {
                var value = localStorage.getItem(cname);
                if (typeof value != 'undefined') {
                    return value;
                }
            } catch (e) {
                console.log('Saving the state of the drag-bar is not supported because localStorage is not available');
            }
        } else {
            var name = cname + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1);
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
        }

        return "";
    }

    /*=====================================
     =               GRID                 =
     =====================================*/

    function checkGrid() {
        if ($('#ht-wrap-container').width() > 1024) {
            $('#ht-wrap-container').addClass('sp-grid-float');
            $('#ht-wrap-container').removeClass('sp-grid-fluid');
        } else {
            $('#ht-wrap-container').addClass('sp-grid-fluid');
            $('#ht-wrap-container').removeClass('sp-grid-float');
        }
    }

})($);
