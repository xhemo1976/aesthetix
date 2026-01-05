module.exports=[91425,a=>{"use strict";var b=a.i(38735),c=a.i(80159),d=a.i(56511);async function e(){let a=await (0,c.createClient)(),{data:{user:b}}=await a.auth.getUser();if(!b)return{appointments:[],tenant:null,error:"Nicht authentifiziert"};let{data:d}=await a.from("users").select("tenant_id, tenants(name, whatsapp_number)").eq("id",b.id).single();if(!d?.tenant_id)return{appointments:[],tenant:null,error:"Kein Tenant gefunden"};let e=new Date(new Date);e.setDate(e.getDate()+1),e.setHours(0,0,0,0);let f=new Date(e);f.setDate(f.getDate()+1);let{data:g,error:h}=await a.from("appointments").select(`
      id,
      start_time,
      end_time,
      status,
      reminder_sent_at,
      customers (
        id,
        first_name,
        last_name,
        phone,
        email
      ),
      services (
        id,
        name,
        duration_minutes
      ),
      employees (
        first_name,
        last_name
      )
    `).eq("tenant_id",d.tenant_id).in("status",["scheduled","confirmed"]).gte("start_time",e.toISOString()).lt("start_time",f.toISOString()).order("start_time",{ascending:!0});return h?(console.error("Error fetching appointments for reminders:",h),{appointments:[],tenant:null,error:h.message}):{appointments:(g||[]).map(a=>{let b=Array.isArray(a.customers)?a.customers[0]:a.customers,c=Array.isArray(a.services)?a.services[0]:a.services,d=Array.isArray(a.employees)?a.employees[0]:a.employees;return{id:a.id,start_time:a.start_time,end_time:a.end_time,status:a.status,reminder_sent_at:a.reminder_sent_at,customer:b,service:c,employee:d}}),tenant:d.tenants,error:null}}async function f(a,b){let d=await (0,c.createClient)(),{data:{user:e}}=await d.auth.getUser();if(!e)return{appointments:[],tenant:null,error:"Nicht authentifiziert"};let{data:f}=await d.from("users").select("tenant_id, tenants(name, whatsapp_number)").eq("id",e.id).single();if(!f?.tenant_id)return{appointments:[],tenant:null,error:"Kein Tenant gefunden"};let{data:g,error:h}=await d.from("appointments").select(`
      id,
      start_time,
      end_time,
      status,
      reminder_sent_at,
      customers (
        id,
        first_name,
        last_name,
        phone,
        email
      ),
      services (
        id,
        name,
        duration_minutes
      ),
      employees (
        first_name,
        last_name
      )
    `).eq("tenant_id",f.tenant_id).in("status",["scheduled","confirmed"]).gte("start_time",a.toISOString()).lt("start_time",b.toISOString()).order("start_time",{ascending:!0});return h?(console.error("Error fetching appointments:",h),{appointments:[],tenant:null,error:h.message}):{appointments:(g||[]).map(a=>{let b=Array.isArray(a.customers)?a.customers[0]:a.customers,c=Array.isArray(a.services)?a.services[0]:a.services,d=Array.isArray(a.employees)?a.employees[0]:a.employees;return{id:a.id,start_time:a.start_time,end_time:a.end_time,status:a.status,reminder_sent_at:a.reminder_sent_at,customer:b,service:c,employee:d}}),tenant:f.tenants,error:null}}async function g(a){let b=await (0,c.createClient)(),{error:e}=await b.from("appointments").update({reminder_sent_at:new Date().toISOString()}).eq("id",a);return e?(console.error("Error marking reminder as sent:",e),{success:!1,error:e.message}):((0,d.revalidatePath)("/dashboard/reminders"),{success:!0,error:null})}async function h(a){let b=await (0,c.createClient)(),{error:e}=await b.from("appointments").update({reminder_sent_at:null}).eq("id",a);return e?(console.error("Error resetting reminder status:",e),{success:!1,error:e.message}):((0,d.revalidatePath)("/dashboard/reminders"),{success:!0,error:null})}(0,a.i(98246).ensureServerEntryExports)([e,f,g,h]),(0,b.registerServerReference)(e,"00bebf577dc65e572ab36782e986e4b2ef68bb217c",null),(0,b.registerServerReference)(f,"60c55c83feabba07200565570d40e535845c54067f",null),(0,b.registerServerReference)(g,"40fac9818d250a2754794c3fb55beaf18ccf7085a0",null),(0,b.registerServerReference)(h,"407a1e933d7f007ae1a21a263462f272ea6055ee79",null),a.s(["getAppointmentsByDateRange",()=>f,"getAppointmentsForReminders",()=>e,"markReminderSent",()=>g,"resetReminderStatus",()=>h])},16265,a=>{"use strict";var b=a.i(76392),c=a.i(91425);a.s([],62346),a.i(62346),a.s(["00bebf577dc65e572ab36782e986e4b2ef68bb217c",()=>c.getAppointmentsForReminders,"00ea5d6db9aa78d155ad7148c00d987a78197cad0e",()=>b.logout,"40557600bffd5a2c9eccc9fb8b66b41ea0de68fa87",()=>b.login,"407a1e933d7f007ae1a21a263462f272ea6055ee79",()=>c.resetReminderStatus,"40edf544285d63aedbf98dd3fd472b99b616040b0a",()=>b.signup,"40fac9818d250a2754794c3fb55beaf18ccf7085a0",()=>c.markReminderSent,"60c55c83feabba07200565570d40e535845c54067f",()=>c.getAppointmentsByDateRange],16265)}];

//# sourceMappingURL=apps_web_0f00c2be._.js.map