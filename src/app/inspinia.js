

// Minimalize menu when screen is less than 768px
$(function () {
  $(window).bind("load resize", function () {
    if ($(this).width() < 769) {
      $('body').addClass('body-small')
    } else {
      $('body').removeClass('body-small')
    }
  })
});
