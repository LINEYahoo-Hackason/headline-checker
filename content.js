(()=>{var J=Math.min,$=Math.max,Q=Math.round;var D=t=>({x:t,y:t}),Vt={left:"right",right:"left",bottom:"top",top:"bottom"},Ut={start:"end",end:"start"};function ft(t,e,n){return $(t,J(e,n))}function ot(t,e){return typeof t=="function"?t(e):t}function H(t){return t.split("-")[0]}function it(t){return t.split("-")[1]}function ut(t){return t==="x"?"y":"x"}function dt(t){return t==="y"?"height":"width"}function _(t){return["top","bottom"].includes(H(t))?"y":"x"}function mt(t){return ut(_(t))}function wt(t,e,n){n===void 0&&(n=!1);let o=it(t),i=mt(t),r=dt(i),s=i==="x"?o===(n?"end":"start")?"right":"left":o==="start"?"bottom":"top";return e.reference[r]>e.floating[r]&&(s=K(s)),[s,K(s)]}function yt(t){let e=K(t);return[nt(t),e,nt(e)]}function nt(t){return t.replace(/start|end/g,e=>Ut[e])}function _t(t,e,n){let o=["left","right"],i=["right","left"],r=["top","bottom"],s=["bottom","top"];switch(t){case"top":case"bottom":return n?e?i:o:e?o:i;case"left":case"right":return e?r:s;default:return[]}}function vt(t,e,n,o){let i=it(t),r=_t(H(t),n==="start",o);return i&&(r=r.map(s=>s+"-"+i),e&&(r=r.concat(r.map(nt)))),r}function K(t){return t.replace(/left|right|bottom|top/g,e=>Vt[e])}function qt(t){return{top:0,right:0,bottom:0,left:0,...t}}function bt(t){return typeof t!="number"?qt(t):{top:t,right:t,bottom:t,left:t}}function z(t){let{x:e,y:n,width:o,height:i}=t;return{width:o,height:i,top:n,left:e,right:e+o,bottom:n+i,x:e,y:n}}function At(t,e,n){let{reference:o,floating:i}=t,r=_(e),s=mt(e),c=dt(s),l=H(e),d=r==="y",p=o.x+o.width/2-i.width/2,m=o.y+o.height/2-i.height/2,w=o[c]/2-i[c]/2,x;switch(l){case"top":x={x:p,y:o.y-i.height};break;case"bottom":x={x:p,y:o.y+o.height};break;case"right":x={x:o.x+o.width,y:m};break;case"left":x={x:o.x-i.width,y:m};break;default:x={x:o.x,y:o.y}}switch(it(e)){case"start":x[s]-=w*(n&&d?-1:1);break;case"end":x[s]+=w*(n&&d?-1:1);break}return x}var Ot=async(t,e,n)=>{let{placement:o="bottom",strategy:i="absolute",middleware:r=[],platform:s}=n,c=r.filter(Boolean),l=await(s.isRTL==null?void 0:s.isRTL(e)),d=await s.getElementRects({reference:t,floating:e,strategy:i}),{x:p,y:m}=At(d,o,l),w=o,x={},v=0;for(let b=0;b<c.length;b++){let{name:y,fn:L}=c[b],{x:O,y:C,data:T,reset:R}=await L({x:p,y:m,initialPlacement:o,placement:w,strategy:i,middlewareData:x,rects:d,platform:s,elements:{reference:t,floating:e}});p=O??p,m=C??m,x={...x,[y]:{...x[y],...T}},R&&v<=50&&(v++,typeof R=="object"&&(R.placement&&(w=R.placement),R.rects&&(d=R.rects===!0?await s.getElementRects({reference:t,floating:e,strategy:i}):R.rects),{x:p,y:m}=At(d,w,l)),b=-1)}return{x:p,y:m,placement:w,strategy:i,middlewareData:x}};async function gt(t,e){var n;e===void 0&&(e={});let{x:o,y:i,platform:r,rects:s,elements:c,strategy:l}=t,{boundary:d="clippingAncestors",rootBoundary:p="viewport",elementContext:m="floating",altBoundary:w=!1,padding:x=0}=ot(e,t),v=bt(x),y=c[w?m==="floating"?"reference":"floating":m],L=z(await r.getClippingRect({element:(n=await(r.isElement==null?void 0:r.isElement(y)))==null||n?y:y.contextElement||await(r.getDocumentElement==null?void 0:r.getDocumentElement(c.floating)),boundary:d,rootBoundary:p,strategy:l})),O=m==="floating"?{x:o,y:i,width:s.floating.width,height:s.floating.height}:s.reference,C=await(r.getOffsetParent==null?void 0:r.getOffsetParent(c.floating)),T=await(r.isElement==null?void 0:r.isElement(C))?await(r.getScale==null?void 0:r.getScale(C))||{x:1,y:1}:{x:1,y:1},R=z(r.convertOffsetParentRelativeRectToViewportRelativeRect?await r.convertOffsetParentRelativeRectToViewportRelativeRect({elements:c,rect:O,offsetParent:C,strategy:l}):O);return{top:(L.top-R.top+v.top)/T.y,bottom:(R.bottom-L.bottom+v.bottom)/T.y,left:(L.left-R.left+v.left)/T.x,right:(R.right-L.right+v.right)/T.x}}var Lt=function(t){return t===void 0&&(t={}),{name:"flip",options:t,async fn(e){var n,o;let{placement:i,middlewareData:r,rects:s,initialPlacement:c,platform:l,elements:d}=e,{mainAxis:p=!0,crossAxis:m=!0,fallbackPlacements:w,fallbackStrategy:x="bestFit",fallbackAxisSideDirection:v="none",flipAlignment:b=!0,...y}=ot(t,e);if((n=r.arrow)!=null&&n.alignmentOffset)return{};let L=H(i),O=_(c),C=H(c)===c,T=await(l.isRTL==null?void 0:l.isRTL(d.floating)),R=w||(C||!b?[K(c)]:yt(c)),f=v!=="none";!w&&f&&R.push(...vt(c,b,v,T));let a=[c,...R],u=await gt(e,y),g=[],A=((o=r.flip)==null?void 0:o.overflows)||[];if(p&&g.push(u[L]),m){let W=wt(i,s,T);g.push(u[W[0]],u[W[1]])}if(A=[...A,{placement:i,overflows:g}],!g.every(W=>W<=0)){var h,M;let W=(((h=r.flip)==null?void 0:h.index)||0)+1,xt=a[W];if(xt)return{data:{index:W,overflows:A},reset:{placement:xt}};let G=(M=A.filter(U=>U.overflows[0]<=0).sort((U,B)=>U.overflows[1]-B.overflows[1])[0])==null?void 0:M.placement;if(!G)switch(x){case"bestFit":{var Y;let U=(Y=A.filter(B=>{if(f){let I=_(B.placement);return I===O||I==="y"}return!0}).map(B=>[B.placement,B.overflows.filter(I=>I>0).reduce((I,jt)=>I+jt,0)]).sort((B,I)=>B[1]-I[1])[0])==null?void 0:Y[0];U&&(G=U);break}case"initialPlacement":G=c;break}if(i!==G)return{reset:{placement:G}}}return{}}}};var Ct=function(t){return t===void 0&&(t={}),{name:"shift",options:t,async fn(e){let{x:n,y:o,placement:i}=e,{mainAxis:r=!0,crossAxis:s=!1,limiter:c={fn:y=>{let{x:L,y:O}=y;return{x:L,y:O}}},...l}=ot(t,e),d={x:n,y:o},p=await gt(e,l),m=_(H(i)),w=ut(m),x=d[w],v=d[m];if(r){let y=w==="y"?"top":"left",L=w==="y"?"bottom":"right",O=x+p[y],C=x-p[L];x=ft(O,x,C)}if(s){let y=m==="y"?"top":"left",L=m==="y"?"bottom":"right",O=v+p[y],C=v-p[L];v=ft(O,v,C)}let b=c.fn({...e,[w]:x,[m]:v});return{...b,data:{x:b.x-n,y:b.y-o,enabled:{[w]:r,[m]:s}}}}}};function rt(){return typeof window<"u"}function j(t){return Tt(t)?(t.nodeName||"").toLowerCase():"#document"}function E(t){var e;return(t==null||(e=t.ownerDocument)==null?void 0:e.defaultView)||window}function N(t){var e;return(e=(Tt(t)?t.ownerDocument:t.document)||window.document)==null?void 0:e.documentElement}function Tt(t){return rt()?t instanceof Node||t instanceof E(t).Node:!1}function S(t){return rt()?t instanceof Element||t instanceof E(t).Element:!1}function k(t){return rt()?t instanceof HTMLElement||t instanceof E(t).HTMLElement:!1}function Rt(t){return!rt()||typeof ShadowRoot>"u"?!1:t instanceof ShadowRoot||t instanceof E(t).ShadowRoot}function q(t){let{overflow:e,overflowX:n,overflowY:o,display:i}=P(t);return/auto|scroll|overlay|hidden|clip/.test(e+o+n)&&!["inline","contents"].includes(i)}function Et(t){return["table","td","th"].includes(j(t))}function Z(t){return[":popover-open",":modal"].some(e=>{try{return t.matches(e)}catch{return!1}})}function ct(t){let e=lt(),n=S(t)?P(t):t;return["transform","translate","scale","rotate","perspective"].some(o=>n[o]?n[o]!=="none":!1)||(n.containerType?n.containerType!=="normal":!1)||!e&&(n.backdropFilter?n.backdropFilter!=="none":!1)||!e&&(n.filter?n.filter!=="none":!1)||["transform","translate","scale","rotate","perspective","filter"].some(o=>(n.willChange||"").includes(o))||["paint","layout","strict","content"].some(o=>(n.contain||"").includes(o))}function St(t){let e=F(t);for(;k(e)&&!V(e);){if(ct(e))return e;if(Z(e))return null;e=F(e)}return null}function lt(){return typeof CSS>"u"||!CSS.supports?!1:CSS.supports("-webkit-backdrop-filter","none")}function V(t){return["html","body","#document"].includes(j(t))}function P(t){return E(t).getComputedStyle(t)}function tt(t){return S(t)?{scrollLeft:t.scrollLeft,scrollTop:t.scrollTop}:{scrollLeft:t.scrollX,scrollTop:t.scrollY}}function F(t){if(j(t)==="html")return t;let e=t.assignedSlot||t.parentNode||Rt(t)&&t.host||N(t);return Rt(e)?e.host:e}function Pt(t){let e=F(t);return V(e)?t.ownerDocument?t.ownerDocument.body:t.body:k(e)&&q(e)?e:Pt(e)}function st(t,e,n){var o;e===void 0&&(e=[]),n===void 0&&(n=!0);let i=Pt(t),r=i===((o=t.ownerDocument)==null?void 0:o.body),s=E(i);if(r){let c=at(s);return e.concat(s,s.visualViewport||[],q(i)?i:[],c&&n?st(c):[])}return e.concat(i,st(i,[],n))}function at(t){return t.parent&&Object.getPrototypeOf(t.parent)?t.frameElement:null}function Nt(t){let e=P(t),n=parseFloat(e.width)||0,o=parseFloat(e.height)||0,i=k(t),r=i?t.offsetWidth:n,s=i?t.offsetHeight:o,c=Q(n)!==r||Q(o)!==s;return c&&(n=r,o=s),{width:n,height:o,$:c}}function Ft(t){return S(t)?t:t.contextElement}function X(t){let e=Ft(t);if(!k(e))return D(1);let n=e.getBoundingClientRect(),{width:o,height:i,$:r}=Nt(e),s=(r?Q(n.width):n.width)/o,c=(r?Q(n.height):n.height)/i;return(!s||!Number.isFinite(s))&&(s=1),(!c||!Number.isFinite(c))&&(c=1),{x:s,y:c}}var Xt=D(0);function Mt(t){let e=E(t);return!lt()||!e.visualViewport?Xt:{x:e.visualViewport.offsetLeft,y:e.visualViewport.offsetTop}}function Yt(t,e,n){return e===void 0&&(e=!1),!n||e&&n!==E(t)?!1:e}function et(t,e,n,o){e===void 0&&(e=!1),n===void 0&&(n=!1);let i=t.getBoundingClientRect(),r=Ft(t),s=D(1);e&&(o?S(o)&&(s=X(o)):s=X(t));let c=Yt(r,n,o)?Mt(r):D(0),l=(i.left+c.x)/s.x,d=(i.top+c.y)/s.y,p=i.width/s.x,m=i.height/s.y;if(r){let w=E(r),x=o&&S(o)?E(o):o,v=w,b=at(v);for(;b&&o&&x!==v;){let y=X(b),L=b.getBoundingClientRect(),O=P(b),C=L.left+(b.clientLeft+parseFloat(O.paddingLeft))*y.x,T=L.top+(b.clientTop+parseFloat(O.paddingTop))*y.y;l*=y.x,d*=y.y,p*=y.x,m*=y.y,l+=C,d+=T,v=E(b),b=at(v)}}return z({width:p,height:m,x:l,y:d})}function pt(t,e){let n=tt(t).scrollLeft;return e?e.left+n:et(N(t)).left+n}function Bt(t,e,n){n===void 0&&(n=!1);let o=t.getBoundingClientRect(),i=o.left+e.scrollLeft-(n?0:pt(t,o)),r=o.top+e.scrollTop;return{x:i,y:r}}function Gt(t){let{elements:e,rect:n,offsetParent:o,strategy:i}=t,r=i==="fixed",s=N(o),c=e?Z(e.floating):!1;if(o===s||c&&r)return n;let l={scrollLeft:0,scrollTop:0},d=D(1),p=D(0),m=k(o);if((m||!m&&!r)&&((j(o)!=="body"||q(s))&&(l=tt(o)),k(o))){let x=et(o);d=X(o),p.x=x.x+o.clientLeft,p.y=x.y+o.clientTop}let w=s&&!m&&!r?Bt(s,l,!0):D(0);return{width:n.width*d.x,height:n.height*d.y,x:n.x*d.x-l.scrollLeft*d.x+p.x+w.x,y:n.y*d.y-l.scrollTop*d.y+p.y+w.y}}function Kt(t){return Array.from(t.getClientRects())}function Jt(t){let e=N(t),n=tt(t),o=t.ownerDocument.body,i=$(e.scrollWidth,e.clientWidth,o.scrollWidth,o.clientWidth),r=$(e.scrollHeight,e.clientHeight,o.scrollHeight,o.clientHeight),s=-n.scrollLeft+pt(t),c=-n.scrollTop;return P(o).direction==="rtl"&&(s+=$(e.clientWidth,o.clientWidth)-i),{width:i,height:r,x:s,y:c}}function Qt(t,e){let n=E(t),o=N(t),i=n.visualViewport,r=o.clientWidth,s=o.clientHeight,c=0,l=0;if(i){r=i.width,s=i.height;let d=lt();(!d||d&&e==="fixed")&&(c=i.offsetLeft,l=i.offsetTop)}return{width:r,height:s,x:c,y:l}}function Zt(t,e){let n=et(t,!0,e==="fixed"),o=n.top+t.clientTop,i=n.left+t.clientLeft,r=k(t)?X(t):D(1),s=t.clientWidth*r.x,c=t.clientHeight*r.y,l=i*r.x,d=o*r.y;return{width:s,height:c,x:l,y:d}}function Dt(t,e,n){let o;if(e==="viewport")o=Qt(t,n);else if(e==="document")o=Jt(N(t));else if(S(e))o=Zt(e,n);else{let i=Mt(t);o={x:e.x-i.x,y:e.y-i.y,width:e.width,height:e.height}}return z(o)}function It(t,e){let n=F(t);return n===e||!S(n)||V(n)?!1:P(n).position==="fixed"||It(n,e)}function te(t,e){let n=e.get(t);if(n)return n;let o=st(t,[],!1).filter(c=>S(c)&&j(c)!=="body"),i=null,r=P(t).position==="fixed",s=r?F(t):t;for(;S(s)&&!V(s);){let c=P(s),l=ct(s);!l&&c.position==="fixed"&&(i=null),(r?!l&&!i:!l&&c.position==="static"&&!!i&&["absolute","fixed"].includes(i.position)||q(s)&&!l&&It(t,s))?o=o.filter(p=>p!==s):i=c,s=F(s)}return e.set(t,o),o}function ee(t){let{element:e,boundary:n,rootBoundary:o,strategy:i}=t,s=[...n==="clippingAncestors"?Z(e)?[]:te(e,this._c):[].concat(n),o],c=s[0],l=s.reduce((d,p)=>{let m=Dt(e,p,i);return d.top=$(m.top,d.top),d.right=J(m.right,d.right),d.bottom=J(m.bottom,d.bottom),d.left=$(m.left,d.left),d},Dt(e,c,i));return{width:l.right-l.left,height:l.bottom-l.top,x:l.left,y:l.top}}function ne(t){let{width:e,height:n}=Nt(t);return{width:e,height:n}}function oe(t,e,n){let o=k(e),i=N(e),r=n==="fixed",s=et(t,!0,r,e),c={scrollLeft:0,scrollTop:0},l=D(0);if(o||!o&&!r)if((j(e)!=="body"||q(i))&&(c=tt(e)),o){let w=et(e,!0,r,e);l.x=w.x+e.clientLeft,l.y=w.y+e.clientTop}else i&&(l.x=pt(i));let d=i&&!o&&!r?Bt(i,c):D(0),p=s.left+c.scrollLeft-l.x-d.x,m=s.top+c.scrollTop-l.y-d.y;return{x:p,y:m,width:s.width,height:s.height}}function ht(t){return P(t).position==="static"}function kt(t,e){if(!k(t)||P(t).position==="fixed")return null;if(e)return e(t);let n=t.offsetParent;return N(t)===n&&(n=n.ownerDocument.body),n}function $t(t,e){let n=E(t);if(Z(t))return n;if(!k(t)){let i=F(t);for(;i&&!V(i);){if(S(i)&&!ht(i))return i;i=F(i)}return n}let o=kt(t,e);for(;o&&Et(o)&&ht(o);)o=kt(o,e);return o&&V(o)&&ht(o)&&!ct(o)?n:o||St(t)||n}var ie=async function(t){let e=this.getOffsetParent||$t,n=this.getDimensions,o=await n(t.floating);return{reference:oe(t.reference,await e(t.floating),t.strategy),floating:{x:0,y:0,width:o.width,height:o.height}}};function se(t){return P(t).direction==="rtl"}var re={convertOffsetParentRelativeRectToViewportRelativeRect:Gt,getDocumentElement:N,getClippingRect:ee,getOffsetParent:$t,getElementRects:ie,getClientRects:Kt,getDimensions:ne,getScale:X,isElement:S,isRTL:se};var Wt=Ct,Ht=Lt;var zt=(t,e,n)=>{let o=new Map,i={platform:re,...n},r={...i.platform,_c:o};return Ot(t,e,{...i,platform:r})};(function(){console.log("\u2705 content.js \u304C\u5B9F\u884C\u3055\u308C\u307E\u3057\u305F");let t="https://www.goo.ne.jp",e="https://news.goo.ne.jp/",n={DEFAULT:"default",CLOSE:"close",LOADING:"loading"},o=null,i=!1,r=-1,s=new Map,c=new Set;function l(f,a){let g={[n.DEFAULT]:{text:"\xA0",backgroundImage:"none",classAction:"remove"},[n.CLOSE]:{text:"\u2716",backgroundImage:"none",classAction:"remove"},[n.LOADING]:{text:"\xA0",backgroundImage:`url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23ffffff"><circle cx="50" cy="50" r="40" stroke="%23ffffff" stroke-width="10" fill="none" stroke-dasharray="200" stroke-dashoffset="0"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1s" repeatCount="indefinite"/></circle></svg>')`,classAction:"add",additionalStyles:{backgroundRepeat:"no-repeat",backgroundPosition:"center",backgroundSize:"contain"}}}[a];if(!g)return;f.innerText=g.text,f.style.backgroundImage=g.backgroundImage,f.dataset.state=a,f.classList[g.classAction]("loading"),g.additionalStyles&&Object.assign(f.style,g.additionalStyles);let A=f.dataset.url;if(A){let h=s.get(A)||{};s.set(A,{...h,state:a})}a===n.LOADING?c.add(f.dataset.url):c.delete(f.dataset.url)}function d(f,a){let u=document.createElement("button");Object.assign(u.style,{position:"absolute",backgroundColor:"#4a8a57",color:"#ffffff",padding:"2px 8px",borderRadius:"4px",fontSize:"14px",lineHeight:"1",height:"auto",zIndex:"1000",whiteSpace:"nowrap",cursor:"pointer",boxShadow:"0px 4px 6px rgba(0, 0, 0, 0.1)"}),u.className="tooltip",u.innerText=f,u.dataset.popupButton="headline-check-open-popup-button";let g=p(a);if(u.dataset.url=g,g){let A=s.get(g);c.has(g)?l(u,n.LOADING):A&&A.state===n.CLOSE?l(u,n.CLOSE):l(u,n.DEFAULT)}else l(u,n.DEFAULT);return u.addEventListener("click",A=>m(A,u,a)),u.addEventListener("mouseenter",()=>i=!0),u.addEventListener("mouseleave",()=>w(u)),u}function p(f){if(f.tagName==="A")return f.href;let a=f.querySelector("a");if(a)return a.href;let u=f.closest("a");return u?u.href:null}function m(f,a,u){f.stopPropagation(),f.preventDefault();let g=a.dataset.url;if(!g){console.error("\u8A18\u4E8BURL\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");return}if(a.dataset.state===n.CLOSE){b(u),l(a,n.DEFAULT);return}if(c.has(g)){console.log("\u26A0\uFE0F \u73FE\u5728\u30ED\u30FC\u30C7\u30A3\u30F3\u30B0\u4E2D\u3067\u3059\u3002");return}l(a,n.LOADING),v(g,u,a).finally(()=>{a.dataset.state===n.LOADING&&l(a,n.DEFAULT)})}function w(f){!i&&f.dataset.state!==n.LOADING?(O(f),o=null):i=!1}function x(f,a){zt(f,a,{placement:"right",middleware:[Wt(),Ht()]}).then(({x:u,y:g})=>{Object.assign(a.style,{left:`${u-20}px`,top:`${g}px`})})}function v(f,a,u){return new Promise((g,A)=>{if(s.has(f)){let h=s.get(f);if(h&&h.data){y(h.data,a,u),l(u,n.CLOSE),g();return}}fetch("http://localhost:8000/headline",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:f})}).then(h=>{if(!h.ok)throw new Error(`HTTP\u30A8\u30E9\u30FC: ${h.status}`);return h.json()}).then(h=>{if(!h||typeof h!="object"||!h.headline)throw new Error("\u4E0D\u6B63\u306A\u30C7\u30FC\u30BF\u5F62\u5F0F\u304C\u8FD4\u3055\u308C\u307E\u3057\u305F");s.set(f,{data:h,state:n.CLOSE}),y(h,a,u),l(u,n.CLOSE),g()}).catch(h=>{console.error("\u26A0\uFE0F \u8A18\u4E8B\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",h),l(u,n.DEFAULT),A(h)})})}function b(f){let a=f.querySelector(".overlay");a&&a.remove();let u=p(f);if(u){let g=s.get(u)||{};s.set(u,{...g,state:n.DEFAULT})}}function y(f,a,u){if(!f||!f.headline){console.error("\u26A0\uFE0F \u30C7\u30FC\u30BF\u304C\u7121\u52B9\u3067\u3059\u3002",f);return}let g=a.closest("li");if(!g){console.error("\u89AA<li>\u8981\u7D20\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");return}let A=g.offsetWidth,h=document.createElement("div");h.className="overlay",h.innerText=`\u{1F4A1} ${f.headline}`,Object.assign(h.style,{position:"absolute",bottom:"calc(100% + 10px)",left:"50%",transform:"translateX(-50%)",width:`${A}px`,backgroundColor:"rgba(230, 244, 234, 0.6)",color:"#000",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",boxShadow:"rgba(0, 0, 0, 0.1) 0px 4px 6px,0 0 0 1px #4a8a57",borderRadius:"8px",padding:"8px",zIndex:"1000",pointerEvents:"none",textAlign:"center"});let M=document.createElement("div");Object.assign(M.style,{content:'""',position:"absolute",bottom:"-10px",left:"50%",transform:"translateX(-50%)",width:"0",height:"0",borderLeft:"10px solid transparent",borderRight:"10px solid transparent",borderTop:"10px solid #4a8a57",zIndex:"999"});let Y=document.createElement("div");Object.assign(Y.style,{content:'""',position:"absolute",bottom:"-8px",left:"50%",transform:"translateX(-50%)",width:"0",height:"0",borderLeft:"8px solid transparent",borderRight:"8px solid transparent",borderTop:"8px solid rgba(230, 244, 234, 0.9)",zIndex:"1000"}),h.appendChild(M),h.appendChild(Y),g.style.position="relative",g.appendChild(h),l(u,n.CLOSE)}if(!new RegExp("^"+t).test(location.href)){console.log("\u26A0\uFE0F \u3053\u306E\u30DA\u30FC\u30B8\u306F\u5BFE\u8C61\u5916\u3067\u3059\u3002");return}function O(f){f&&f.parentNode&&f.parentNode.removeChild(f)}function C(f){let a=f.length;a!==r&&(console.log(`\u{1F7E1} \u898B\u51FA\u3057\u30EA\u30F3\u30AF\u6570\uFF1A${a} \u4EF6`),r=a)}function T(){let f=Array.from(document.querySelectorAll("ul > li")).filter(a=>{let u=a.querySelector("a");return u&&u.href.startsWith(e)});C(f),f.forEach(a=>{a.dataset.tooltipInitialized||(a.dataset.tooltipInitialized="true",a.addEventListener("mouseenter",()=>{let u="\xA0";o&&(O(o),o=null);let g=d(u,a);o=g,document.body.appendChild(g),x(a,g);let A=a.closest("li");A&&(A.style.overflow="visible");let h=null;if(a.tagName==="A")h=a.href;else if(a.querySelector("a"))h=a.querySelector("a").href;else{let M=a.closest("a");M&&(h=M.href)}h&&c.has(h)&&(l(g,n.DEFAULT),c.delete(h))}),a.addEventListener("mouseleave",()=>{!i&&o&&(O(o),o=null)}))})}new MutationObserver(f=>{f.forEach(a=>{if(a.type==="attributes"&&a.attributeName==="class"){let u=a.target;u.classList.contains("active")&&(console.log(`\u{1F7E2} Active\u30AF\u30E9\u30B9\u304C\u5909\u66F4\u3055\u308C\u307E\u3057\u305F: ${u.id}`),T())}a.type==="childList"&&a.addedNodes.length>0&&T()})}).observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class"]}),T()})();})();
//# sourceMappingURL=content.js.map
