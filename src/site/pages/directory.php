<?php
ob_start();
include('includes/content/_directory.php');
$content = ob_get_clean();

ob_start();
include('includes/layout/_page-with-filter.php');
$full_html = ob_get_clean();

echo $full_html;