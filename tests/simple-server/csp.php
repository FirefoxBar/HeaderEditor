<?php
header('Content-Type: text/html');
header("Content-Security-Policy: script-src 'self'");
?>
<html>
<head>
  <title>Mock Response</title>
</head>
<body>
  <input id="value" value="Content" />
  <script>
    document.getElementById('value').value = 'Executed';
  </script>
  <?php
  if (isset($_GET['nonce'])) {
    echo '<script nonce="', $_GET['nonce'], '">';
    echo 'document.getElementById("value").value = "', $_GET['nonce'], '"';
    echo '</script>';
  }
  ?>
</body>
</html>