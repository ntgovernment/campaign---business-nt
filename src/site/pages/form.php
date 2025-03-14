<?php
ob_start();
include('includes/content/_form.php');
$content = ob_get_clean();

ob_start();
include('includes/layout/_standard.php');
$full_html = ob_get_clean();

echo $full_html;