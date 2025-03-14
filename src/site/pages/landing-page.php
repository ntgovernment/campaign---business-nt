<?php
ob_start();
include('includes/content/_landing-comp.php');
$content = ob_get_clean();

ob_start();
include('includes/layout/_landing.php');
$full_html = ob_get_clean();

echo $full_html;