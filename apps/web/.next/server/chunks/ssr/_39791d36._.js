module.exports=[38735,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"registerServerReference",{enumerable:!0,get:function(){return d.registerServerReference}});let d=a.r(80846)},98246,(a,b,c)=>{"use strict";function d(a){for(let b=0;b<a.length;b++){let c=a[b];if("function"!=typeof c)throw Object.defineProperty(Error(`A "use server" file can only export async functions, found ${typeof c}.
Read more: https://nextjs.org/docs/messages/invalid-use-server-value`),"__NEXT_ERROR_CODE",{value:"E352",enumerable:!1,configurable:!0})}}Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"ensureServerEntryExports",{enumerable:!0,get:function(){return d}})},26197,a=>{"use strict";var b=a.i(38735),c=a.i(80159);async function d(a){let b=await (0,c.createClient)(),{data:d,error:e}=await b.from("appointments").select(`
      *,
      customers (
        id,
        first_name,
        last_name,
        email,
        phone
      ),
      services (
        id,
        name,
        duration_minutes,
        price
      ),
      tenants (
        id,
        name,
        contact_phone,
        whatsapp_number,
        address,
        city
      )
    `).eq("confirmation_token",a).single();return e||!d?{appointment:null,error:"Termin nicht gefunden"}:{appointment:d,error:null}}async function e(a){let b=await (0,c.createClient)(),{error:d}=await b.from("appointments").update({customer_response:"confirmed",customer_confirmed_at:new Date().toISOString(),status:"confirmed"}).eq("confirmation_token",a);return d?(console.error("Error confirming appointment:",d),{error:d.message}):{error:null}}async function f(a){let b=await (0,c.createClient)(),{error:d}=await b.from("appointments").update({customer_response:"declined",customer_confirmed_at:new Date().toISOString(),status:"cancelled"}).eq("confirmation_token",a);return d?(console.error("Error declining appointment:",d),{error:d.message}):{error:null}}(0,a.i(98246).ensureServerEntryExports)([d,e,f]),(0,b.registerServerReference)(d,"405ed57af8f1be0e39d506a4aa7d9df4bd70921d84",null),(0,b.registerServerReference)(e,"406bece9b39f25e297665558c28d8baa2f0cc09046",null),(0,b.registerServerReference)(f,"40eb261c2e18b1fb081917c44364a76046f0478d12",null),a.s(["confirmAppointment",()=>e,"declineAppointment",()=>f,"getAppointmentByToken",()=>d])},99227,a=>{"use strict";var b=a.i(26197);a.s([],45638),a.i(45638),a.s(["405ed57af8f1be0e39d506a4aa7d9df4bd70921d84",()=>b.getAppointmentByToken,"406bece9b39f25e297665558c28d8baa2f0cc09046",()=>b.confirmAppointment,"40eb261c2e18b1fb081917c44364a76046f0478d12",()=>b.declineAppointment],99227)}];

//# sourceMappingURL=_39791d36._.js.map