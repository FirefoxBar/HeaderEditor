<?php
$url = 'mock-js.php';
if (!empty($_GET['value'])) {
  $url .= '?value=' . $_GET['value'];
}
?>
<html>
  <body>
    <input id="value" />
    <script src="<?=$url?>"></script>
  </body>
</html>
