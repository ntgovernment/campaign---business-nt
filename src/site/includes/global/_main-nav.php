<nav class="ntg-main-nav" id="mainmenu">
    <div class="ntg-main-nav__wrapper">
        <ul class="ntg-main-nav__links sf-menu">
            <li <?php echo $page == 'Index' ? 'class="active"' : ''; ?>>
                <a href="../../index.php">Business in the Territory</a>
            </li>
            <li <?php echo $page == 'Content' ? 'class="active"' : ''; ?>>
                <a href="../../content.php">Doing Business</a>
            </li>
            <li <?php echo $page == 'Form' ? 'class="active"' : ''; ?>>
                <a href="../../form.php">Tendering with Government</a>
            </li>
            <li <?php echo $page == 'News' ? 'class="has-children active"' : 'class="has-children"'; ?>>
                <a href="../../news.php">
                    Support for Business
                </a>
                <ul>
                    <li><a href="../../news-item.php">News item</a></li>
                </ul>
            </li>
            <li <?php echo $page == 'Components' ? 'class="active"' : ''; ?>>
                <a href="../../components.php">News</a>
            </li>
            <li <?php echo $page == 'Components' ? 'class="active"' : ''; ?>>
                <a href="../../components.php">Contact</a>
            </li>
        </ul>
        <button class="ntg-main-nav__search">
            <span class="visually-hidden">Search</span>
            <i class="fa fa-search" aria-hidden="true"></i>
        </button>
        <div class="ntg-main-nav__mobile">
            <a href="#mmenu-wrapper" aria-label="Open or close menu">
                <span aria-hidden="true"></span>
            </a>
        </div>
    </div>
</nav>