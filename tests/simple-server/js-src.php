<?php
$url = 'mock-js.php';
if (!empty($_SERVER['QUERY_STRING'])) {
  $url .= '?' . $_SERVER['QUERY_STRING'];
}
?>
<html>
  <body>
    <input id="value" />
    <script src="<?=$url?>"></script>
  </body>
</html>
