$(function(){
  $('#registration-form-input-submit').click(function() {
    $.post("api/register.php", {
      email: $('#registration-form-input-email').val(),
      password: $('#registration-form-input-password').val(),
      passwordc: $('#registration-form-input-password-confirmation').val()
    }, null, 'json').done(function(data) {
      if (typeof(data.user) != "undefined" && data.user.loggedIn == true) {
        window.location.href = 'home';
      } else {
        console.log(data);
      }
    });
    return false;
  });
});
