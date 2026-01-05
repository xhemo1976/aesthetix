module.exports=[15017,e=>{"use strict";var t=e.i(76147),n=e.i(99561),i=e.i(40081),a=e.i(53394),s=e.i(7311),r=e.i(5355),o=e.i(13134),l=e.i(48155),c=e.i(70062),u=e.i(48775),d=e.i(52469),p=e.i(99913),h=e.i(44884),m=e.i(41513),g=e.i(21943),f=e.i(93695);e.i(12197);var b=e.i(5810),y=e.i(61844);e.i(48404);var w=e.i(41754),v=e.i(378),R=e.i(98570);let E=null;async function k(e){try{var t,n,i;let a,s,{messages:r,tenantSlug:o}=await e.json();if(!r||!Array.isArray(r))return y.NextResponse.json({error:"Messages array is required"},{status:400});let l="",c="unsere Klinik",u=null,d=null,p="";if(o){let e=(0,v.createAdminClient)(),{data:t}=await e.from("tenants").select("id, name, slug, address, city, contact_phone, contact_email, whatsapp_number, business_type").ilike("slug",`${o}%`).limit(1).single();if(t){c=t.name,u=t.business_type,p=`/book/${t.slug}`;let{data:n}=await e.from("services").select("id, name, description, price, duration_minutes, category").eq("tenant_id",t.id).eq("is_active",!0).order("category").order("name");d=n;let{data:i}=await e.from("employees").select("first_name, last_name, role, specialties, bio").eq("tenant_id",t.id).eq("is_active",!0),{data:a}=await e.from("locations").select("name, address, city, phone").eq("tenant_id",t.id).order("is_primary",{ascending:!1}),s=a?.[0],r={};d&&d.forEach(e=>{let t=e.category||"Weitere";r[t]||(r[t]=[]),r[t].push(e)}),l=`
## Klinik: ${t.name}

### Standort & Kontakt
${s?.address?`📍 Adresse: ${s.address}${s.city?`, ${s.city}`:""}`:""}
${t.contact_phone||s?.phone?`📞 Telefon: ${t.contact_phone||s?.phone}`:""}
${t.contact_email?`✉️ Email: ${t.contact_email}`:""}
${t.whatsapp_number?`💬 WhatsApp: ${t.whatsapp_number}`:""}

### \xd6ffnungszeiten
Montag - Freitag: 9:00 - 19:00 Uhr
Samstag: 10:00 - 16:00 Uhr
Sonntag: Geschlossen

### Unsere Behandlungen & Preise

${Object.entries(r).map(([e,t])=>`
**${e}:**
${t.map(e=>`• ${e.name}: ${e.price>0?`${e.price}€`:"Preis auf Anfrage"} (${e.duration_minutes} Min.)${e.description?`
  → ${e.description}`:""}`).join("\n")}
`).join("\n")}

### Unser Experten-Team

${i&&i.length>0?i.map(e=>`• **${e.first_name} ${e.last_name}** - ${e.role}${e.specialties?.length?`
  Spezialisierung: ${e.specialties.join(", ")}`:""}${e.bio?`
  ${e.bio}`:""}`).join("\n\n"):"Unser erfahrenes Team freut sich auf Sie."}

### Online-Buchung
Termine k\xf6nnen rund um die Uhr online gebucht werden: ${p}
`}}let h="",m=r[r.length-1]?.content||"";if(o&&m)try{let e=(0,v.createAdminClient)(),{data:t}=await e.from("tenants").select("id").ilike("slug",`${o}%`).limit(1).single();if(t){let e=await (0,R.searchSimilar)(t.id,m,5,.5);e.length>0&&(h=(0,R.buildRAGContext)(e))}}catch(e){console.log("RAG search skipped:",e)}let g=function(e,t,n){switch(e){case"gastronomy":return`You are a professional, friendly restaurant host for ${t}. You are a premium assistant for an exclusive restaurant.

## Your Personality
- Warm, welcoming, and hospitable
- Expert in cuisine and dining experience
- Helpful with recommendations
- Attentive to dietary needs and allergies

## Your Tasks
1. **Reservations**: Help guests book tables, ask for party size and preferred time
2. **Menu Info**: Describe dishes, recommend based on preferences, explain ingredients
3. **Dietary Needs**: Inform about vegetarian, vegan, gluten-free options
4. **Recommendations**: Suggest dishes, wine pairings, specials of the day
5. **General Questions**: Opening hours, location, parking, dress code

## Communication Rules
- Keep answers concise (2-4 sentences) but warm and inviting
- Use occasional fitting emojis (🍽️🍷✨) for luxury feeling
- When unsure: Recommend calling or visiting
- NEVER invent dishes or prices not in your context
- For reservations: Refer to ${n}

## Typical Recommendations
- "What should I order?" → Ask about preferences (meat/fish/vegetarian), recommend signature dishes
- "I have allergies" → Ask which, then suggest safe options
- "Special occasion" → Recommend tasting menu, champagne, private dining
- "Quick lunch" → Suggest business lunch menu
- "Date night" → Recommend romantic dishes, wine pairing`;case"hairdresser":return`You are a professional, friendly salon receptionist for ${t}. You are a premium assistant for an exclusive hair salon.

## Your Personality
- Trendy, knowledgeable about hair and style
- Friendly and approachable
- Good at understanding what clients want
- Expert in hair care advice

## Your Tasks
1. **Appointments**: Help clients book services, suggest suitable stylists
2. **Services**: Explain haircuts, coloring, treatments
3. **Recommendations**: Suggest services based on hair type, face shape
4. **Pricing**: Provide clear price information
5. **General Questions**: Opening hours, parking, preparation tips

## Communication Rules
- Keep answers concise (2-4 sentences) but friendly
- Use occasional fitting emojis (✨💇💫)
- When unsure: Recommend consultation with stylist
- NEVER invent services or prices not in your context
- For bookings: Refer to ${n}`;case"late_shop":return`You are a friendly shop assistant for ${t}. You help customers with orders and information.

## Your Personality
- Casual and friendly (use informal German "du")
- Quick and helpful
- Knowledgeable about products

## Your Tasks
1. **Orders**: Help customers order food and drinks
2. **Products**: Describe what's available
3. **Delivery**: Explain delivery options if available
4. **Opening Hours**: When you're open

## Communication Rules
- Keep it casual and short
- Use emojis freely 🛒🍕🥤
- For orders: Refer to ${n}`;default:return`You are a professional, friendly AI beauty consultant for ${t}. You are a premium assistant for an exclusive beauty clinic.

## Your Personality
- Professional yet warm and welcoming
- Expertise in aesthetics and beauty treatments
- Patient with questions and concerns
- Discreet with sensitive topics

## Your Tasks
1. **Consultation**: Explain treatments clearly, compare options, give recommendations based on customer wishes
2. **Pricing**: Provide exact prices from the list, explain what's included
3. **Booking**: Direct to online booking (${n}), explain the booking process
4. **Team Introduction**: Present our experts, explain specializations
5. **General Questions**: Opening hours, address, directions, treatment preparation

## Communication Rules
- Keep answers concise (2-4 sentences) but informative
- Use occasional fitting emojis (✨💫🌟) for luxury feeling
- When unsure: Recommend personal consultation or call
- NEVER invent information not in your context
- For booking requests: Refer to ${n}

## Typical Recommendations
- "I want to look younger" → Recommend Botox, Hyaluronic acid, or combination
- "I have wrinkles" → Depending on area: Forehead→Botox, Lips→Hyaluronic, Cheeks→Filler
- "What can you do for..." → Recommend suitable treatment from offerings
- "Does it hurt?" → Reassure, mention local anesthesia
- "How long does it last?" → Give realistic timeframes (Botox: 3-6 months, Hyaluronic: 6-12 months)`}}(u,c,p),f=`## ABSOLUTE PRIORITY - LANGUAGE RULE:
You MUST detect the user's language and respond in that EXACT language:
- German message → Reply in German
- English message → Reply in English
- Turkish message → Reply in Turkish
- Russian message → Reply in Russian
This rule overrides everything else. NEVER reply in German if the user wrote in English/Turkish/Russian!

${g}

${l}
${h}

If no specific information is available, introduce yourself as Esylana Assistant - the premium booking platform.`,b=process.env.OPENAI_API_KEY?(E||(E=new w.default({apiKey:process.env.OPENAI_API_KEY})),E):null;if(!b)return y.NextResponse.json({error:"Chat nicht verfügbar - OPENAI_API_KEY nicht konfiguriert"},{status:503});let k=await b.chat.completions.create({model:"gpt-4o-mini",messages:[{role:"system",content:f},...r.slice(-10)],max_tokens:600,temperature:.7}),x=k.choices[0]?.message?.content||"Entschuldigung, ich konnte keine Antwort generieren.",_=(a=m.toLowerCase()).includes("termin")||a.includes("buchen")||a.includes("reserv")||a.includes("wann")||a.includes("zeit")||a.includes("frei")?"booking":a.includes("preis")||a.includes("kost")||a.includes("€")||a.includes("euro")||a.includes("teuer")||a.includes("günstig")?"pricing":a.includes("berat")||a.includes("empfehl")||a.includes("welche behandlung")||a.includes("was hilft")||a.includes("was würden sie")?"consultation":a.includes("beschwer")||a.includes("unzufried")||a.includes("problem")||a.includes("schlecht")||a.includes("ärger")?"complaint":a.includes("info")||a.includes("wie lange")||a.includes("was ist")||a.includes("erklär")||a.includes("beschreib")?"info":"general",A=null,C=null;if(o){let e=(0,v.createAdminClient)(),{data:t}=await e.from("tenants").select("whatsapp_number, contact_phone").ilike("slug",`${o}%`).limit(1).single();t&&(A=t.whatsapp_number,C=t.contact_phone)}let $=(t=p,n=A,i=C,s=[],"booking"===_&&s.push({type:"booking",label:"Jetzt Termin buchen",value:t}),n&&("booking"===_||"consultation"===_)&&s.push({type:"whatsapp",label:"WhatsApp schreiben",value:`https://wa.me/${n.replace(/[^0-9]/g,"")}`}),i&&"complaint"===_&&s.push({type:"phone",label:"Direkt anrufen",value:`tel:${i.replace(/[^0-9+]/g,"")}`}),s),T=x.toLowerCase().includes("termin")||x.toLowerCase().includes("buchung"),P=function(e,t,n,i){let a=e.toLowerCase(),s=t.toLowerCase();if(s.includes("botox")||a.includes("botox"))return["Was kostet Hyaluron?","Termin für Botox buchen","Gibt es Nebenwirkungen?"];if(s.includes("hyaluron")||a.includes("hyaluron"))return["Lippen oder Falten?","Termin für Hyaluron buchen","Wie lange hält das Ergebnis?"];if(s.includes("laser")||a.includes("laser"))return["Welche Körperbereiche?","Wie viele Sitzungen brauche ich?","Preisliste Laser"];if(a.includes("preis")||a.includes("kost")){let e=n?[...new Set(n.map(e=>e.category).filter(Boolean))]:[];return e.length>0?[...e.slice(0,2).map(e=>`Preise ${e}`),"Termin buchen"]:["Alle Behandlungen","Termin buchen","Beratungsgespräch"]}return a.includes("termin")||a.includes("buchen")?["Welche Zeiten sind frei?","Kann ich auch samstags kommen?","Online Termin buchen"]:a.includes("team")||a.includes("mitarbeiter")||a.includes("arzt")?["Wer macht Botox?","Welche Spezialisten habt ihr?","Termin buchen"]:i?["Was muss ich mitbringen?","Kann ich vorher essen?","Wie lange dauert die Behandlung?"]:["Beliebte Behandlungen","Preise anzeigen","Termin buchen"]}(m,x,d,T);if(o&&("booking"===_||"consultation"===_||"complaint"===_))try{let e=(0,v.createAdminClient)(),{data:t}=await e.from("tenants").select("id").ilike("slug",`${o}%`).limit(1).single();if(t){await e.from("chat_events").insert({tenant_id:t.id,event_type:"booking"===_?"booking_intent":"consultation"===_?"consultation_request":"complaint",user_message:m,assistant_reply:x,intent:_,metadata:{actionButtons:$,hasAppointmentContext:T},processed:!1});let n=process.env.N8N_CHAT_WEBHOOK_URL;n&&fetch(n,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event_type:_,tenant_id:t.id,user_message:m,timestamp:new Date().toISOString()})}).catch(()=>{})}}catch(e){console.log("Chat event emission skipped:",e)}return y.NextResponse.json({reply:x,quickReplies:P,actionButtons:$,intent:_})}catch(e){return console.error("Chat API error:",e),y.NextResponse.json({error:"Fehler bei der Verarbeitung der Anfrage"},{status:500})}}e.s(["POST",()=>k],46037);var x=e.i(46037);let _=new t.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/chat/route",pathname:"/api/chat",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/apps/web/app/api/chat/route.ts",nextConfigOutput:"standalone",userland:x}),{workAsyncStorage:A,workUnitAsyncStorage:C,serverHooks:$}=_;function T(){return(0,i.patchFetch)({workAsyncStorage:A,workUnitAsyncStorage:C})}async function P(e,t,i){_.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let y="/api/chat/route";y=y.replace(/\/index$/,"")||"/";let w=await _.prepare(e,t,{srcPage:y,multiZoneDraftMode:!1});if(!w)return t.statusCode=400,t.end("Bad Request"),null==i.waitUntil||i.waitUntil.call(i,Promise.resolve()),null;let{buildId:v,params:R,nextConfig:E,parsedUrl:k,isDraftMode:x,prerenderManifest:A,routerServerContext:C,isOnDemandRevalidate:$,revalidateOnlyGenerated:T,resolvedPathname:P,clientReferenceManifest:N,serverActionsManifest:O}=w,S=(0,o.normalizeAppPath)(y),I=!!(A.dynamicRoutes[S]||A.routes[P]),U=async()=>((null==C?void 0:C.render404)?await C.render404(e,t,k,!1):t.end("This page could not be found"),null);if(I&&!x){let e=!!A.routes[P],t=A.dynamicRoutes[S];if(t&&!1===t.fallback&&!e){if(E.experimental.adapterPath)return await U();throw new f.NoFallbackError}}let H=null;!I||_.isDev||x||(H="/index"===(H=P)?"/":H);let D=!0===_.isDev||!I,K=I&&!D;O&&N&&(0,r.setManifestsSingleton)({page:y,clientReferenceManifest:N,serverActionsManifest:O});let q=e.method||"GET",j=(0,s.getTracer)(),W=j.getActiveScopeSpan(),B={params:R,prerenderManifest:A,renderOpts:{experimental:{authInterrupts:!!E.experimental.authInterrupts},cacheComponents:!!E.cacheComponents,supportsDynamicResponse:D,incrementalCache:(0,a.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:E.cacheLife,waitUntil:i.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,n,i,a)=>_.onRequestError(e,t,i,a,C)},sharedContext:{buildId:v}},Y=new l.NodeNextRequest(e),F=new l.NodeNextResponse(t),G=c.NextRequestAdapter.fromNodeNextRequest(Y,(0,c.signalFromNodeResponse)(t));try{let r=async e=>_.handle(G,B).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let n=j.getRootSpanAttributes();if(!n)return;if(n.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${n.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let i=n.get("next.route");if(i){let t=`${q} ${i}`;e.setAttributes({"next.route":i,"http.route":i,"next.span_name":t}),e.updateName(t)}else e.updateName(`${q} ${y}`)}),o=!!(0,a.getRequestMeta)(e,"minimalMode"),l=async a=>{var s,l;let c=async({previousCacheEntry:n})=>{try{if(!o&&$&&T&&!n)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await r(a);e.fetchMetrics=B.renderOpts.fetchMetrics;let l=B.renderOpts.pendingWaitUntil;l&&i.waitUntil&&(i.waitUntil(l),l=void 0);let c=B.renderOpts.collectedTags;if(!I)return await (0,p.sendResponse)(Y,F,s,B.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(s.headers);c&&(t[g.NEXT_CACHE_TAGS_HEADER]=c),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let n=void 0!==B.renderOpts.collectedRevalidate&&!(B.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&B.renderOpts.collectedRevalidate,i=void 0===B.renderOpts.collectedExpire||B.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:B.renderOpts.collectedExpire;return{value:{kind:b.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:n,expire:i}}}}catch(t){throw(null==n?void 0:n.isStale)&&await _.onRequestError(e,t,{routerKind:"App Router",routePath:y,routeType:"route",revalidateReason:(0,d.getRevalidateReason)({isStaticGeneration:K,isOnDemandRevalidate:$})},!1,C),t}},u=await _.handleResponse({req:e,nextConfig:E,cacheKey:H,routeKind:n.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:$,revalidateOnlyGenerated:T,responseGenerator:c,waitUntil:i.waitUntil,isMinimalMode:o});if(!I)return null;if((null==u||null==(s=u.value)?void 0:s.kind)!==b.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(l=u.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",$?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),x&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,h.fromNodeOutgoingHttpHeaders)(u.value.headers);return o&&I||f.delete(g.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,m.getCacheControlHeader)(u.cacheControl)),await (0,p.sendResponse)(Y,F,new Response(u.value.body,{headers:f,status:u.value.status||200})),null};W?await l(W):await j.withPropagatedContext(e.headers,()=>j.trace(u.BaseServerSpan.handleRequest,{spanName:`${q} ${y}`,kind:s.SpanKind.SERVER,attributes:{"http.method":q,"http.target":e.url}},l))}catch(t){if(t instanceof f.NoFallbackError||await _.onRequestError(e,t,{routerKind:"App Router",routePath:S,routeType:"route",revalidateReason:(0,d.getRevalidateReason)({isStaticGeneration:K,isOnDemandRevalidate:$})},!1,C),I)throw t;return await (0,p.sendResponse)(Y,F,new Response(null,{status:500})),null}}e.s(["handler",()=>P,"patchFetch",()=>T,"routeModule",()=>_,"serverHooks",()=>$,"workAsyncStorage",()=>A,"workUnitAsyncStorage",()=>C],15017)}];

//# sourceMappingURL=1629d_next_dist_esm_build_templates_app-route_43671dbc.js.map