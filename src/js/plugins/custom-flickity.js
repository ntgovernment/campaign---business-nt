class CustomFlickity {
    constructor(element, options) {
        this.element = element;
        this.options = options;
        this.playText = "Play";
        this.pauseText = "Pause";

        this.init();
    }

    init() {
        this.carousel = new Flickity(this.element, this.options);

        /**
         * @todo conditions to work out pagedots and autoplay based on their visibility
         */
        if (this.options.autoPlay && this.options.pageDots) {
            this.addPlayPauseButton();
        }

        this.changeCellOnLinkFocus();
    }

    changeCellOnLinkFocus() {
        const cellElements = this.carousel.getCellElements();

        for(let i = 0; i < cellElements.length; i++) {
            const links = cellElements[i].querySelectorAll("a");

            if(links.length > 0) {
                links.forEach((link) => {
                    link.addEventListener("focus", (e) => {
                        this.carousel.select(i);
                    })
                })
            }

        }
    }
    
    addPlayPauseButton() {
        this.carousel.playPauseButton = `
        <li class="control">
            <a href="" class="control-button">${this.pauseText}</a>
        </li>
        `;

        const carouselPageDots = this.carousel.element.querySelector(".flickity-page-dots");
        carouselPageDots.insertAdjacentHTML("beforeend", this.carousel.playPauseButton);
    }

    addPlayPauseListeners() {
        // add click listener
        const playPauseButton = carouselPageDots.querySelector(".control-button");
        
        playPauseButton.addEventListener("click", e => {
            e.preventDefault();
            if (playPauseButton.innerHTML === this.pauseText) {
                this.carousel.stopPlayer();
                playPauseButton.innerHTML = this.playText;
            } else if (playPauseButton.innerHTML === this.playText) {
                this.carousel.playPlayer();
                playPauseButton.innerHTML = this.pauseText;
            }
        });
    }
}