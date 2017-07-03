<?php

class ErrorHandler{
	private $errors = [];
	
	public function add($error, $key = null){
		($key) ? $this->errors[$key][] = $error : $this->errors[] = $error;
	}
	
	public function hasErrors(){
		return !empty($this->errors);
	}
	
	public function all($key = null){
		return isset($this->errors[$key]) ? $this->errors[$key] : $this->errors;
	}
	
	public function first($key = null){	
		if(isset($this->errors[$key])){
			return $this->errors[$key][0];
		}else{
			$first = reset($this->errors);
			return (is_array($first)) ? $first[0] : $first;
		}	
	}

	public function clear($key = null){
		if(isset($this->errors[$key])){
			unset($this->errors[$key]);
		}else if($key === null){
			$this->errors = [];
		}
	}
}