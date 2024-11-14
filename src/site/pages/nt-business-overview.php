<?php
ob_start();
include('includes/content/_nt-business-overview.php');
$content = ob_get_clean();

ob_start();
include('includes/layout/_full-width.php');
$full_html = ob_get_clean();

echo $full_html;