function t(t,e,i,s){var r,n=arguments.length,o=n<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(o=(n<3?r(o):n>3?r(e,i,o):r(e,i))||o);return n>3&&o&&Object.defineProperty(e,i,o),o}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),r=new WeakMap;let n=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=r.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&r.set(e,t))}return t}toString(){return this.cssText}};const o=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new n(i,t,s)},a=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new n("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:c,defineProperty:l,getOwnPropertyDescriptor:d,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,_=globalThis,f=_.trustedTypes,g=f?f.emptyScript:"",m=_.reactiveElementPolyfillSupport,v=(t,e)=>t,b={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},$=(t,e)=>!c(t,e),w={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:$};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),_.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=w){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&l(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:r}=d(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const n=s?.call(this);r?.call(this,e),this.requestUpdate(t,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??w}static _$Ei(){if(this.hasOwnProperty(v("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(v("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(v("properties"))){const t=this.properties,e=[...h(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),r=e.litNonce;void 0!==r&&s.setAttribute("nonce",r),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(e,i.type);this._$Em=t,null==r?this.removeAttribute(s):this.setAttribute(s,r),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:b;this._$Em=s;const n=r.fromAttribute(e,t.type);this[s]=n??this._$Ej?.get(s)??n,this._$Em=null}}requestUpdate(t,e,i,s=!1,r){if(void 0!==t){const n=this.constructor;if(!1===s&&(r=this[t]),i??=n.getPropertyOptions(t),!((i.hasChanged??$)(r,e)||i.useDefault&&i.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(n._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:r},n){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),!0!==r||void 0!==n)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[v("elementProperties")]=new Map,x[v("finalized")]=new Map,m?.({ReactiveElement:x}),(_.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const y=globalThis,S=t=>t,A=y.trustedTypes,C=A?A.createPolicy("lit-html",{createHTML:t=>t}):void 0,k="$lit$",E=`lit$${Math.random().toFixed(9).slice(2)}$`,O="?"+E,P=`<${O}>`,M=document,T=()=>M.createComment(""),N=t=>null===t||"object"!=typeof t&&"function"!=typeof t,D=Array.isArray,U="[ \t\n\f\r]",L=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,H=/-->/g,R=/>/g,z=RegExp(`>|${U}(?:([^\\s"'>=/]+)(${U}*=${U}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),B=/'/g,j=/"/g,I=/^(?:script|style|textarea|title)$/i,F=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),V=F(1),W=F(2),K=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),G=new WeakMap,X=M.createTreeWalker(M,129);function Z(t,e){if(!D(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==C?C.createHTML(e):e}const J=(t,e)=>{const i=t.length-1,s=[];let r,n=2===e?"<svg>":3===e?"<math>":"",o=L;for(let e=0;e<i;e++){const i=t[e];let a,c,l=-1,d=0;for(;d<i.length&&(o.lastIndex=d,c=o.exec(i),null!==c);)d=o.lastIndex,o===L?"!--"===c[1]?o=H:void 0!==c[1]?o=R:void 0!==c[2]?(I.test(c[2])&&(r=RegExp("</"+c[2],"g")),o=z):void 0!==c[3]&&(o=z):o===z?">"===c[0]?(o=r??L,l=-1):void 0===c[1]?l=-2:(l=o.lastIndex-c[2].length,a=c[1],o=void 0===c[3]?z:'"'===c[3]?j:B):o===j||o===B?o=z:o===H||o===R?o=L:(o=z,r=void 0);const h=o===z&&t[e+1].startsWith("/>")?" ":"";n+=o===L?i+P:l>=0?(s.push(a),i.slice(0,l)+k+i.slice(l)+E+h):i+E+(-2===l?e:h)}return[Z(t,n+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Y{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let r=0,n=0;const o=t.length-1,a=this.parts,[c,l]=J(t,e);if(this.el=Y.createElement(c,i),X.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=X.nextNode())&&a.length<o;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(k)){const e=l[n++],i=s.getAttribute(t).split(E),o=/([.?@])?(.*)/.exec(e);a.push({type:1,index:r,name:o[2],strings:i,ctor:"."===o[1]?st:"?"===o[1]?rt:"@"===o[1]?nt:it}),s.removeAttribute(t)}else t.startsWith(E)&&(a.push({type:6,index:r}),s.removeAttribute(t));if(I.test(s.tagName)){const t=s.textContent.split(E),e=t.length-1;if(e>0){s.textContent=A?A.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],T()),X.nextNode(),a.push({type:2,index:++r});s.append(t[e],T())}}}else if(8===s.nodeType)if(s.data===O)a.push({type:2,index:r});else{let t=-1;for(;-1!==(t=s.data.indexOf(E,t+1));)a.push({type:7,index:r}),t+=E.length-1}r++}}static createElement(t,e){const i=M.createElement("template");return i.innerHTML=t,i}}function Q(t,e,i=t,s){if(e===K)return e;let r=void 0!==s?i._$Co?.[s]:i._$Cl;const n=N(e)?void 0:e._$litDirective$;return r?.constructor!==n&&(r?._$AO?.(!1),void 0===n?r=void 0:(r=new n(t),r._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=r:i._$Cl=r),void 0!==r&&(e=Q(t,r._$AS(t,e.values),r,s)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??M).importNode(e,!0);X.currentNode=s;let r=X.nextNode(),n=0,o=0,a=i[0];for(;void 0!==a;){if(n===a.index){let e;2===a.type?e=new et(r,r.nextSibling,this,t):1===a.type?e=new a.ctor(r,a.name,a.strings,this,t):6===a.type&&(e=new ot(r,this,t)),this._$AV.push(e),a=i[++o]}n!==a?.index&&(r=X.nextNode(),n++)}return X.currentNode=M,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),N(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==K&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>D(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&N(this._$AH)?this._$AA.nextSibling.data=t:this.T(M.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Y.createElement(Z(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new tt(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=G.get(t.strings);return void 0===e&&G.set(t.strings,e=new Y(t)),e}k(t){D(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const r of t)s===e.length?e.push(i=new et(this.O(T()),this.O(T()),this,this.options)):i=e[s],i._$AI(r),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=S(t).nextSibling;S(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class it{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,r){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=q}_$AI(t,e=this,i,s){const r=this.strings;let n=!1;if(void 0===r)t=Q(this,t,e,0),n=!N(t)||t!==this._$AH&&t!==K,n&&(this._$AH=t);else{const s=t;let o,a;for(t=r[0],o=0;o<r.length-1;o++)a=Q(this,s[i+o],e,o),a===K&&(a=this._$AH[o]),n||=!N(a)||a!==this._$AH[o],a===q?t=q:t!==q&&(t+=(a??"")+r[o+1]),this._$AH[o]=a}n&&!s&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class st extends it{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class rt extends it{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class nt extends it{constructor(t,e,i,s,r){super(t,e,i,s,r),this.type=5}_$AI(t,e=this){if((t=Q(this,t,e,0)??q)===K)return;const i=this._$AH,s=t===q&&i!==q||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,r=t!==q&&(i===q||s);s&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class ot{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const at=y.litHtmlPolyfillSupport;at?.(Y,et),(y.litHtmlVersions??=[]).push("3.3.3");const ct=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let lt=class extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let r=s._$litPart$;if(void 0===r){const t=i?.renderBefore??null;s._$litPart$=r=new et(e.insertBefore(T(),t),t,void 0,i??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return K}};lt._$litElement$=!0,lt.finalized=!0,ct.litElementHydrateSupport?.({LitElement:lt});const dt=ct.litElementPolyfillSupport;dt?.({LitElement:lt}),(ct.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ht={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:$},pt=(t=ht,e,i)=>{const{kind:s,metadata:r}=i;let n=globalThis.litPropertyMetadata.get(r);if(void 0===n&&globalThis.litPropertyMetadata.set(r,n=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),n.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const r=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,r,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const r=this[s];e.call(this,i),this.requestUpdate(s,r,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function ut(t){return(e,i)=>"object"==typeof i?pt(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function _t(t){return ut({...t,state:!0,attribute:!1})}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ft=1,gt=3,mt=4;class vt{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const bt={},$t=(t=>(...e)=>({_$litDirective$:t,values:e}))(class extends vt{constructor(t){if(super(t),t.type!==gt&&t.type!==ft&&t.type!==mt)throw Error("The `live` directive is not allowed on child or event bindings");if(!(t=>void 0===t.strings)(t))throw Error("`live` bindings can only contain a single expression")}render(t){return t}update(t,[e]){if(e===K||e===q)return e;const i=t.element,s=t.name;if(t.type===gt){if(e===i[s])return K}else if(t.type===mt){if(!!e===i.hasAttribute(s))return K}else if(t.type===ft&&i.getAttribute(s)===e+"")return K;return((t,e=bt)=>{t._$AH=e;
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */})(t),e}});const wt={en:{card:{name_default:"Ceiling fan",subtitle:"Connected fan",unavailable:"Unavailable",entity_not_found:"Entity {entity} not found",not_bridge:"{entity} is not a FanBridge fan. Pick a fan created by the FanBridge integration.",fallback_badge:"Backup"},speed:{label:"SPEED",off:"Off",s1:"Gentle",s2:"Soft",s3:"Moderate",s4:"Normal",s5:"Strong",s6:"Turbo",state_off:"Off",state_on:"On",state_s1:"Speed 1 — Gentle",state_s2:"Speed 2 — Soft",state_s3:"Speed 3 — Moderate",state_s4:"Speed 4 — Normal",state_s5:"Speed 5 — Strong",state_s6:"Speed 6 — Turbo",generic:"Speed {speed}",state_generic:"Speed {speed}"},controls:{light:"Light",color_temp:"Color temperature",temp_warm:"Warm",temp_cool:"Cool",direction:"Season",dir_summer:"Summer",dir_winter:"Winter",timer:"Timer",timer_none:"None",sound:"Sound beep",preset:"Preset mode",power:"Power",oscillate:"Oscillation",dir_caption:"Blade direction",dir_summer_hint:"Air pushed down",dir_winter_hint:"Air pulled up"},editor:{title:"Fan card settings",name:"Card name",fan_entity:"Fan entity",show_name:"Show card name",summer_direction:"Rotation direction for summer mode",dir_forward:"Normal",dir_reverse:"Reverse",managed:"Managed by the FanBridge integration: backup fan, light, timer, beep and speed percentages are set in its Configure dialog.",light_independent:"Light works while the fan is off",standalone:"Pick a fan created by the FanBridge integration (Settings → Devices & services → FanBridge). Its backup, light, timer and beep are set in the integration's Configure dialog."}},fr:{card:{name_default:"Ventilateur plafond",subtitle:"Ventilateur connecté",unavailable:"Indisponible",entity_not_found:"Entité {entity} introuvable",not_bridge:"{entity} n'est pas un ventilateur FanBridge. Choisissez un ventilateur créé par l'intégration FanBridge.",fallback_badge:"Secours"},speed:{label:"VITESSE",off:"Arrêt",s1:"Très doux",s2:"Doux",s3:"Modéré",s4:"Moyen",s5:"Fort",s6:"Turbo",state_off:"Éteint",state_on:"Allumé",state_s1:"Vitesse 1 — Très doux",state_s2:"Vitesse 2 — Doux",state_s3:"Vitesse 3 — Modéré",state_s4:"Vitesse 4 — Moyen",state_s5:"Vitesse 5 — Fort",state_s6:"Vitesse 6 — Turbo",generic:"Vitesse {speed}",state_generic:"Vitesse {speed}"},controls:{light:"Lumière",color_temp:"Température de couleur",temp_warm:"Chaud",temp_cool:"Froid",direction:"Saison",dir_summer:"Été",dir_winter:"Hiver",timer:"Minuterie",timer_none:"Aucune",sound:"Bip sonore",preset:"Mode préréglé",power:"Marche / Arrêt",oscillate:"Oscillation",dir_caption:"Sens des pales",dir_summer_hint:"Air poussé vers le bas",dir_winter_hint:"Air brassé vers le plafond"},editor:{title:"Paramètres de la carte ventilateur",name:"Nom de la carte",fan_entity:"Entité ventilateur",show_name:"Afficher le nom de la carte",summer_direction:"Sens de rotation en mode été",dir_forward:"Normal",dir_reverse:"Inverse",managed:"Géré par l'intégration FanBridge : ventilateur de secours, lumière, minuterie, bip et pourcentages des vitesses se règlent dans son bouton Configurer.",light_independent:"Lumière utilisable ventilateur éteint",standalone:"Choisis un ventilateur créé par l'intégration FanBridge (Paramètres → Appareils et services → FanBridge). Son secours, sa lumière, sa minuterie et son bip se règlent dans le bouton Configurer de l'intégration."}}};function xt(t,e){const i=e.indexOf("."),s=e.slice(0,i),r=e.slice(i+1),n=t[s];return"object"==typeof n?n[r]:void 0}function yt(t,e,i={}){const s=xt(wt[function(t){const e=(t?.locale?.language??t?.language??"en").toLowerCase().split("-")[0];return e in wt?e:"en"}(t)],e)??xt(wt.en,e)??e;return s.replace(/\{(\w+)\}/g,(t,e)=>e in i?String(i[e]):t)}const St=["light","timer","sound"],At=[0,15,30,60,120,240,480];function Ct(t,e=6){return t<=0?0:Math.min(100,Math.floor(100*t/e))}const kt=new Set(["off","unavailable","unknown"]),Et=new Set(["unavailable","unknown"]);function Ot(t){return void 0!==t&&!kt.has(t.state)}function Pt(t){return void 0!==t&&Et.has(t.state)}const Mt=1,Tt=2,Nt=4,Dt=8,Ut=16,Lt=32;function Ht(t,e){return 0!==(Number(t?.attributes?.supported_features??0)&e)}function Rt(t){return Ht(t,Nt)}const zt="fan_bridge";function Bt(t,e){if(!e)return!1;const i=t?.entities?.[e];return i?i.platform===zt:"boolean"==typeof t?.states?.[e]?.attributes?.using_backup}function jt(t,e){const i={fan:e.fan_entity},s=t?.entities,r=s?.[e.fan_entity]?.device_id;if(!s||!r)return i;for(const t of Object.values(s)){if(t.device_id!==r||t.platform!==zt)continue;const e=t.translation_key;e&&St.includes(e)&&!i[e]&&(i[e]=t.entity_id)}return i}class It extends lt{constructor(){super(...arguments),this._computeLabel=t=>{const e={fan_entity:"editor.fan_entity",name:"editor.name",show_name:"editor.show_name",summer_direction:"editor.summer_direction",light_independent:"editor.light_independent"};return e[t.name]?this._t(e[t.name]):t.name}}connectedCallback(){super.connectedCallback(),this.hass&&(customElements.get("ha-form")||customElements.get("hui-button-card")?.getConfigElement?.(),customElements.get("ha-entity-picker")||customElements.get("hui-entities-card")?.getConfigElement?.())}setConfig(t){this._config={...t}}get _managed(){return Bt(this.hass,this._config?.fan_entity)}get _schema(){const t=[{name:"fan_entity",required:!0,selector:{entity:{domain:"fan"}}},{name:"name",selector:{text:{}}},{name:"show_name",selector:{boolean:{}}},{name:"light_independent",selector:{boolean:{}}}];return Rt(this.hass?.states?.[this._config?.fan_entity])&&t.push(this._directionField()),t}_directionField(){return{name:"summer_direction",selector:{select:{mode:"list",options:[{value:"forward",label:this._t("editor.dir_forward")},{value:"reverse",label:this._t("editor.dir_reverse")}]}}}}_t(t){return yt(this.hass,t)}_valueChanged(t){var e,i,s;e=this,i="config-changed",s={config:{...t.detail.value}},e.dispatchEvent(new CustomEvent(i,{bubbles:!0,composed:!0,detail:s}))}render(){return this.hass&&this._config?V`
      <div class="note">${this._t(this._managed?"editor.managed":"editor.standalone")}</div>
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${this._schema}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `:V``}}It.styles=o`
    ha-form {
      width: 100%;
    }
    .note {
      margin-bottom: 12px;
      padding: 12px;
      border-radius: 8px;
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
      font-size: 13px;
    }
  `,t([ut({attribute:!1})],It.prototype,"hass",void 0),t([_t()],It.prototype,"_config",void 0),customElements.get("fan-bridge-card-editor")||customElements.define("fan-bridge-card-editor",It);class Ft extends lt{constructor(){super(...arguments),this._tempOpen=!1}static getStubConfig(t,e=[]){return{fan_entity:e.find(t=>t.startsWith("fan."))??Object.keys(t?.states??{}).find(t=>t.startsWith("fan."))??"fan.ceiling_fan_with_light",show_name:!0}}static getConfigElement(){return document.createElement("fan-bridge-card-editor")}getCardSize(){let t=3;return!1!==this._config?.show_name&&(t+=1),this._fanState&&!this._fanSupportsSpeed||(t+=1),this._showColorTemp&&(t+=1),t}getGridOptions(){return{columns:12,rows:"auto",min_columns:6}}setConfig(t){if(!t?.fan_entity)throw new Error("fan_entity is required.");this._config={show_name:!0,summer_direction:"forward",...t}}_t(t,e){return yt(this.hass,t,e)}get _entities(){return this._resolved??jt(this.hass,this._config)}_trackedIds(t){return[t.fan,t.light,t.timer,t.sound].filter(t=>!!t)}shouldUpdate(t){if(!this._config)return!1;if([...t.keys()].some(t=>"hass"!==t))return!0;const e=t.get("hass");return!(e&&this.hass&&this._resolved)||(e.language!==this.hass.language||e.locale?.language!==this.hass.locale?.language||(this.hass.entities!==this._resolvedFor||this._trackedIds(this._resolved).some(t=>e.states?.[t]!==this.hass.states?.[t])))}willUpdate(t){!t.has("_config")&&this._resolved&&this.hass?.entities===this._resolvedFor||(this._resolved=jt(this.hass,this._config),this._resolvedFor=this.hass?.entities)}get _fanState(){return this.hass?.states?.[this._entities.fan]}get _lightState(){const t=this._entities.light;return t?this.hass?.states?.[t]:void 0}get _timerState(){const t=this._entities.timer;return t?this.hass?.states?.[t]:void 0}get _soundState(){const t=this._entities.sound;return t?this.hass?.states?.[t]:void 0}get _currentSpeed(){const t=this._fanState;if(!Ot(t))return 0;return function(t,e=6){return!t||t<=0?0:Math.min(e,Math.max(1,Math.round(t/(100/e))))}(Number(t.attributes?.percentage??0),this._speedCount)}get _speedCount(){return function(t){const e=Number(t?.attributes?.percentage_step);if(!Number.isFinite(e)||e<=0)return 6;const i=Math.round(100/e);return i>=1&&i<=10?i:6}(this._fanState)}get _fanSupportsDirection(){return Rt(this._fanState)}get _fanSupportsSpeed(){return Ht(this._fanState,Mt)}get _fanSupportsOscillate(){return Ht(this._fanState,Tt)}get _isOscillating(){return!0===this._fanState?.attributes?.oscillating}get _canTurnOn(){return Ht(this._fanState,Lt)}get _canTurnOff(){return Ht(this._fanState,Ut)}get _fanDirection(){return"reverse"===this._fanState?.attributes?.direction?"reverse":"forward"}get _summerDirection(){return"reverse"===this._config.summer_direction?"reverse":"forward"}get _winterDirection(){return"forward"===this._summerDirection?"reverse":"forward"}get _isSummerMode(){return this._fanDirection===this._summerDirection}get _isLightOn(){return"on"===this._lightState?.state}get _lightSupportsColorTemp(){return(this._lightState?.attributes?.supported_color_modes??[]).includes("color_temp")}get _minKelvin(){return Number(this._lightState?.attributes?.min_color_temp_kelvin??2700)}get _maxKelvin(){return Number(this._lightState?.attributes?.max_color_temp_kelvin??6500)}get _currentKelvin(){return Number(this._lightState?.attributes?.color_temp_kelvin??this._minKelvin)}get _showColorTemp(){return!!this._lightState&&this._isLightOn&&this._lightSupportsColorTemp}get _isSoundOn(){return"on"===this._soundState?.state}get _isOn(){return Ot(this._fanState)}get _fanSupportsPreset(){return Ht(this._fanState,Dt)&&this._presetModes.length>0}get _presetModes(){return this._fanState?.attributes?.preset_modes??[]}get _presetMode(){return this._fanState?.attributes?.preset_mode??""}get _activePreset(){const t=this._presetMode;return t&&"normal"!==t.toLowerCase()?t:""}_formatPreset(t){return t?t.charAt(0).toUpperCase()+t.slice(1):t}get _timerDomain(){return this._entities.timer?.startsWith("select.")?"select":"number"}get _timerValue(){const t=this._timerState?.state;if(null==t||""===t)return"";if("select"===this._timerDomain)return String(t);const e=Number(t);return Number.isNaN(e)?String(t):String(e)}get _timerOptions(){return"select"===this._timerDomain?this._timerState?.attributes?.options??[]:At.map(String)}get _timerChoices(){const t=this._timerOptions,e=this._timerValue;return""===e||t.includes(e)?t:"select"===this._timerDomain?[...t,e]:[...t,e].sort((t,e)=>Number(t)-Number(e))}_formatTimerOption(t){const e=Number(t);return""===t.trim()||Number.isNaN(e)?t:0===e?this._t("controls.timer_none"):e<60?`${e} min`:e/60+" h"}get _isTimerActive(){const[t]=this._timerOptions;return""!==this._timerValue&&this._timerValue!==t}_speedStateLabel(t){return this._fanSupportsSpeed?0===t?this._t("speed.state_off"):6!==this._speedCount?this._t("speed.state_generic",{speed:t}):this._t(`speed.state_s${t}`):this._t(this._isOn?"speed.state_on":"speed.state_off")}_speedLabel(t){return 6!==this._speedCount?this._t("speed.generic",{speed:t}):this._t(`speed.s${t}`)}_call(t,e,i){const s=i=>{console.error(`fan-bridge-card: ${t}.${e} failed`,i),this.requestUpdate()};try{Promise.resolve(this.hass.callService(t,e,i)).catch(s)}catch(t){s(t)}}_setSpeed(t){0===t?this._call("fan","turn_off",{entity_id:this._entities.fan}):this._call("fan","set_percentage",{entity_id:this._entities.fan,percentage:Ct(t,this._speedCount)})}_togglePower(){this._call("fan",this._isOn?"turn_off":"turn_on",{entity_id:this._entities.fan})}_toggleOscillate(){this._call("fan","oscillate",{entity_id:this._entities.fan,oscillating:!this._isOscillating})}_setPreset(t){this._call("fan","set_preset_mode",{entity_id:this._entities.fan,preset_mode:t.target.value})}_setDirection(t){this._call("fan","set_direction",{entity_id:this._entities.fan,direction:t})}_setSeason(t){this._setDirection("summer"===t?this._summerDirection:this._winterDirection)}_toggleLight(){this._entities.light&&this._call("light","toggle",{entity_id:this._entities.light})}_setColorTemp(t){if(!this._entities.light)return;const e=Number(t.target.value);this._call("light","turn_on",{entity_id:this._entities.light,color_temp_kelvin:e})}_setTimer(t){if(!this._entities.timer)return;const e=t.target.value;"select"===this._timerDomain?this._call("select","select_option",{entity_id:this._entities.timer,option:e}):this._call("number","set_value",{entity_id:this._entities.timer,value:Number(e)})}_toggleSound(){this._entities.sound&&this._call("switch","toggle",{entity_id:this._entities.sound})}_dialPoint(t,e){const{cx:i,cy:s}=Ft._DIAL,r=t*Math.PI/180;return[i+e*Math.cos(r),s+e*Math.sin(r)]}get _dialPath(){const{r:t,start:e,sweep:i}=Ft._DIAL,[s,r]=this._dialPoint(e,t),[n,o]=this._dialPoint(e+i,t);return`M ${s} ${r} A ${t} ${t} 0 1 1 ${n} ${o}`}_onDialClick(t){const e=t.currentTarget.ownerSVGElement;if(!e||Pt(this._fanState))return;const{cx:i,cy:s,start:r,sweep:n,w:o,h:a}=Ft._DIAL,c=e.getBoundingClientRect();if(!c.width||!c.height)return;const l=(t.clientX-c.left)/c.width*o-i,d=(t.clientY-c.top)/c.height*a-s;let h=(180*Math.atan2(d,l)/Math.PI-r+360)%360;h>n&&(h=h>n+(360-n)/2?0:n);const p=this._speedCount;this._setSpeed(Math.min(p,Math.max(1,Math.round(h/n*p))))}_renderSpeedIcon(t){const e=!this._fanSupportsSpeed&&this._isOn,i=0===t&&!e,s=e?3:Math.max(1,Math.round(6*t/this._speedCount));return V`
      <div class="fan-icon-wrap ${i?"off":""}">
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="currentColor"
          class="fan-svg ${i?"off":""}"
          style="${i?"":`animation: spin ${["none","2.5s","1.5s","0.9s","0.6s","0.35s","0.15s"][s]} linear infinite;`}"
          aria-hidden="true"
        >
          <path d="M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.69 9.22,10.88C9.41,10.4 9.73,9.97 10.13,9.65C8.14,5.96 8.92,2 12.5,2Z" />
        </svg>
      </div>
    `}_renderFx(){return this._fanSupportsDirection?this._isSummerMode?V`<div class="fx summer" aria-hidden="true">
        ${[18,30,44,58,70,82].map((t,e)=>V`<i style="--y:${t}%;--d:${2.6+e%3*.7}s;--delay:${.9*-e}s"></i>`)}
      </div>`:V`<div class="fx winter" aria-hidden="true">
      ${Array.from({length:14},(t,e)=>V`<i
            style="--x:${6+6.7*e}%;--s:${3+e%3}px;--d:${5+e%4}s;--delay:${.8*-e}s;--dx:${(e%2?1:-1)*(10+e%5*6)}px"
          ></i>`)}
    </div>`:q}_renderPower(t){return this._canTurnOn||this._canTurnOff?V`
      <button
        class="ctrl-btn power ${this._isOn?"on":""}"
        @click=${this._togglePower}
        ?disabled=${t||(this._isOn?!this._canTurnOff:!this._canTurnOn)}
        aria-label="${this._t("controls.power")}"
        title="${this._t("controls.power")}"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M12 4v8"/>
          <path d="M7.8 6.8a6 6 0 1 0 8.4 0"/>
        </svg>
      </button>
    `:q}_renderDial(t,e){const{w:i,h:s,r:r,start:n,sweep:o}=Ft._DIAL,a=this._speedCount,c=t/a,[l,d]=this._dialPoint(n+o*c,r),h=(t,e)=>{const[r,n]=this._dialPoint(t,e);return`left:${r/i*100}%;top:${n/s*100}%`},p=Array.from({length:a+1},(e,i)=>{const s=n+o*i/a,[c,l]=this._dialPoint(s,r-22),[d,h]=this._dialPoint(s,r-13);return W`<line class="tick ${i<=t&&t>0?"lit":""}" x1="${c}" y1="${l}" x2="${d}" y2="${h}" />`});return V`
      <div class="dial speed-bar">
        <svg class="ring" viewBox="0 0 ${i} ${s}" aria-hidden="true">
          <path class="track" d="${this._dialPath}" />
          ${t>0?W`<path class="value" d="${this._dialPath}" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${100-100*c}" />`:q}
          ${p}
          <circle class="thumb ${0===t?"idle":""}" cx="${l}" cy="${d}" r="13" />
          <path class="hit" d="${this._dialPath}" @click=${this._onDialClick} />
        </svg>
        <div class="center">
          <div class="cap">${this._t("speed.label")}</div>
          <div class="big">${t}<small>/${a}</small></div>
          <div class="fan-pct">
            ${this._isOn?this._activePreset?this._t("controls.preset"):`${function(t,e=6){return t<=0?0:Math.round(t/e*100)}(t,a)}%`:"—"}
          </div>
        </div>
        ${Array.from({length:a},(t,e)=>e+1).map(i=>V`
            <button
              class="speed-seg ${t>=i&&t>0?"filled":""} ${t===i?"active":""}"
              style="${h(n+o*i/a,r-36)}"
              @click=${()=>this._setSpeed(i)}
              ?disabled=${e}
              aria-label="${this._speedLabel(i)}"
              aria-pressed=${t===i}
            >${i}</button>
          `)}
        <div class="dial-power">${this._renderPower(e)}</div>
      </div>
    `}_renderSeason(){const t=this._isSummerMode;return V`
      <div class="season">
        <div class="season-cap">
          <span>${this._t("controls.dir_caption")}</span>
          <em>${this._t(t?"controls.dir_summer_hint":"controls.dir_winter_hint")}</em>
        </div>
        <div class="season-toggle">
          <button
            class="season-btn summer ${t?"active":""}"
            @click=${()=>this._setSeason("summer")}
            ?disabled=${!this._isOn}
            aria-label="${this._t("controls.dir_summer")}"
            aria-pressed=${t}
            title="${this._t("controls.dir_summer")}"
          >
            <ha-icon icon="mdi:weather-sunny"></ha-icon>
            <span>${this._t("controls.dir_summer")}</span>
          </button>
          <button
            class="season-btn winter ${t?"":"active"}"
            @click=${()=>this._setSeason("winter")}
            ?disabled=${!this._isOn}
            aria-label="${this._t("controls.dir_winter")}"
            aria-pressed=${!t}
            title="${this._t("controls.dir_winter")}"
          >
            <ha-icon icon="mdi:snowflake"></ha-icon>
            <span>${this._t("controls.dir_winter")}</span>
          </button>
        </div>
      </div>
    `}_renderChips(t,e){const i=t||!this._isOn;return V`
      <div class="chips">
        ${this._fanSupportsPreset?V`
            <div class="chip ${this._activePreset?"on":""} ${i?"disabled":""}">
              <ha-icon icon="mdi:tune-variant"></ha-icon>
              <span class="chip-label">${this._presetMode?this._formatPreset(this._presetMode):this._t("controls.preset")}</span>
              <select
                class="preset-select ${this._activePreset?"active":""}"
                .value=${$t(this._presetMode)}
                @change=${this._setPreset}
                ?disabled=${i}
                aria-label="${this._t("controls.preset")}"
                title="${this._t("controls.preset")}"
              >
                ${this._presetModes.includes(this._presetMode)?q:V`<option value="" disabled selected>—</option>`}
                ${this._presetModes.map(t=>V`<option value="${t}" ?selected=${t===this._presetMode}>${this._formatPreset(t)}</option>`)}
              </select>
            </div>
          `:q}

        ${this._fanSupportsOscillate?V`
            <button
              class="ctrl-btn chip oscillate ${this._isOscillating?"on":""}"
              @click=${this._toggleOscillate}
              ?disabled=${i}
              aria-label="${this._t("controls.oscillate")}"
              aria-pressed=${this._isOscillating}
              title="${this._t("controls.oscillate")}"
            >
              <ha-icon icon="${this._isOscillating?"mdi:arrow-oscillating":"mdi:arrow-oscillating-off"}"></ha-icon>
              <span class="chip-label">${this._t("controls.oscillate")}</span>
            </button>
          `:q}

        ${this._lightState?V`
            <div class="chip split ${this._isLightOn?"on":""} ${e?"disabled":""}">
              <button
                class="ctrl-btn light main ${this._isLightOn?"on":""}"
                @click=${this._toggleLight}
                ?disabled=${e}
                aria-label="${this._t("controls.light")}"
                aria-pressed=${this._isLightOn}
                title="${this._t("controls.light")}"
              >
                <ha-icon icon="${this._isLightOn?"mdi:lightbulb-outline":"mdi:lightbulb-off-outline"}"></ha-icon>
                <span class="chip-label">${this._t("controls.light")}</span>
              </button>
              ${this._showColorTemp?V`
                  <button
                    class="temp-toggle ${this._tempOpen?"open":""}"
                    @click=${()=>this._tempOpen=!this._tempOpen}
                    aria-label="${this._t("controls.color_temp")}"
                    aria-expanded=${this._tempOpen}
                    title="${this._t("controls.color_temp")}"
                  >
                    <ha-icon icon="mdi:white-balance-sunny"></ha-icon>
                    <span>K</span>
                  </button>
                `:q}
            </div>
          `:q}

        ${this._timerState?V`
            <div class="chip ${this._isTimerActive?"on":""} ${i?"disabled":""}">
              <ha-icon icon="mdi:timer-outline"></ha-icon>
              <span class="chip-label">${this._isTimerActive?this._formatTimerOption(this._timerValue):this._t("controls.timer")}</span>
              <select
                class="ctrl-select ${this._isTimerActive?"active":""}"
                .value=${$t(String(this._timerValue))}
                @change=${this._setTimer}
                ?disabled=${i}
                aria-label="${this._t("controls.timer")}"
                title="${this._t("controls.timer")}"
              >
                ${this._timerChoices.map(t=>V`
                    <option value="${t}" ?selected=${t===this._timerValue}>${this._formatTimerOption(t)}</option>
                  `)}
              </select>
            </div>
          `:q}

        ${this._soundState?V`
            <button
              class="ctrl-btn chip sound ${this._isSoundOn?"on":""}"
              @click=${this._toggleSound}
              ?disabled=${i}
              aria-label="${this._t("controls.sound")}"
              aria-pressed=${this._isSoundOn}
              title="${this._t("controls.sound")}"
            >
              <ha-icon icon="${this._isSoundOn?"mdi:volume-high":"mdi:volume-off"}"></ha-icon>
              <span class="chip-label">${this._t("controls.sound")}</span>
            </button>
          `:q}
      </div>
    `}render(){if(!this._config)return q;if(!this.hass)return q;const t=this._fanState;if(!t)return V`<ha-card>
        <div class="error" role="alert">
          ${this._t("card.entity_not_found",{entity:this._config.fan_entity})}
        </div>
      </ha-card>`;if(!Bt(this.hass,this._entities.fan))return V`<ha-card>
        <div class="error" role="alert">
          ${this._t("card.not_bridge",{entity:this._config.fan_entity})}
        </div>
      </ha-card>`;const e=this._currentSpeed,i=Pt(t),s=this._config.light_independent?Pt(this._lightState):i||!this._isOn,r=this._config.name||t.attributes?.friendly_name||this._t("card.name_default"),n=!0===t.attributes?.using_backup,o=this._isOn&&!i;return V`
      <ha-card>
        <div class="card-content ${i?"unavailable":""} ${this._isOn?"":"idle"}">
          ${o?this._renderFx():q}

          <div class="card-header">
            ${this._renderSpeedIcon(e)}
            <div class="head-text">
              ${!1!==this._config.show_name?V`<div class="card-title">${r}</div>`:q}
              <div class="status">
                <span class="dot"></span>
                <span class="fan-state">${this._activePreset?this._formatPreset(this._activePreset):this._speedStateLabel(e)}</span>
                ${this._fanSupportsDirection&&this._isOn?V`<span class="fan-season">· ${this._t(this._isSummerMode?"controls.dir_summer":"controls.dir_winter")}</span>`:q}
              </div>
            </div>
            ${n?V`<span class="badge" title="${this._entities.fan}">${this._t("card.fallback_badge")}</span>`:q}
          </div>

          ${i?V`<div class="unavailable-msg">${this._t("card.unavailable")}</div>`:q}

          ${this._fanSupportsSpeed?this._renderDial(e,i):V`<div class="onoff">${this._renderPower(i)}</div>`}

          ${this._fanSupportsDirection?this._renderSeason():q}

          ${this._renderChips(i,s)}

          ${this._showColorTemp&&this._tempOpen?V`
              <div class="temp-row">
                <span class="temp-label warm">${this._t("controls.temp_warm")}</span>
                <input
                  class="temp-slider"
                  type="range"
                  min="${this._minKelvin}"
                  max="${this._maxKelvin}"
                  step="100"
                  .value=${$t(String(this._currentKelvin))}
                  @change=${this._setColorTemp}
                  ?disabled=${this._config.light_independent?s:i}
                  aria-label="${this._t("controls.color_temp")}"
                />
                <span class="temp-label cool">${this._t("controls.temp_cool")}</span>
                <span class="temp-value">${this._currentKelvin}K</span>
              </div>
            `:q}
        </div>
      </ha-card>
    `}}Ft._DIAL={cx:150,cy:150,r:118,start:135,sweep:270,w:300,h:276},Ft.styles=o`
    /* Colours derive from the HA theme (text, card background, dividers) so
       light and dark themes both work; only the accent is a fixed green,
       overridable with --fan-bridge-card-accent. The hex value is a fallback. */
    :host {
      --wc-accent: var(--fan-bridge-card-accent, #2fd1a0);
      --wc-text: var(--primary-text-color);
      --wc-dim: var(--secondary-text-color);
      --wc-surface: color-mix(in srgb, var(--primary-text-color) 7%, transparent);
      --wc-line: color-mix(in srgb, var(--primary-text-color) 15%, transparent);
      --wc-focus-ring: 2px solid var(--wc-accent);
    }

    button:focus-visible,
    .temp-slider:focus-visible {
      outline: var(--wc-focus-ring);
      outline-offset: 2px;
    }

    ha-card {
      position: relative;
      overflow: hidden;
      border-radius: 26px;
      background: linear-gradient(
        160deg,
        color-mix(in srgb, var(--card-background-color, transparent) 92%, var(--primary-text-color) 8%),
        var(--card-background-color, transparent)
      );
    }

    /* --wc-a is the colour in use: the accent while running, grey while idle. */
    .card-content {
      --wc-a: var(--wc-accent);
      --wc-a-soft: color-mix(in srgb, var(--wc-a) 55%, white);
      /* Accent for text: pulled towards the theme's text colour rather than
         white, so it stays readable on a light card as on a dark one. */
      --wc-a-text: color-mix(in srgb, var(--wc-a) 70%, var(--primary-text-color));
      --wc-on-a: color-mix(in srgb, var(--wc-a) 18%, black);
      --wc-glow: color-mix(in srgb, var(--wc-a) 30%, transparent);
      position: relative;
      padding: 18px 18px 16px;
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--wc-a) 28%, var(--wc-line));
      border-radius: inherit;
      transition: box-shadow 0.4s;
    }
    .card-content.idle {
      --wc-a: var(--wc-dim);
      --wc-glow: transparent;
      box-shadow: inset 0 0 0 1px var(--wc-line);
    }
    .card-content.unavailable {
      opacity: 0.6;
    }
    .card-content::before {
      content: "";
      position: absolute;
      inset: -30% -20% auto -20%;
      height: 70%;
      background: radial-gradient(closest-side, var(--wc-glow), transparent 70%);
      pointer-events: none;
    }
    .card-content > *:not(.fx) {
      position: relative;
      z-index: 1;
    }

    /* Season effects */
    .fx {
      position: absolute;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .fx i {
      position: absolute;
      opacity: 0;
    }
    .fx.summer i {
      left: -40%;
      top: var(--y);
      width: 40%;
      height: 2px;
      border-radius: 2px;
      background: linear-gradient(90deg, transparent, var(--wc-a-soft), transparent);
      animation: streak var(--d) linear infinite;
      animation-delay: var(--delay);
    }
    .fx.winter i {
      bottom: -10px;
      left: var(--x);
      width: var(--s);
      height: var(--s);
      border-radius: 50%;
      background: var(--wc-a-soft);
      box-shadow: 0 0 8px var(--wc-a);
      animation: rise var(--d) ease-in infinite;
      animation-delay: var(--delay);
    }
    @keyframes streak {
      0% { transform: translateX(0); opacity: 0; }
      15% { opacity: 0.55; }
      85% { opacity: 0.45; }
      100% { transform: translateX(380%); opacity: 0; }
    }
    @keyframes rise {
      0% { transform: translate(0, 0); opacity: 0; }
      15% { opacity: 0.8; }
      100% { transform: translate(var(--dx), -460px); opacity: 0; }
    }

    /* Header */
    .card-header {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .head-text {
      min-width: 0;
      flex: 1;
    }
    .card-title {
      font-size: 20px;
      font-weight: 700;
      line-height: 1.15;
      color: var(--wc-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 3px;
      font-size: 14px;
      color: var(--wc-dim);
      min-width: 0;
    }
    .status .fan-state {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .status .fan-season {
      white-space: nowrap;
    }
    .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      flex: none;
      background: var(--wc-a);
      box-shadow: 0 0 8px var(--wc-a);
    }
    .badge {
      flex: none;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 9px;
      border-radius: 999px;
      color: var(--wc-a-text);
      border: 1px solid color-mix(in srgb, var(--wc-a) 50%, transparent);
      background: color-mix(in srgb, var(--wc-a) 12%, transparent);
    }

    .unavailable-msg {
      font-size: 13px;
      color: var(--wc-dim);
      text-align: center;
      padding: 8px 0 0;
    }

    .fan-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 15px;
      display: grid;
      place-items: center;
      flex: none;
      color: var(--wc-a);
      background: color-mix(in srgb, var(--wc-a) 16%, var(--wc-surface));
      border: 1px solid color-mix(in srgb, var(--wc-a) 45%, transparent);
      transition: color 0.3s, background 0.3s, border-color 0.3s;
    }
    .fan-icon-wrap.off {
      background: var(--wc-surface);
      border-color: var(--wc-line);
    }
    .fan-svg {
      transform-origin: center;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* The spin is set inline per speed; !important lets the user's
       reduced-motion preference win over it. */
    @media (prefers-reduced-motion: reduce) {
      .fan-svg {
        animation: none !important;
      }
      .fx {
        display: none;
      }
    }

    /* Dial */
    .dial {
      position: relative;
      width: 100%;
      max-width: 320px;
      margin: 4px auto 22px;
      aspect-ratio: 300 / 276;
    }
    .ring {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .track,
    .value,
    .hit {
      fill: none;
      stroke-width: 16;
      stroke-linecap: round;
    }
    .track {
      stroke: var(--wc-line);
    }
    .value {
      stroke: var(--wc-a);
      filter: drop-shadow(0 0 8px var(--wc-glow));
      transition: stroke-dashoffset 0.35s ease;
    }
    .hit {
      stroke: transparent;
      stroke-width: 44;
      cursor: pointer;
      pointer-events: stroke;
    }
    .tick {
      stroke: var(--wc-line);
      stroke-width: 2;
      stroke-linecap: round;
    }
    .tick.lit {
      stroke: var(--wc-a);
    }
    .thumb {
      fill: var(--wc-text);
      stroke: var(--wc-a);
      stroke-width: 5;
      filter: drop-shadow(0 0 8px var(--wc-a));
      pointer-events: none;
      transition: cx 0.35s, cy 0.35s;
    }
    .thumb.idle {
      filter: none;
    }
    .center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding-top: 5%;
      pointer-events: none;
    }
    .center .cap {
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--wc-dim);
    }
    .center .big {
      font-size: 64px;
      font-weight: 800;
      line-height: 1;
      color: var(--wc-text);
    }
    .center .big small {
      font-size: 24px;
      font-weight: 700;
      margin-left: 2px;
      color: var(--wc-a-text);
    }
    .idle .center .big {
      color: var(--wc-dim);
    }
    .fan-pct {
      margin-top: 4px;
      font-size: 15px;
      color: var(--wc-dim);
    }

    .speed-seg {
      position: absolute;
      transform: translate(-50%, -50%);
      width: 28px;
      height: 28px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--wc-dim);
      font: 600 12px inherit;
      cursor: pointer;
      transition: color 0.15s, background 0.15s;
    }
    .speed-seg.filled {
      color: var(--wc-a-text);
    }
    .speed-seg.active {
      color: var(--wc-on-a);
      background: var(--wc-a);
      font-weight: 800;
    }
    .speed-seg:hover:not(:disabled):not(.active) {
      background: var(--wc-surface);
    }
    .speed-seg:disabled {
      cursor: default;
      opacity: 0.5;
    }

    .dial-power {
      position: absolute;
      left: 50%;
      top: 88%;
      transform: translate(-50%, -50%);
    }
    .onoff {
      display: flex;
      justify-content: center;
      padding: 18px 0 8px;
    }

    .ctrl-btn.power {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 1px solid var(--wc-line);
      background: var(--wc-surface);
      color: var(--wc-dim);
      display: grid;
      place-items: center;
      padding: 0;
      cursor: pointer;
      transition: 0.2s;
    }
    .ctrl-btn.power:hover:not(:disabled) {
      border-color: var(--wc-a);
      box-shadow: 0 0 12px -2px var(--wc-a);
    }
    .ctrl-btn.power.on {
      color: var(--wc-on-a);
      background: linear-gradient(180deg, var(--wc-a-soft), var(--wc-a));
      border-color: transparent;
      box-shadow: 0 6px 16px -4px var(--wc-glow);
    }
    .ctrl-btn:disabled {
      cursor: default;
      opacity: 0.4;
    }

    /* Season */
    .season-cap {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin: 0 4px 6px;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--wc-dim);
    }
    .season-cap em {
      font-style: normal;
      letter-spacing: 0;
      text-transform: none;
    }
    .season-toggle {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      padding: 5px;
      border-radius: 18px;
      background: var(--wc-surface);
      border: 1px solid var(--wc-line);
    }
    .season-btn {
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 0;
      border-radius: 14px;
      background: transparent;
      color: var(--wc-dim);
      font: 700 14px inherit;
      cursor: pointer;
      padding: 0;
      transition: background 0.2s, color 0.2s;
    }
    .season-btn ha-icon {
      --mdc-icon-size: 22px;
      display: flex;
    }
    .season-btn.active {
      color: var(--wc-on-a);
      background: linear-gradient(180deg, var(--wc-a-soft), var(--wc-a));
      box-shadow: 0 6px 16px -4px var(--wc-glow);
    }
    .season-btn:disabled {
      cursor: default;
      opacity: 0.4;
    }

    /* Chips */
    .chips {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 10px;
    }
    .chips > :last-child:nth-child(odd) {
      grid-column: 1 / -1;
    }
    .chip {
      position: relative;
      height: 46px;
      padding: 0 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-radius: 14px;
      border: 1px solid var(--wc-line);
      background: var(--wc-surface);
      color: var(--wc-text);
      font: 700 14px inherit;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      min-width: 0;
    }
    .chip ha-icon {
      --mdc-icon-size: 20px;
      display: flex;
      flex: none;
      color: var(--wc-dim);
    }
    .chip-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .chip.on {
      border-color: color-mix(in srgb, var(--wc-a) 55%, transparent);
      background: color-mix(in srgb, var(--wc-a) 12%, var(--wc-surface));
    }
    .chip.on ha-icon,
    .chip.on .ctrl-btn ha-icon {
      color: var(--wc-a);
    }
    .chip.disabled,
    .chip:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .ctrl-btn.chip {
      width: auto;
    }
    .ctrl-btn.chip:hover:not(:disabled),
    .chip:hover:not(.disabled) {
      border-color: var(--wc-a);
    }
    .chip select {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }
    .chip select:disabled {
      cursor: default;
    }
    .chip.split {
      padding: 0;
      gap: 0;
      overflow: hidden;
      cursor: default;
    }
    .chip.split .main {
      flex: 1;
      min-width: 0;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
      padding: 0 12px;
    }
    .chip.split .main ha-icon {
      --mdc-icon-size: 20px;
      display: flex;
      color: var(--wc-dim);
    }
    .chip.split.on .main ha-icon {
      color: var(--wc-a);
    }
    .temp-toggle {
      flex: none;
      width: 56px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      border: 0;
      border-left: 1px solid var(--wc-line);
      background: transparent;
      color: var(--wc-dim);
      font: 700 11px inherit;
      cursor: pointer;
      padding: 0;
    }
    .temp-toggle ha-icon {
      --mdc-icon-size: 18px;
      display: flex;
    }
    .temp-toggle:hover,
    .temp-toggle.open {
      color: var(--wc-a);
      background: color-mix(in srgb, var(--wc-a) 10%, transparent);
    }

    /* Colour temperature (collapsed behind the light chip) */
    .temp-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      padding: 12px 14px;
      border-radius: 16px;
      background: var(--wc-surface);
      border: 1px solid var(--wc-line);
    }
    .temp-label {
      font-size: 11px;
      flex-shrink: 0;
      color: var(--wc-dim);
    }
    .temp-value {
      font-size: 12px;
      font-weight: 700;
      color: var(--wc-text);
      min-width: 46px;
      text-align: right;
      flex-shrink: 0;
    }
    .temp-slider {
      flex: 1;
      -webkit-appearance: none;
      appearance: none;
      height: 8px;
      border-radius: 4px;
      /* Depicts the light's colour temperature itself (warm to cool white),
         so it is intentionally theme-independent. */
      background: linear-gradient(to right, #ffb46e, #fff6e8 50%, #cfe4ff);
      outline: none;
      cursor: pointer;
    }
    .temp-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--wc-text);
      border: 4px solid var(--wc-accent);
      cursor: pointer;
    }
    .temp-slider::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--wc-text);
      border: 4px solid var(--wc-accent);
      cursor: pointer;
    }
    .temp-slider:disabled {
      opacity: 0.5;
      cursor: default;
    }

    .error {
      padding: 16px;
      font-size: 13px;
      color: var(--error-color, #db4437);
    }
  `,t([ut({attribute:!1})],Ft.prototype,"hass",void 0),t([_t()],Ft.prototype,"_config",void 0),t([_t()],Ft.prototype,"_tempOpen",void 0),customElements.get("fan-bridge-card")||customElements.define("fan-bridge-card",Ft),window.customCards=window.customCards||[],window.customCards.some(t=>"fan-bridge-card"===t.type)||window.customCards.push({type:"fan-bridge-card",name:"FanBridge Card",description:"Custom card for smart ceiling fans (CREATE Windcalm, Klassfan, …)",preview:!0}),console.info("%c FAN-BRIDGE-CARD %c v1.0.0 ","color: #fff; background: #378add; font-weight: 700;","color: #378add; background: #fff; font-weight: 700;");
