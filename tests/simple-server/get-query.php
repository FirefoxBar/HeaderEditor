<?php
header('Content-Type: text/html');

echo '<input id="value" style="width:100vw" value=\'', json_encode($_GET), '\'>';
