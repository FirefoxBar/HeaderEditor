<?php
header('Content-Type: application/json');

echo json_encode([
  'value' => $_GET['value'],
]);
