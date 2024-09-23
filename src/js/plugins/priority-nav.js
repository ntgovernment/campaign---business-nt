(function (window, factory) {
    if (typeof define === 'function' && define.amd) {
        define('PriorityNav', factory(window));
    } else if (typeof exports === 'object') {
        module.PriorityNav = factory(window);
    } else {
        window.PriorityNav = factory(window);
    }
})(window, function (window) {

    function PriorityNav(element, options) {
        var queryElement = document.querySelector(element);
        if (!queryElement) {
            if (console) {
                console.error('Bad element for Priority Nav: ' + (queryElement || element));
            }
            return;
        }
        this.element = queryElement;
        this.options = this.extend({}, this.constructor.defaults);
        this.option(options);

        this._initialize();
    }

    PriorityNav.defaults = {
        dropdownLabel: 'More',
        dropdownClassName: 'more',
        childrenClassName: 'has-children',
        excludedClassName: 'exclude',
        nestedElementClassName: 'tertiary',
        hiddenClassName: 'd-none',
    };

    var proto = PriorityNav.prototype;

    /**
     * Merge defaults with user options
     * @private
     * @param {Object} defaults Default settings
     * @param {Object} options User options
     * @returns {Object} Merged values of defaults and options
     */
    proto.extend = function (defaults, options) {
        for (var prop in options) {
            defaults[prop] = options[prop];
        }
        return defaults;
    };

    /**
     * Set options
     * @param {Object} opts - options to extend
     */
    proto.option = function (opts) {
        this.extend(this.options, opts);
    };

    /**
     * Remove excluded links from HTMLCollection
     * @param {Object} links - list of all links
     * @returns {Object} list of non-excluded links
     */
    proto.getNonExcludedLinks = function (links) {
        return [].slice.call(links).filter(function (e) {
            return !e.classList.contains('exclude');
        });
    };

    /**
     * Remove non-excluded links from HTMLCollection
     * @param {Object} links - list of all links
     * @returns {Object} list of excluded links
     */
    proto.getExcludedLinks = function (links) {
        return [].slice.call(links).filter(function (e) {
            return e.classList.contains('exclude');
        });
    };

    /**
     * Get width of links
     * @param {Object} links - list of links
     * @returns {Number} width of links
     */
    proto.getWidth = function (links) {
        var width = 0;
        for (var i = 0; i < links.length; i++) {
            width += links[i].offsetWidth;
        }
        return width;
    }

    proto._initialize = function () {
        this.element.classList.add('priority-nav');
        this.menu = this.element.getElementsByTagName('ul')[0];
        this.menu.parentElement.classList.add('priority-nav__menu');
        this.menu.classList.add('priority-nav__list');
        this.menu.insertAdjacentHTML(
            'beforeend',
            '<li class="' + this.options.dropdownClassName + ' ' + this.options.excludedClassName + ' ' + this.options.hiddenClassName + '">' +
            '<a href="#" class="' + this.options.childrenClassName + '">' +
            this.options.dropdownLabel +
            '</a>' +
            '<ul>' +
            this.menu.innerHTML +
            '</ul>' +
            '</li>'
        );
        this.more = document.querySelector('.' + this.options.dropdownClassName);
        this.dropdown = this.more.getElementsByTagName('ul')[0];
        this.allLinks = this.menu.querySelectorAll('li');
        this.menuLinks = this.getNonExcludedLinks(this.menu.children);
        this.dropdownLinks = this.getNonExcludedLinks(this.dropdown.children);
        this.excludedMenuLinks = this.getExcludedLinks(this.menu.children);
        this.excludedDropdownLinks = this.getExcludedLinks(this.dropdown.children);

        window.addEventListener('load', this._adapt.bind(this));
        window.addEventListener('resize', this._adapt.bind(this));
    };

    proto._adapt = function () {
        // reset all styles
        for (var i = 0; i < this.allLinks.length; i++) {
            this.allLinks[i].classList.remove(this.options.hiddenClassName);
            this.allLinks[i].classList.remove(this.options.nestedElementClassName);
        }

        var stopWidth = this.getWidth(this.excludedMenuLinks);
        var hiddenItems = [];
        var primaryWidth = this.menu.offsetWidth;

        // checks for space on the main nav bar
        // if no space, list item is hidden on main nav bar and visible in 'more' container
        for (var i = 0; i < this.menuLinks.length; i++) {
            if (primaryWidth >= stopWidth + this.menuLinks[i].offsetWidth) {
                stopWidth += this.menuLinks[i].offsetWidth;
            } else {
                this.menuLinks[i].classList.add(this.options.hiddenClassName);
                hiddenItems.push(i);
            }
        }

        // if no items in 'more' container, 'more' container is hidden
        // otherwise display list items
        if (!hiddenItems.length) {
            this.more.classList.add(this.options.hiddenClassName);
        } else {
            for (var i = 0; i < this.dropdownLinks.length; i++) {
                if (this.excludedDropdownLinks.length) {
                    for (var j = 0; j < this.excludedDropdownLinks[j].length; j++) {
                        this.excludedDropdownLinks[j].classList.add(this.options.hiddenClassName);
                    }
                }
                if (hiddenItems.indexOf(i) == -1) {
                    this.dropdownLinks[i].classList.add(this.options.hiddenClassName);
                } else {
                    if (this.dropdownLinks[i].childNodes.length > 2) {
                        this.dropdownLinks[i].classList.add(this.options.nestedElementClassName);
                    }
                }
            }
        }
    };

    return PriorityNav;
});
