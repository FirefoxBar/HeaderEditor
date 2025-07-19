<?php
header('Content-Type: text/html');

$headers = [];
foreach ($_SERVER as $key => $value) {
  if (substr($key, 0, 5) === 'HTTP_') {
    $headers[substr($key, 5)] = $value;
  }
}

echo '<input id="value" value=\'', json_encode($headers), '\'>';
