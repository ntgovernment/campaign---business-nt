/**
 * Global variables
 */
var body = document.querySelector('body');
var wrapper = document.getElementById('wrapper');
var searchField = document.querySelector('.search-global .search-global__field--form');
var searchInput = document.querySelector('.search-global input');
var searchButton = document.querySelector('.ntg-main-nav__search');
var closeButton = document.querySelector('.search-global__close');

/**
 * Event handlers
 */
document.addEventListener('DOMContentLoaded', function () {
    console.log("hello")
    body.classList.add('search-panel--is-hidden');
    searchInput.addEventListener("focus", addFocusClass);
    searchInput.addEventListener("blur", removeFocusClass);
    searchButton.addEventListener("click", openSearchOverlay);
    closeButton.addEventListener("click", closeSearchOverlay);
    document.addEventListener('keyup', checkKeyboardInput);
});

/**
 * Add focus class to the global search input
 */
function addFocusClass() {
    searchField.classList.add('focused');
}

/**
 * Remove focus class from the global search input
 */
function removeFocusClass() {
    if (searchField.querySelector('input').value == '') {
        searchField.classList.remove('focused');
    }
}

/**
 * Append search overlay to the DOM, fade in the search overlay and focus the search input
 *
 * @param {object} event - .ntg-main-nav__search event handler
 */
function openSearchOverlay(event) {
    event.preventDefault();

    var overlay = document.querySelector('.search-panel-overlay');
    if (overlay === null) {
        overlay = document.createElement('div');
        overlay.classList.add('search-panel-overlay');
        wrapper.appendChild(overlay);
        overlay.style.display = 'none';
    }

    fadeIn(overlay);

    body.classList.add('search-panel--is-visible', 'overflow-hidden');
    body.classList.remove('search-panel--is-hidden');

    setTimeout(function () {
        searchInput.focus();
    }, 250);
}

/**
 * Fade out the search overlay and remove it from the DOM
 */
function closeSearchOverlay() {
    var overlay = document.querySelector('.search-panel-overlay');

    body.classList.add('search-panel--is-hidden');
    body.classList.remove('search-panel--is-visible', 'overflow-hidden');

    fadeOut(overlay);

    searchButton.focus();
}

/**
 * Close the search overlay if the escape key has been pressed while the search overlay is visible
 *
 * @param {object} event - document event handler
 */
function checkKeyboardInput(event) {
    if (event.keyCode == 27 && body.classList.contains("search-panel--is-visible")) {
        closeSearchOverlay();
    }
}