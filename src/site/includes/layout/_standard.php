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
        ?>

        <main class="py-4 py-sm-5">
            <div class="container">
                <div class="row">
                    <div class="col-12 col-lg-8 order-2 order-lg-1" id="content">

                        <?php include("includes/global/_in-page-nav.php"); ?>

                        <?php echo $content ?>

                    </div>
                    <div class="col-12 col-lg-3 offset-lg-1 order-1 order-lg-2">

                        <?php include("includes/global/_side-nav.php"); ?>

                    </div>
                </div>
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