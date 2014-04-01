(function () {
    'use strict';
    var list = require('texo'), range = list.range, mix = function (parent, child) {
            var key;
            var obj = {};
            for (key in parent) {
                obj[key] = parent[key];
            }
            for (key in child) {
                obj[key] = child[key];
            }
            return obj;
        }, type = function (val) {
            return val === null ? 'null' : typeof val;
        };
    var msg, chars, decoded;
    msg = 'Etvmp$Jsspw%%%%[e}$xs$ks%$]sy$lezi$wspzih$xli$lmhhir$qiwweki2$Rs{$mx$mw$}syv$xyvr$xs$nsmrmr$sr$xlmw$tvero2$Hs$rsx$tswx$er}xlmrk$xlex${mpp$kmzi$e{e}$xlmw$qiwweki2$Pixtistpi$higshi$xli$qiwweki$sr$xlimv$s{r$erh$vieh$xlmw$qiwweki2$]sy$ger$tpe}$epsrkf}$RSX$tswxmrk$ls{$}sy$higshih$xlmw$qiwweki2$Mrwxieh$tswx$}syv$wspyxmsr$xs$fi$}syvjezsvmxi$Lipps${svph$tvskveq$mr$sri$perkyeki$sj$}syv$glsmgi2$Qeoi$wyvi$}syv$tvskveq$we}w$&Lipps$[svph%%%&${mxl$7$%$ex$xli$irh2$Xlmw${e}tistpi$fvs{wmrk$xli$gleppirki${mpp$xlmro${i$lezi$epp$pswx$syv$qmrhw2$Xlswi${ls$tswx$lipps{svph$wspyxmsrw${mxlsyx$xli$xlvii$%%%${mpp$lezi$rsx$higshih$xli$qiwweki$erh$ws$}sy$ger$tspmxip}$tsmrx$syx$xlimv$wspyxmsr$mw$mr$ivvsv$,xli}$evi$nywx$jspps{mrk$epsrk${mxlsyx$ors{mrk-Irns}$xlmw$jyr2$Xli$xvyxl${mpp$fi$liph$f}$xlswi${ls$ger$higshi$xli$qiwweki2$>-';
    chars = msg.split('');
    decoded = chars.map(function (x) {
        return String.fromCharCode(x.charCodeAt(0) - 4);
    });
    return console.log(decoded.join(''));
}());