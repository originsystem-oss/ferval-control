self.addEventListener('push',event=>{
  let data={title:'FERVAL CONTROL',body:'Tienes un aviso de Dirección.',url:'/'};
  try{data={...data,...event.data.json()}}catch{}
  event.waitUntil(self.registration.showNotification(data.title,{
    body:data.body,
    icon:'/icon-192.png?v=2.2',
    badge:'/icon-192.png?v=2.2',
    tag:data.tag||'ferval-direction',
    renotify:true,
    requireInteraction:data.priority==='urgent',
    vibrate:data.priority==='urgent'?[250,120,250,120,350]:[180],
    data:{url:data.url||'/'}
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=event.notification.data?.url||'/';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){if('focus'in c){c.navigate(url);return c.focus()}}
    if(clients.openWindow)return clients.openWindow(url);
  }));
});