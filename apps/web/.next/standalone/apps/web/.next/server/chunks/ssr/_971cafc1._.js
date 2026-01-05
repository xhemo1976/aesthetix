module.exports=[83589,(a,b,c)=>{"use strict";b.exports=a.r(96135).vendored["react-ssr"].ReactDOM},49453,a=>{"use strict";let b=(0,a.i(72873).default)("user",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);a.s(["User",()=>b],49453)},93094,a=>{"use strict";let b=(0,a.i(72873).default)("square-pen",[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",key:"ohrbg2"}]]);a.s(["Edit",()=>b],93094)},52461,a=>{"use strict";let b=(0,a.i(72873).default)("message-circle",[["path",{d:"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",key:"1sd12s"}]]);a.s(["MessageCircle",()=>b],52461)},78189,a=>{"use strict";let b=(0,a.i(72873).default)("phone",[["path",{d:"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",key:"9njp5v"}]]);a.s(["Phone",()=>b],78189)},57178,a=>{"use strict";let b=(0,a.i(72873).default)("mail",[["path",{d:"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",key:"132q7q"}],["rect",{x:"2",y:"4",width:"20",height:"16",rx:"2",key:"izxlao"}]]);a.s(["Mail",()=>b],57178)},10668,a=>{"use strict";let b=(0,a.i(72873).default)("circle-alert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);a.s(["AlertCircle",()=>b],10668)},21798,2231,a=>{"use strict";let b=(0,a.i(72873).default)("clock",[["path",{d:"M12 6v6l4 2",key:"mmk7yg"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]]);a.s(["default",()=>b],2231),a.s(["Clock",()=>b],21798)},99756,a=>{"use strict";let b=(0,a.i(72873).default)("calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]);a.s(["Calendar",()=>b],99756)},65905,a=>{"use strict";let b=(0,a.i(72873).default)("circle-check-big",[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);a.s(["CheckCircle",()=>b],65905)},57651,a=>{"use strict";let b=(0,a.i(72873).default)("circle-x",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]]);a.s(["XCircle",()=>b],57651)},17617,a=>{"use strict";function b(a,b){let c=a.replace(/[\s\-\(\)]/g,""),d=encodeURIComponent(b);return`https://wa.me/${c}?text=${d}`}function c(a){return`Hallo ${a.customerName}! 👋

Dies ist eine Erinnerung an Ihren Termin bei ${a.clinicName}:

📅 Datum: ${a.date}
🕐 Uhrzeit: ${a.time}
💆 Behandlung: ${a.serviceName}

Wir freuen uns auf Sie!

Bei Fragen oder Termin\xe4nderungen melden Sie sich gerne.`}function d(a,d,e,f,g,h){return b(a,c({customerName:d,date:e,time:f,serviceName:g,clinicName:h}))}function e(a,c,d,e,f,g,h){var i;let j;return b(a,(i={customerName:c,date:d,time:e,serviceName:f,clinicName:g,confirmationUrl:h},j=`Hallo ${i.customerName}! 👋

Termin-Best\xe4tigung bei ${i.clinicName}:

📅 Datum: ${i.date}
🕐 Uhrzeit: ${i.time}
💆 Behandlung: ${i.serviceName}`,i.confirmationUrl?`${j}

🔗 Bitte best\xe4tigen Sie Ihren Termin:
${i.confirmationUrl}

Wir freuen uns auf Sie!`:`${j}

Bis bald!`))}function f(a,c,d){var e;return b(a,(e={customerName:c,clinicName:d},`Hallo ${e.customerName}! 👋

Hier ist ${e.clinicName}. `))}a.s(["generateWhatsAppLink",()=>b,"getAppointmentConfirmationLink",()=>e,"getAppointmentReminderLink",()=>d,"getAppointmentReminderMessage",()=>c,"getCustomerContactLink",()=>f])},41444,a=>{"use strict";let b=(0,a.i(72873).default)("euro",[["path",{d:"M4 10h12",key:"1y6xl8"}],["path",{d:"M4 14h9",key:"1loblj"}],["path",{d:"M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2",key:"1j6lzo"}]]);a.s(["Euro",()=>b],41444)},40354,a=>{"use strict";let b=(0,a.i(72873).default)("heart",[["path",{d:"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",key:"mvr1a0"}]]);a.s(["Heart",()=>b],40354)}];

//# sourceMappingURL=_971cafc1._.js.map