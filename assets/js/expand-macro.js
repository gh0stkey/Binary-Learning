$('.scroll-expand-container').on('click', '.scroll-expand-control', function(ev) {
    $(ev.delegateTarget).toggleClass('collapsed');
});