<?php
ob_start();
include('includes/content/_search.php');
$content = ob_get_clean();

ob_start();
include('includes/layout/_search.php');
$full_html = ob_get_clean();

echo $full_html;