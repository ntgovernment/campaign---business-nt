class StickyHeader {
    constructor(header, banner = false) {
		this.lastScrollTop = 0;
		this.delta = 5;
		this.header = header;
		this.banner = banner;
		this.checkScrollPosition = this.checkScrollPosition.bind(this);
        this.offsetNextElement = this.offsetNextElement.bind(this);
    }
  
    // initialise sticky header
    init() {
        this.header.classList.add('sticky-header'); // sticky header styles only appear once script loads
        this.checkScrollPosition();
        this.offsetNextElement();
		window.addEventListener('scroll', this.checkScrollPosition);
        window.addEventListener('resize', this.offsetNextElement);
    }

    // check scroll position to determine the header size
    checkScrollPosition() {
        var scrollTop = window.scrollY;
        var scrollUp = (this.lastScrollTop > scrollTop);

        // ensure scroll is more than delta
        if (Math.abs(this.lastScrollTop - scrollTop) <= this.delta) {
			return false;
        }

        const scrollSensor = 100;
        const bannerHeight = this.banner.offsetHeight;
		var scrollRef;

		// determine scroll position to show/hide header
		if (this.banner) {
            // use the height of the compacted header
            if (scrollTop > scrollSensor) {
                scrollRef = bannerHeight - this.header.offsetHeight;
            }
		} else {
			scrollRef = this.header.offsetHeight;
		}

        if (scrollUp) {
            if (scrollTop <= scrollSensor) {
                this.header.classList.remove('header-scroll');
            }
			this.header.classList.remove('header-hide');
        } else {
            if (scrollTop > scrollSensor) {
              	this.header.classList.add('header-scroll');
            }
            if (scrollTop > scrollRef) {
                this.header.classList.add('header-hide');
            }
        }

        this.lastScrollTop = scrollTop;
    }

    // dynamically offset the following element by the height of the header
    offsetNextElement() {
        var headerHeight = this.header.offsetHeight;
        var sibling = this.header.nextElementSibling;
        sibling.style.marginTop = headerHeight + 'px';
    }
}