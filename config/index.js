System.register("chunks:///_virtual/config",["./ImageScreenLogic.ts"],(function(){return{setters:[null],execute:function(){}}}));

System.register("chunks:///_virtual/ImageScreenLogic.ts",["./rollupPluginModLoBabelHelpers.js","cc"],(function(e){var t,r,c,i,n,o;return{setters:[function(e){t=e.applyDecoratedDescriptor,r=e.initializerDefineProperty},function(e){c=e.cclegacy,i=e.Label,n=e._decorator,o=e.Component}],execute:function(){var l,s,a,u,g;c._RF.push({},"6667fyT11lFCIcgdtu6EGsC","ImageScreenLogic",void 0);const{ccclass:p,property:b}=n;e("ImageScreenLogic",(l=p("ImageScreenLogic"),s=b(i),l((g=t((u=class extends o{constructor(...e){super(...e),r(this,"label",g,this)}start(){this.label&&(this.label.string="This text is set by remote logic!")}}).prototype,"label",[s],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),a=u))||a));c._RF.pop()}}}));

(function(r) {
  r('virtual:///prerequisite-imports/config', 'chunks:///_virtual/config'); 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});