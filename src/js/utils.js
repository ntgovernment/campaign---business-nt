/**
 * Fades out an element
 *
 * @param {object} el - element that's being faded out
 */
function fadeOut(el) {
    el.style.opacity = 1;
    (function fade() {
        if ((el.style.opacity -= 0.1) <= 0) {
            el.style.display = 'none';
        } else {
            requestAnimationFrame(fade);
        }
    })();
}

/**
 * Fades in an element with an optional display setting
 *
 * @param {object} el - element that's being faded in
 * @param {string} display - display type
 */
function fadeIn(el, display) {
    el.style.opacity = 0;
    el.style.display = display || 'block';
    (function fade() {
        var val = parseFloat(el.style.opacity);
        if (!((val += 0.1) > 1)) {
            el.style.opacity = val;
            requestAnimationFrame(fade);
        }
    })();
}
