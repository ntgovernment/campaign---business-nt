<?php
ob_start();
include('includes/content/_workforce-readiness.php');
$content = ob_get_clean();

ob_start();
include('includes/layout/_full-width.php');
$full_html = ob_get_clean();

echo $full_html;
