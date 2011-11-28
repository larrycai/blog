jQuery.fn.driveBy = function(settings){
  var elements = $([]);
  
  $(document).mousemove(function(d){
    elements.each(function(){
      element = $(this);
      offset = $(element).offset();
      width = $(element).width();
      height = $(element).height();
      x = (offset.left+width/2) - d.pageX;
      y = (offset.top+height/2) - d.pageY;
      if (x < 0) x = x*-1;
      if (y < 0) y = y*-1;
      distanceToCursor = Math.sqrt(x*x + y*y);
      distanceInPercent = (distanceToCursor / 250) * 100
      
      if (distanceToCursor <= 250 && !element.mouseinside){
        opacity = 1 - (distanceInPercent / 100);
        $(element).css('opacity', opacity);
      }else{
        $(element).css('opacity', 0);
      }
    });
    
  });
  
  return this.each(function(){
    var $this = $(this);
    
    settings = jQuery.extend({
      radius: 100
      }, settings);
    
    $this.distanceToCursor = 0;
    $this.triggerDistance = settings.radius;
    $this.mouseinside = false;
    
    if (settings.mouseenter) {
      $this.bind('mouseenter', function(){
        switch(typeof(settings.mouseenter)) {
          case 'object': $(this).css(settings.mouseenter); break;
          case 'function': settings.mouseenter.call(this); break;
        }
        $(this).mouseinside = true;
      });
      $this.bind('mouseleave', function(){
        $(this).mouseinside = false;
      });
    }

    elements.push($this);
    
  });
};