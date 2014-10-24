(function(theWindow) {
  var ts_opt = theWindow._ts.opts;
  function loadScript(url, callback) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = url;

    var entry = document.getElementsByTagName('script')[0];
    entry.parentNode.insertBefore(script, entry);

    if (callback) {
      if (script.addEventListener) {
        script.addEventListener('load', callback, false);
      } else {
        script.attachEvent('onreadystatechange', function() {
          if (/complete|loaded/.test(script.readyState))
            callback();
        });
      }
    }
  }
  function loadStyleSheet(url) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(link);
  }
  function jquery_callback(){
    var el = ts_opt.searchInputElement? ts_opt.searchInputElement:'#ts-search-input';
    console.log(jQuery);
    jQuery(el).tinysouSearch(ts_opt);
  }

  function zepto_callback(){
    var el = ts_opt.searchInputElement? ts_opt.searchInputElement:'#ts-search-input';
    Zepto(el).tinysouSearch(ts_opt);
  }

  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    if (window.Zepto) {
      loadScript('//tinysou-cdn.b0.upaiyun.com/nozepto.tinysou.js', zepto_callback);
    } else {
      loadScript('//tinysou-cdn.b0.upaiyun.com/zepto.tinysou.js', zepto_callback);
    }
  } else {
    if (window.jQuery) {
      loadScript('javascripts/jquery.tinysou.js', jquery_callback);
    } else {
      loadScript('//tinysou-cdn.b0.upaiyun.com/jquery.tinysou.js', jquery_callback);
    }
  }
  loadStyleSheet('//tinysou-cdn.b0.upaiyun.com/tinysou.min.css');
})(window);
