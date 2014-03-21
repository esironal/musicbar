<?php

if(!defined("PATH")){
  require_once('../../paths.php');
}

require_once(path('application/classes/Errors.php'));

class BaseClass {
  public $status;
  public $error;
  private $errors;
  public function __construct(){
    $this->errors = new Errors();
    $this->status = 0;
    $this->error = false;
  }
  public function setError($errorCode, $errorMessage = false){
    $this->error = array();
    if($errorMessage == false){
      $this->error['message'] = $this->errors->get($errorCode);
    }
    $this->error['code'] = $errorCode;
  }
  public function unsetError(){
    $this->status = 0;
    $this->error = false;
  }
}
