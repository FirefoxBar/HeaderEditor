<?php
header('Content-Type: application/javascript');

echo 'document.getElementById("value").value=\'', isset($_GET['value']) ? $_GET['value'] : 'empty', '\';';
