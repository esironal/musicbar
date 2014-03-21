<?php

class Errors {
  public function get($errorcode){
    switch($errorcode){
      default:
        return 'Unknown error.'; // translate me!
        break;
    }
  }
}
