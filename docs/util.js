var util=function(){return{hslToRgb:function(a,d,b){function c(b,c,a){0>a&&(a+=1);1<a&&--a;return a<1/6?b+6*(c-b)*a:.5>a?c:a<2/3?b+(c-b)*(2/3-a)*6:b}if(0==d)b=d=a=b;else{var e=.5>b?b*(1+d):b+d-b*d,f=2*b-e;b=c(f,e,a+1/3);d=c(f,e,a);a=c(f,e,a-1/3)}return[Math.floor(255*b),Math.floor(255*d),Math.floor(255*a)]},filterNonUuid:function(a){var d="";if(void 0!=a)for(var b=0;b<a.length;b++){var c=a.charAt(b);if("a"<=c&&"z">=c||"A"<=c&&"Z">=c||"0"<=c&&"9">=c||"-"==c)d+=c}return d}}}();