(function(jQuery) {
    'use strict';

    window.SCROLL_WEBHELP.search = window.SCROLL_WEBHELP.search || {};


    var workerIsActive = false;
    var worker;
    var idx;

    var queryCallbacks = {};

    jQuery('form#search').on('submit', function() {
        return false;
    });

    window.SCROLL_WEBHELP.search.performSearch = function(query, onResultsAvailableCallback) {
        search(query, onResultsAvailableCallback);
    };


    var search = function(query, onResultsAvailableCallback) {
        if (typeof idx !== 'undefined'){
            onResultsAvailableCallback(searchInMainThread(query), query);
        } else if(workerIsActive) {
            searchWithWorker(query, onResultsAvailableCallback);
        }
    };


    var searchInMainThread = function(query) {
        var results = idx.search(query).map(function(result) {
            return lunrData.filter(function (d) {
                return d.id === parseInt(result.ref, 10)
            })[0];
        });

        return results;
    };


    var searchWithWorker = function(query, callback) {
        var queryId = new Date().getTime();
        queryCallbacks[queryId] = callback;
        worker.postMessage({type: 'search-request', query: query, queryId: queryId});
    };


    window.SCROLL_WEBHELP.search.navigateToSearchPage = function(query) {
        var locationOrigin = window.location.protocol + "//" + window.location.hostname +
            (window.location.port ? ':' + window.location.port : '');
        var pageLocation = locationOrigin + window.location.pathname;
        var url = pageLocation.substr(0, pageLocation.lastIndexOf('/') + 1);
        var searchPageUrl = url + 'search.html?query=' + query;
        window.location.assign(searchPageUrl);
    };


    var displaySearchResultsPage = function(searchResults, query) {
        var container = jQuery('#html-search-results');

        container.find('.ht-content-header h1').html(SCROLL_WEBHELP.i18n('searchResultsTitle', searchResults.length, { query: escapeHtml(query) }));

        var list = jQuery("#search-results");
        list.empty();

        var baseUrl = window.location.href.substr(0, window.location.href.lastIndexOf('/') + 1);

        jQuery.each(searchResults, function(index, searchResult) {
            var displayUrl = baseUrl + searchResult.link;
            list.append('<section class="search-result">'
                +'<header><h2><a href="' + searchResult.link + '">' + SCROLL_WEBHELP.escapeHtml(searchResult.title) + '</a></h2></header>'
                +'<div class="search-result-content"><p class="search-result-link">' + displayUrl + '</p></div>'
                +'<hr>'
                +'</section>');
        });
        container.show();
    };


    var searchSetup = function() {
        var locationOrigin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
        var pageLocation = locationOrigin + window.location.pathname;
        var url = pageLocation.substr(0, pageLocation.lastIndexOf('/') + 1);

        var onIndexLoaded = function() {
            jQuery('.ht-search-index-loader').fadeOut(300, function() {
                jQuery('.ht-search-input').fadeIn();
            });
        };

        try {
            // Creates the Web Worker, to overcome the Same-Origin policy the URL is passed to the worker.
            var blob = new Blob([document.querySelector('#worker').textContent]);
            worker = new Worker(window.URL.createObjectURL(blob));

            worker.onmessage = function (event) {
                var message = event.data;

                if (message.type === 'setup-complete') {
                    onIndexLoaded();
                    workerIsActive = true;

                    var query = getUrlParameter('query');
                    if (query && message.isSearchPage === true) {
                        search(query, displaySearchResultsPage);
                    }
                }

                if (message.type === 'search-results') {
                    var callback = queryCallbacks[message.queryId];
                    if (callback) {
                        delete queryCallbacks[message.queryId];
                        callback(message.results, message.query);
                    }
                }
            };

            // what the worker does in case of an error
            worker.onerror = function(error) {
                error.preventDefault();
                throw(error);
            };

            // send page url to the worker, for script loading
            worker.postMessage({type: "setup", baseUrl: url});

        } catch (error) {
            setTimeout(function () {
                if(!workerIsActive){
                    jQuery.ajax({
                        url:'js/lunr-data.js',
                        cache:true,
                        crossDomain: true,
                        dataType: 'script'
                    });

                    jQuery.ajax({
                        url:'js/lunr-index.js',
                        cache:true,
                        crossDomain: true,
                        dataType:'script'
                    }).done(function() {
                            idx = lunr.Index.load(lunrIndex);
                            idx.pipeline.remove(lunr.stopWordFilter);
                            onIndexLoaded();
                        }
                    );
                }
            }, 3000);
        }
    };


    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };


    function escapeHtml(string) {
        return String(string).replace(/[&<>"'\/]/g, function (s) {
            return entityMap[s];
        });
    }

    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    };

    jQuery(document).ready(function () {
        searchSetup();
    });

})($);