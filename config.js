// Toggle to include test extras (HTML pages prefixed with 'extra-')
// TODO toggle this off
const INCLUDE_EXTRAS = false;

// Helper: parse YYYY-MM-DD as local
function parseLocalISO(iso){
  const [y,m,d]=iso.split('-').map(Number);
  return new Date(y,m-1,d);
}
function isSunday(d){ return d.getDay()===0; }
function isoOf(d){ return d.toISOString().slice(0,10); }
function nextSunday(d=new Date()){
  const n = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = ((7 - n.getDay()) % 7) || 7;
  n.setDate(n.getDate() + days);
  return n;
}
