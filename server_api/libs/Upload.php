<?php

class Upload{
	private $files;
	private $destination;
	private $maxSize;

	// The permitted MIME types which the user can upload
	private $permitted = [  
		'image/gif', 
		'image/pjpeg', 
		'image/jpeg', 
		'image/png'
	];
	private $validated = [];
	private $uploaded = [];
	private $fileLocations = [];
	private $errorHandler;
	private $required;
	
	public function __construct($dest, $maxFileSize, ErrorHandler $errorHandler, $permittedTypes = []){
		if(!is_dir($dest) && !is_writable($dest)) 
			throw new Exception($dest . ' must be a valid, writable directory.');

		$this->destination = $dest;
		$this->maxSize = $maxFileSize;
		$this->files = $_FILES;
		$this->errorHandler = $errorHandler;

		if(!empty($permittedTypes)) $this->permitted = $permittedTypes;
	}
	
	// Add additional permitted MIME types 
	public function addMimeTypes($mimeTypes){
		$types = (array) $mimeTypes;

		foreach($types as $type){
			if(!in_array($type, $this->permitted)) array_push($this->permitted, $type);
		}
	}

	// Move the uploaded files to the desired destination
	public function move($options = []){
		$requiredFields = (isset($options['required'])) ? $options['required'] : [];
		$overwrite = isset($options['overwrite']);

		// Handle multiple file input fields with different names
		foreach($this->files as $key => $val){
			$field = $this->files[$key];

			// Specify if the upload is strictly required
			$this->required = in_array($key, $requiredFields);
			
			// Process multiple uploads
			if(is_array($field['name'])){
				foreach ($field['name'] as $num => $filename){
					$this->processFiles($filename, $field['error'][$num], $field['size'][$num], 
										$field['type'][$num], $field['tmp_name'][$num]);
				}
			}else{
				$this->processFiles($field['name'], $field['error'], $field['size'], $field['type'], $field['tmp_name']);
			}
		}

		// If there are no errors, upload all files
		if($this->success()) $this->uploadFiles($overwrite);
	}
	
	// Detect an error during the uploading process
	private function checkError($filename, $error){
		$valid = false;

		switch($error){
			case 0:
				$valid = true;
			break;
			case 1:
			case 2:
				$this->errorHandler->add($filename . ' exceeds the permitted file size: '  . $this->getMaxSize());
			break;
			case 3:
				$this->errorHandler->add('Error uploading ' . $filename . ' Please try again.');
			break;
			case 4:
				if($this->required) $this->errorHandler->add('No file selected.');
			break;
			default:
				$this->errorHandler->add('System error uploading ' . $filename . ' Contact webmaster.');
			break;
		}

		return $valid;
	}
	
	// Check the file size
	private function checkSize($filename, $size){
		if($size > $this->maxSize){
			$this->errorHandler->add($filename . '  exceeds the permitted file size: ' . $this->getMaxSize());
			return false;
		}
		return true;
	}
	
	// Check if the MIME type of the uploaded file is permitted
	private function checkType($filename, $type){
		if(!in_array($type, $this->permitted)){
			$this->errorHandler->add($filename . ' is not a permitted file type.');
			return false;
		}
		return true;
	}
	
	// Display the maximum file size that is allowed
	private function getMaxSize(){
		return number_format($this->maxSize / 1048576, 1) . ' MB';
	}
	
	// Check if the file already exists
	private function checkName($name, $overwrite){
		$nospaces = str_replace(' ', '_', $name);

		if(!$overwrite){
			$existing = scandir($this->destination);

			if(in_array($nospaces, $existing)){
				$dot = strrpos($nospaces, '.');

				$base = ($dot) ? substr($nospaces, 0, $dot) : $nospaces;
				$extension = ($dot) ? substr($nospaces, $dot) : '';

				$i = 1;
 
				do{
					$nospaces = $base . '_' . $i . $extension;
					$i++;
				}while(in_array($nospaces, $existing));
			}
		}
		return $nospaces;
	}
	
	private function processFiles($filename, $error, $size, $type, $tmpName){
		if($this->checkError($filename, $error)){
			$validSize = $this->checkSize($filename, $size);
			$validType = $this->checkType($filename, $type);

			if($validSize && $validType) $this->validated[$tmpName] = $filename;
		}
	}

	private function uploadFiles($overwrite){
		foreach($this->validated as $tmpName => $filename){
			$name = $this->checkName($filename, $overwrite);
			$success = move_uploaded_file($tmpName, $this->destination . $name);

			if($success){
				$this->fileLocations[] = $this->destination . $name;
				$this->uploaded[] = $filename;
			}else{
				$this->errorHandler->add('Could not upload ' . $filename);
			}
		}
	}

	// Retrieve the path to each uploaded file
	public function fileLocations(){
		return $this->fileLocations;
	}

	// Get the name of all files that were uploaded successfully
	public function uploaded(){
		return $this->uploaded;
	}

	public function success(){
		return !$this->errorHandler->hasErrors();
	}

	public function errors(){
		return $this->errorHandler;
	}
}