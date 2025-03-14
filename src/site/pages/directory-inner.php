<?php
ob_start();
include('includes/content/_directory-inner.php');
$content = ob_get_clean();

ob_start();
include('includes/layout/_page-type-1.php');
$full_html = ob_get_clean();

echo $full_html;