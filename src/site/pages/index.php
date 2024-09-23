<?php
ob_start();
include('includes/content/_index.php');
$content = ob_get_clean();

ob_start();
include('includes/layout/_homepage.php');
$full_html = ob_get_clean();

echo $full_html;