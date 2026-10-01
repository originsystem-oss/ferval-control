const SW_VERSION='IAYO-PUSH-0.1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
  let data={title:'FERVAL CONTROL',body:'Tienes un aviso de Dirección.',url:'/'};
  try{data={...data,...event.data.json()}}catch{}
  const badgeCount=Number.isFinite(Number(data.badge))?Math.max(0,Number(data.badge)):1;
  const jobs=[];
  if('setAppBadge' in self.navigator) jobs.push(badgeCount>0?self.navigator.setAppBadge(badgeCount):self.navigator.clearAppBadge());
  jobs.push(self.registration.showNotification(data.title,{
    body:data.body,
    icon:'/icon-192.png?v=2.2',
    badge:'/icon-192.png?v=2.2',
    tag:data.tag||('ferval-direction-'+Date.now()),
    renotify:true,
    requireInteraction:data.priority==='urgent',
    silent:false,
    vibrate:data.priority==='urgent'?[300,120,300,120,500]:[180],
    data:{url:data.url||'/',iayo:true}
  }));
  event.waitUntil(Promise.all(jobs));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=event.notification.data?.url||'/';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){if('focus'in c){c.navigate(url);return c.focus()}}
    if(clients.openWindow)return clients.openWindow(url);
  }));
});