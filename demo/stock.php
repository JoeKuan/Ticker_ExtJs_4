<?php
$ch = curl_init();
$symbols = str_replace(' ', '+', $_POST['s']);
curl_setopt($ch, CURLOPT_URL, "http://download.finance.yahoo.com/d/quotes.csv?s={$symbols}&f={$_POST['f']}");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
$lines = explode("\r\n", $res);
foreach ($lines as $ln) {
   if (!strlen($ln)) 
      continue;

   $p = explode(",", $ln);
   if (!count($p))
       continue;

   $result['rows'][] = array("symbol" => trim($p[0], '"'),
                             "price"  => floatval(number_format(floatval($p[1]), 2)),
                             "change" => floatval(number_format(floatval($p[2]), 2)),
                             "percent" => trim($p[3], '"'),
                             "exchange" => trim($p[4], '"'));
}

echo json_encode($result);
?>
