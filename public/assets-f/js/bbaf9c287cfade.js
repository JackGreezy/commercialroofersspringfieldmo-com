/**
 * jquery.hoverdir.js v1.1.0
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2012, Codrops
 * LCweb tweaked to work with Overlay Manager add-on - March 2015
 * http://www.codrops.com - http://www.lcweb.it
 */
 
(function(d,f,m){d.lc_HoverDir=function(a,b){this.$el=d(b);this._init(a)};d.lc_HoverDir.defaults={speed:400,easing:"ease",hoverDelay:0,inverse:!1,overlaySelector:"div",noTransitionClass:"no_transition"};d.lc_HoverDir.prototype={_supportsTransitions:function(){var a=(document.body||document.documentElement).style,b="transition";if("string"==typeof a[b])return!0;for(var c="Moz webkit Webkit Khtml O ms".split(" "),b=b.charAt(0).toUpperCase()+b.substr(1),e=0;e<c.length;e++)if("string"==typeof a[c[e]+
b])return!0;return!1},_init:function(a){this.options=d.extend(!0,{},d.lc_HoverDir.defaults,a);this.support=this._supportsTransitions();this._loadEvents()},_loadEvents:function(){var a=this;a.$el.on("mouseenter.lc_hoverdir, mouseleave.lc_hoverdir",function(b){var c=d(this),e=c.find(a.options.overlaySelector),c=a._getDir(c,{x:b.pageX,y:b.pageY}),g=a._getStyle(c);"mouseenter"===b.type?(a.support&&e.addClass(a.options.noTransitionClass),e.hide().css(g.from),clearTimeout(a.tmhover),a.tmhover=setTimeout(function(){a.support&&
e.removeClass(a.options.noTransitionClass);e.show(0,function(){var b=d(this);a._applyAnimation(b,g.to,a.options.speed)})},a.options.hoverDelay)):(clearTimeout(a.tmhover),a._applyAnimation(e,g.from,a.options.speed))})},_getDir:function(a,b){var c=a.width(),e=a.height(),d=(b.x-a.offset().left-c/2)*(c>e?e/c:1),c=(b.y-a.offset().top-e/2)*(e>c?c/e:1);return Math.round((Math.atan2(c,d)*(180/Math.PI)+180)/90+3)%4},_getStyle:function(a){var b,c,e={left:"0px",top:"-100%"},d={left:"0px",top:"100%"},f={left:"-100%",
top:"0px"},h={left:"100%",top:"0px"},k={top:"0px"},l={left:"0px"};switch(a){case 0:b=this.options.inverse?d:e;c=k;break;case 1:b=this.options.inverse?f:h;c=l;break;case 2:b=this.options.inverse?e:d;c=k;break;case 3:b=this.options.inverse?h:f,c=l}return{from:b,to:c}},_applyAnimation:function(a,b,c){this.support?a.stop().css(b):a.stop().animate(b,d.extend(!0,[],{duration:c+"ms"}))}};d.fn.lc_hoverdir=function(a){var b=d.data(this,"lc_hoverdir");if("string"===typeof a){var c=Array.prototype.slice.call(arguments,
1);if(!b){f.console&&f.console.error("cannot call methods on hoverdir prior to initialization; attempted to call method '"+a+"'");return}if(!d.isFunction(b[a])||"_"===a.charAt(0)){f.console&&f.console.error("no such method '"+a+"' for hoverdir instance");return}b[a].apply(b,c)}else b?b._init():b=d.data(this,"lc_hoverdir",new d.lc_HoverDir(a,this));return b}})(jQuery,window);