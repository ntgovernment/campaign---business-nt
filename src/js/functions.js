(function () {
    initPriorityNav();
    initResponsiveMenu();
    initMmenu();
    initMenuEdge();
    initSuperfish();
    initStickyHeader();
    initSideNav();
    initInPageNav();
    initScrollToTop();
    initResponsiveTable();
    initFlickity();
    initCountUp();
    initResizeButtons();
    initResponsivePagination();
    initLinkCheck();
})();

function initLinkCheck() {
    var links = document.querySelectorAll('#content a');
    if (!links) {
        return false;
    }
    
    links.forEach(function (link) {
        if (location.hostname === link.hostname || !link.hostname.length) {
            return false;
        } else {
            var fontWeight = window.getComputedStyle(link).getPropertyValue('font-weight');
            let iconWeight;

            if (fontWeight == '300') {
                iconWeight = 'fa-light';
            } else if (fontWeight == '400') {
                iconWeight = 'fa-regular';
            } else if (fontWeight == '700') {
                iconWeight = 'fa-solid';
            }

            var icon = '<i class="' + iconWeight + ' fa-external-link ms-1 aria-hidden="true"></i>';

            if(!link.querySelector('[class*="fa-external-link"]') && !link.querySelector('img')) {
                link.insertAdjacentHTML('beforeend', icon);
            }
        }
    });
}

function initPriorityNav() {
    var mainNav = document.querySelector('.ntg-main-nav');
    if (!mainNav) {
        return false;
    }
    
    new PriorityNav('.ntg-main-nav');
}

function initResponsiveMenu() {
    var mainNav = document.getElementById('mainmenu');
    if( !mainNav) {
        return false;
    }

    responsivemenu.init({
        wrapper: document.querySelector('#mainmenu'),
    });
}

function initMmenu() {
    const mmenuWrapper = document.getElementById('mmenu-wrapper');
    const pageHeader = document.getElementsByClassName("page-header-container")[0];

    if (!mmenuWrapper) {
        return false;
    }

    
    if (pageHeader.getAttribute("data-bs-theme")) {
        mmenuWrapper.setAttribute("data-bs-theme", pageHeader.getAttribute("data-bs-theme"));
    }

    document.addEventListener("DOMContentLoaded", () => {
        let btnContent = ``;

        if (mmenuWrapper.getAttribute("data-btn-link") && mmenuWrapper.getAttribute("data-btn-text")) {
            btnContent = `<a role="button" class="btn btn-light d-flex btn-mmenu" href="${mmenuWrapper.getAttribute("data-btn-link")}">${mmenuWrapper.getAttribute("data-btn-text")}</a>`

            mmenuWrapper.removeAttribute('data-btn-link');
            mmenuWrapper.removeAttribute('data-btn-text');
        }

        const mmenu = new Mmenu('#mmenu-wrapper', {
            "offCanvas": {
                "position": "right-front"
            },
            "navbars": [{
                use: true,
                position: "bottom",
                content: btnContent,
             }]
        });

        const API = mmenu.API;

        // closes the menu automatically if screen is resized above 992px
        window.addEventListener('resize', function () {
            if (window.matchMedia('(min-width: 992px)').matches) {
                API.close();
            }
        });

        
        // inserts close button to navbars
        var panels = document.querySelector('.mm-panels');
        var close = document.createElement('a');
        close.setAttribute('class', "mm-btn mm-btn--close-wrapper mm-navbar__btn");
        close.setAttribute('aria-label', "Close menu");
        close.setAttribute('href', "#wrapper");
        close.innerHTML = `<div class="mm-btn--close">
                                <span class="top-line" aria-hidden="true"></span>
                                <span class="bot-line" aria-hidden="true"></span>
                            </div>
                            <span class="mm-btn--close__text">Close</span>`;
        panels.prepend(close);
    });
}

// dynamically shifts main nav dropdown position based on window width
function initMenuEdge() {
    var links = document.querySelectorAll('.ntg-main-nav__links > li');

    if (!links) {
        return false
    }

    links.forEach(link => {
        var second = link.querySelector('ul > li > ul');
        var third = link.querySelector('ul > li > ul > li > ul');

        if ((second || third) && !link.classList.contains("more")) {
            link.addEventListener('mouseenter', function () {
                avoidEdge();
            });
            link.addEventListener('keydown', function () {
                avoidEdge();
            });
            link.addEventListener('touchstart', function () {
                avoidEdge();
            });
        }

        function avoidEdge() {
            var offset = offset(link);
            var left = offset.left;
            var width_1 = 300; // second level width
            var width_2 = 600; // third level width
            var wnWidth = window.innerWidth;

            var isSecondVisible = left + width_1 <= wnWidth;
            var isThirdVisible = left + width_2 <= wnWidth;

            if (!isThirdVisible) {
                link.classList.add("edge");
            } else {
                link.classList.remove("edge");
            }

            if (!isSecondVisible) {
                link.classList.add("all");
            } else {
                link.classList.remove("all");
            }

            function offset(elem) {
                var rect = elem.getBoundingClientRect();
                
                return {
                    left: rect.left + window.scrollX,
                }
            }
        }
    });
}

function initSuperfish() {
    $(function () {
        $('ul.sf-menu').superfish({
            // options
            delay: 250,
            speed: 250,
            speedOut: 250,
            cssArrows: false
        });
    });
}

function initStickyHeader() {
    const header = document.querySelector(".page-header-container");
    const banner = document.querySelector(".ntg-banner");
    if (!banner) {
        var stickyHeader = new StickyHeader(header);
    } else {
        var stickyHeader = new StickyHeader(header, banner);
    }
    stickyHeader.init();
}

// dynamically add all h2 elements on the page into anchor list
function initInPageNav() {
    var inPageNav = document.getElementById('in-page-nav');
    if (!inPageNav) {
        return false;
    }

    var list = inPageNav.querySelector('ul');
    document.querySelectorAll('#content h2').forEach(function (element, index) {
        if (index === 0) {
            return false;
        }

        var heading = element;
        if (element.querySelector('a')) {
            element = element.querySelector('a');
            heading = element.parentElement;
        }
        
        list.insertAdjacentHTML(
            'beforeend',
            '<li><a href="#' +
                element.innerText
                    .replace(/&amp;/g, 'and')
                    .replace(/[^a-z0-9 ]/gi, '')
                    .replace(/\s/g, '-')
                    .toLowerCase() +
                '">' +
                element.innerText +
                '</a></li>'
        );
        element.setAttribute(
            'id',
            element.innerText
                .replace(/&amp;/g, 'and')
                .replace(/[^a-z0-9 ]/gi, '')
                .replace(/\s/g, '-')
                .toLowerCase()
        );
    });
}

// adds accordion functionality to nested items in the side navigation
function initSideNav() {
    var sideNavParents = document.querySelectorAll('.ntg-side-nav__collapser');
    if (!sideNavParents) {
        return false;
    }

    for (var i = 0; i < sideNavParents.length; i++) {
        sideNavParents[i].addEventListener('click', function (e) {
            e.preventDefault();

            var thisNext = this.parentElement.getElementsByClassName('collapse')[0];

            if (thisNext.classList.contains('show')) {
                thisNext.classList.remove('show');
                this.classList.add('collapsed');
            } else {
                thisNext.classList.add('show');
                this.classList.remove('collapsed');
            }
        });
    }
}

function initScrollToTop() {
    var backToTop = document.querySelector('.back-to-top');
    if (!backToTop) {
        return false;
    }

    var backToTopLink = backToTop.querySelector('.back-to-top button');
    var footer = document.querySelector('.ntg-footer');
    var isGoUpOn = false;
    var scrollHighSensor = 500;

    window.addEventListener('scroll', function () {
        buttonUpService(this);
        checkFooterPosition();
    });

    window.addEventListener('resize', function () {
        checkFooterPosition();
    });

    backToTopLink.addEventListener('click', function (e) {
        e.preventDefault();
        // workaround to ensure the focus is reset to the top of the page when using keyboard
        document.querySelector('header a').focus({ preventScroll: true });
        scroll({
            top: 0,
            left: 0,
            behavior: 'smooth',
        });
    });

    // checks the scroll position of the page and determines whether the back to top button should be visible
    function buttonUpService() {
        if (!isGoUpOn) {
            if (window.pageYOffset > scrollHighSensor) {
                isGoUpOn = true;
                fadeIn(backToTop);
            }
        } else {
            if (window.pageYOffset <= scrollHighSensor) {
                fadeOut(backToTop);
                isGoUpOn = false;
            }
        }
    }

    function checkFooterPosition() {
        var scrollBottom = document.body.clientHeight - document.documentElement.clientHeight - document.documentElement.scrollTop;
        if (scrollBottom < footer.offsetHeight) {
            backToTop.style.marginBottom = footer.offsetHeight - scrollBottom + 'px';
        } else {
            backToTop.style.marginBottom = 0;
        }
    }
}

function initResponsiveTable() {
    document.querySelectorAll('[class*="custom-table-"]').forEach(function (element) {
        responsiveCellHeaders(element);
        addTableAria(element);
    });
}

function initFlickity() {
    var carousels = document.querySelectorAll('.flickity-carousel');
    if (!carousels) {
        return false;
    }

    carousels.forEach(function (carousel) {
        var alignment = carousel.getAttribute('data-align');
        if (!alignment) {
            alignment = 'center';
        }

        var flkty = new Flickity(carousel, {
            // options
            cellAlign: alignment,
            pageDots: false,
            on: {
                ready: function() {
                    setSliderHeightToMax(this);
                }
            }
        });

        const cellElements = flkty.getCellElements();

        for (let i = 0; i < cellElements.length; i++) {
            const links = cellElements[i].querySelectorAll('a');

            if (links.length > 0) {
                links.forEach((link) => {
                    link.addEventListener("focus", (e) => {
                        flkty.select(i);
                    })
                });
            }
        }

        // make cell elements equal height
        function setSliderHeightToMax(slider) {
            slider.cells.forEach(cell => cell.element.style.height = '');
                
            let heights = slider.cells.map(cell => cell.element.offsetHeight),
                max = Math.max.apply(Math, heights);
            
            slider.cells.forEach(cell => cell.element.style.height = max + 'px');
        }

        window.addEventListener('resize', function(){
            setSliderHeightToMax(flkty);
        });
    });
}

function toggleCarouselButton() {
    var carousels = document.querySelectorAll('.carousel');
    var paused = false;

    // filter out carousels that haven't been initialized
    var initializedCarousels = [];
    
    carousels.forEach((carousel) => {
        let carouselOptions = {
            ride: "carousel"
        };

        if (!isNaN(parseInt(carousel.getAttribute('data-bs-interval')))) {
            console.log(parseInt(carousel.getAttribute('data-bs-interval')))
            carouselOptions["interval"] = parseInt(carousel.getAttribute('data-bs-interval'));
        } else {
            carouselOptions["interval"] = false;
            carouselOptions["ride"] = false;
        }

        const car = new bootstrap.Carousel(carousel, carouselOptions);

        initializedCarousels.push(car);
    });

    initializedCarousels.forEach(function (carousel) {
        let bootstrapCarousel = carousel;

        const toggleButton = carousel._element.querySelector('.toggleCarouselBtn');

        if (toggleButton) {
            let playPauseIcon = toggleButton.querySelector('i');
            toggleButton.addEventListener('click', function (e) {
                if (paused) {
                    bootstrapCarousel.cycle();
                    bootstrapCarousel._config.ride = "carousel";
                    playPauseIcon.classList.remove("fa-play");
                    playPauseIcon.classList.add("fa-pause");
                    paused = false;
                } else {
                    bootstrapCarousel.pause();
                    bootstrapCarousel._config.ride = false;
                    playPauseIcon.classList.remove("fa-pause");
                    playPauseIcon.classList.add("fa-play");
                    paused = true;
                }
            });
        }
    });
}

function initCountUp() {
    var values = document.querySelectorAll('.count-up');

    values.forEach(function (value) {
        var target = value.innerHTML.replace(/[^\d.]/g, '');

        // default options
        var decimalPlaces = 0;
        var prefix = '';
        var suffix = '';

        // check for decimal places
        if (target.includes('.')) {
            decimalPlaces = target.split('.')[1].length;
        }

        // check for prefix
        if (value.hasAttribute('data-prefix')) {
            prefix = value.getAttribute('data-prefix');
        }

        // check for suffix
        if (value.hasAttribute('data-suffix')) {
            suffix = value.getAttribute('data-suffix');
        }

        const countUp = new CountUp(value, target, {
            decimalPlaces: decimalPlaces,
            duration: 3,
            prefix: prefix,
            suffix: suffix,
            enableScrollSpy: true,
            scrollSpyOnce: 1
        });
    });
}

// resizes any buttons on a page as small buttons below a certain breakpoint
function initResizeButtons() {
    $('.btn:not(.btn-sm)').each(function () {
        var btn = $(this);
        const breakpoint = 974;

        handleSizing(btn, breakpoint);

        $(window).on('resize', function () {
            handleSizing(btn, breakpoint);
        });
    });

    function handleSizing(e, breakpoint) {
        if ($(window).width() <= breakpoint) {
            e.addClass('btn-sm');
        } else {
            e.removeClass('btn-sm');
        }
    }
}

function initResponsivePagination() {
    var pagination = document.querySelectorAll('.pagination');
    if (!pagination) { return false; }

    pagination.forEach((e) => {
        // select all page items without exclude class, useful for excluding previous and next page items
        var items = e.querySelectorAll('.page-item:not(.exclude)');

        hidePageItems(items);

        window.addEventListener('resize', function () {
            hidePageItems(items);
        });
    });
    
    function hidePageItems(elems) {
        if (window.matchMedia('(max-width: 992px)').matches) {
            if (elems.length > 5) {
                for (let i = 0; i < elems.length; i++) {
                    var elem = elems[i];

                    if (i > 4 && !elem.classList.contains('d-none')) {
                        elem.classList.add('d-none');
                    }
                }
            }
        } else {
            for (let i = 0; i < elems.length; i++) {
                var elem = elems[i];

                if (elem.classList.contains('d-none')) {
                    elem.classList.remove('d-none');
                }
            }
        }
    }
}