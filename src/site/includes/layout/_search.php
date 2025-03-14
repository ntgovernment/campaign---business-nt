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
        ?>

        <main class="py-4 py-sm-5">
            <div class="container">
                <div class="row">
                    <div class="col-12 col-lg-8 order-2 order-lg-1" id="content">

                        <?php echo $content ?>

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