/* ------------------------------------------------------------------------
	* LCweb text shortener
	*
	* @version: 	1.1
	* @requires:	jQuery v1.5 or later
	* @author:		Luca Montanari (LCweb) (http://projects.lcweb.it)
	
	* Licensed under the MIT license
------------------------------------------------------------------------- */

(function(a){a.fn.lcweb_txt_shortener=function(h,f,u,v){var t=a(this);"undefined"==typeof lcts_orig_texts&&(lcts_orig_texts=a.makeArray());"undefined"==typeof h&&(h="..");a.fn.lcts_remove_all_attr=function(){return this.each(function(){var b=a.map(this.attributes,function(d){return d.name}),c=a(this);a.each(b,function(d,e){"href"!=e&&"target"!=e&&c.removeAttr(e)})})};return function(){t.each(function(){var b=a(this),c=a(this).attr("lcts-id");"undefined"==typeof c?(c=Math.random().toString(36).substr(2,
9),a(this).attr("lcts-id",c),lcts_orig_texts[c]=b.html()):(b.html(lcts_orig_texts[c]),b.removeClass("lcts_shorten"));b.find("*:empty").not("br, img, i").remove();c=b.outerHeight(!0);var d="undefined"!=typeof f&&f?parseInt(f):b.parent().height();"undefined"!=typeof f&&parseInt(f)>d&&(d=parseInt(f));if(d<c){b.html();b.addClass("lcts_shorten");b.find("*").lcts_remove_all_attr();b.find("*").not("a, p, br, i:empty").each(function(){var m=a(this).contents();a(this).replaceWith(m)});for(var e=b.html().split(" "),
k="",g="",l=c=0;c<d&&l<e.length;)if("undefined"!=typeof e[l]){g=k;k=k+e[l]+" ";for(b.html(k+' <span class="lcts_end_txt">'+h+"</span>");-1!=b.html().indexOf('<br> <span class="lcts_end_txt">');)b.find(".lcts_end_txt").prev().remove();c=b.outerHeight(!0);l++}var q=["a","p","i"];a.each(q,function(m,n){var p=g.match("<"+n,"g"),r=g.match("</"+n,"g");null!=p&&(null!=p&&null==r||p.length>r.length)&&(g=g+"</"+n+">");if(m==q.length-1)for(b.html(g+'<span class="lcts_end_txt">'+h+"</span>"),b.find("*:empty").not("br").remove();-1!=
b.html().indexOf('<br> <span class="lcts_end_txt">');)b.find(".lcts_end_txt").prev().remove()});b.find("p").last().css("display","inline")}})}()};a.fn.lcts_reset=function(){a(this).each(function(){"undefined"!=typeof lcts_orig_texts&&"undefined"!=typeof a(this).attr("lcts-id")&&(a(this).removeClass("lcts_shorten"),a(this).html(lcts_orig_texts[a(this).attr("lcts-id")]))})};a.fn.lcts_destroy=function(){a(this).each(function(){"undefined"!=typeof lcts_orig_texts&&"undefined"!=typeof a(this).attr("lcts-id")&&
(a(this).removeClass("lcts_shorten"),a(this).html(lcts_orig_texts[a(this).attr("lcts-id")]),a(this).removeAttr("lcts-id"),lcts_orig_texts.splice(a(this).attr("lcts-id"),1))})}})(jQuery);