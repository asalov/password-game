<?php 

$maxFileSize = (int) substr(ini_get('upload_max_filesize'), 0, 1) * 1048576;

return [
	'displayErrorDetails' => true,
	'db' => [
		'driver' => 'YOUR_DB_DRIVER',
		'host' => 'YOUR_DB_HOST',
		'user' => 'YOUR_DB_USERNAME',
		'password' => 'YOUR_DB_PASSWORD',
		'dbname' => 'YOUR_DB_NAME'
	],
	'upload' => [
		'destination' => 'YOUR_UPLOAD_DESTINATION',
		'max_file_size' => $maxFileSize
	]
];