<?php
header('Content-Type: application/javascript');

echo 'document.getElementById("value").value = \'', json_encode($_GET), '\';';
