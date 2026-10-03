<?php
if (isset($_GET['header'])) {
  header('X-Test-Header: ' . $_GET['header']);
}

echo '<input id="value" style="width:100vw" value=\'', json_encode($_GET), '\'>';
