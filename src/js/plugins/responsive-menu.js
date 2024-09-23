/**
 *
 * Responsive menu
 * A vanilla JS responsive menu

 * Dependency: apollo JS | https://github.com/toddmotto/apollo
 *
 * Free to use under the MIT License.
 * 
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('responsivemenu', factory(root));
  } else if (typeof exports === 'object') {
    module.responsivemenu = factory(root);
  } else {
    root.responsivemenu = factory(root);
  }
})(this, function (root) {

  'use strict';

  // Variables
  var exports = {}; // Object for public APIs
  var supports = !!document.querySelector && !!root.addEventListener; // Feature test
  var settings; // Plugin settings
  var menu; // The actual menu item
  var touchedElement = ''; // used to ensure touch devices work correctly

  // Default settings
  var defaults = {
    menu: '',
    initiated_class: 'rm-initiated',
    hideclass: 'rm-closed',
    openclass: 'rm-opened',
    focusedclass: 'rm-focused'
  };

  // Methods
  /**
   * A simple forEach() implementation for Arrays, Objects and NodeLists
   * @private
   * @param {Array|Object|NodeList} collection Collection of items to iterate
   * @param {Function} callback Callback function for each iteration
   * @param {Array|Object|NodeList} scope Object/NodeList/Array that forEach is iterating over (aka `this`)
   */
  var forEach = function (collection, callback, scope) {
    if (Object.prototype.toString.call(collection) === '[object Object]') {
      for (var prop in collection) {
        if (Object.prototype.hasOwnProperty.call(collection, prop)) {
          callback.call(scope, collection[prop], prop, collection);
        }
      }
    } else {
      for (var i = 0, len = collection.length; i < len; i++) {
        callback.call(scope, collection[i], i, collection);
      }
    }
  };

  /**
   * Merge defaults with user options
   * @private
   * @param {Object} defaults Default settings
   * @param {Object} options User options
   * @returns {Object} Merged values of defaults and options
   */
  var extend = function (defaults, options) {
    var extended = {};
    forEach(defaults, function (value, prop) {
      extended[prop] = defaults[prop];
    });
    forEach(options, function (value, prop) {
      extended[prop] = options[prop];
    });
    return extended;
  };


  /**
   * Get parents
   */
  function getParents(element, tag, stop) {
    var nodes = [];
    while (element.parentNode && element.parentNode != stop) {
      element = element.parentNode;
      if (element.tagName == tag) {
        nodes.push(element);
      }
    }
    return nodes
  }

  // Responsive menu
  function initialize(settings) {

    menu = settings.menu || settings.wrapper.getElementsByTagName('ul')[0];

    // Add a class when JS is initiated
    apollo.addClass(settings.wrapper, settings.initiated_class);

    var menulinks = menu.getElementsByTagName('a');
    var dropdowns = menu.getElementsByClassName('collapse');

    for (var i = 0; i < menulinks.length; i++) {

      // Accessible focus menu
      menulinks[i].addEventListener('focus', function () {
        // Remove the class
        var siblings = this.parentNode.parentNode.querySelectorAll('li');
        if (siblings.length) {
          for (var f = 0; f < siblings.length; f++) {
            apollo.removeClass(siblings[f], settings.focusedclass);
          }
        }
        // Add the class
        var parent = getParents(this, "LI", menu);
        if (parent.length) {
          for (var f = 0; f < parent.length; f++) {
            apollo.addClass(parent[f], settings.focusedclass);
          }
        }
      });

      // Adds a double click to 1st level navigation with children on desktop touchscreen devices
      menulinks[i].addEventListener('touchend', function (e) {

        if (!this.parentNode.getElementsByTagName('ul')[0]) {
          return;
        }

        // remove double tap on mobile devices
        if (window.innerWidth < 992) {
          return;
        }

        if (touchedElement == this) {
          apollo.removeClass(touchedElement.parentNode.parentNode, settings.focusedclass);
        } else {
          touchedElement = this;
          apollo.addClass(touchedElement.parentNode, settings.focusedclass);
          e.preventDefault();
          e.stopPropagation();
        }

      });

      // When escape button is clicked closes dropdown menu and sets focus on first level element
      menulinks[i].addEventListener('keydown', function (e) {

        if (e.keyCode === 27) {
          var element = document.getElementsByClassName('rm-focused')[0];
          if (element) {
            element.firstElementChild.focus();
            for (var i = 0; i < menulinks.length; i++) {
              apollo.removeClass(menulinks[i].parentNode, settings.focusedclass);
            }
          }
        }
      });

    }

    for (var i = 0; i < dropdowns.length; i++) {

      var dropdownlinks = dropdowns[i].getElementsByTagName('a');

      for (var j = 0; j < dropdownlinks.length; j++) {

        // Allow navigation through dropdown menus with arrow keys
        dropdownlinks[j].addEventListener('keydown', function (e) {

          switch (e.keyCode) {
            case 38:

              e.preventDefault();

              var list = e.target.parentNode.parentNode.children;
              var prev = e.target.parentNode.previousSibling.previousSibling;
              apollo.removeClass(e.target.parentNode, settings.focusedclass);
              if (prev) {
                prev.firstElementChild.focus();
                apollo.addClass(prev, settings.focusedclass);
              } else {
                list[list.length - 1].firstElementChild.focus();
                for (var i = 0; i < list.length; i++) {
                  if (list[i] !== list.length) {
                    return;
                  }
                  apollo.addClass(list[i].parentNode, settings.focusedclass);
                }
              }
              break;
            case 40:

              e.preventDefault();

              var list = e.target.parentNode.parentNode.children;
              var next = e.target.parentNode.nextSibling.nextSibling;
              apollo.removeClass(e.target.parentNode, settings.focusedclass);
              if (next) {
                next.firstElementChild.focus();
                apollo.addClass(next, settings.focusedclass);
              } else {
                list[0].firstElementChild.focus();
                for (var i = 0; i < list.length; i++) {
                  if (list[i] !== list[0]) {
                    return;
                  }
                  apollo.addClass(list[i].parentNode, settings.focusedclass);
                }
              }
              break;
          }
        });

      }

    }

    // Detect whether clicked outside menu in order to close dropdown
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target)) {
        // Reset clicked element for touchscreen desktop devices
        touchedElement = '';
        // Remove the class
        for (var i = 0; i < menulinks.length; i++) {
          apollo.removeClass(menulinks[i].parentNode, settings.focusedclass);
        }
      }
    });

    window.addEventListener('resize', function () {

      if (window.innerWidth >= 992) {
        var listItems = document.getElementById('mainmenu').querySelectorAll('li.rm-focused');
        if (listItems.length) {
          for (var i = 0; i < listItems.length; i++) {
            apollo.removeClass(listItems[i], settings.focusedclass);
          }
        }
      }

    });

  }

  /**
   * Initialize Plugin
   * @public
   * @param {Object} options User settings
   */
  exports.init = function (options) {
    // feature test
    if (!supports) {
      document.documentElement.className += ' ' + settings.noresponsivemenuclass;
      return;
    }
    settings = extend(defaults, options || {}); // Merge user options with defaults
    initialize(settings);
  };

  // Public APIs
  return exports;

});