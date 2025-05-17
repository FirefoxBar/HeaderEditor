<?php
header('Content-Type: text/plain');

foreach ($_GET as $key => $value) {
  header("$key: $value");
}

echo 'Response';
