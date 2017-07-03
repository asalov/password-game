<?php 

function json($res, $data){
	return $res->withJson(['result' => $data]);
}

spl_autoload_register(function($class){
	require_once '../libs/' . $class . '.php';
});