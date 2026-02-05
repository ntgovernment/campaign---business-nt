<!DOCTYPE html>
<html lang="en">

<?php include("includes/_head.php"); ?>

<body>
    <div id="wrapper">

        <?php
        include("includes/global/_skip-link.php");
        include("includes/global/_mmenu.php");
        include("includes/global/_search-global.php");
        include("includes/global/_header.php");
        include("includes/global/_standard-banner.php");
        include("includes/global/_breadcrumb.php");
        ?>

        <main class="">
            <div id="content1">

                <div class="container">
                    <?php include("includes/global/_in-page-nav.php"); ?>
                </div>

                <?php echo $content ?>

            </div>
        </main>

        <?php
        include("includes/global/_back-to-top.php");
        include("includes/global/_footer.php");
        ?>

    </div>
</body>

<?php include("includes/_script.php"); ?>

</html>