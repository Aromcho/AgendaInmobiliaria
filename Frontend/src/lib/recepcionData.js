/* Datos de Recepción de Propiedades -> equipo, estados y pasos. Los items se cargan desde el backend. */
export const RECEP = {
  TEAM: [{"name":"Cecilia","color":"#7257c9","init":"C"},{"name":"Paul","color":"#0e8a8a","init":"P"},{"name":"Fabiana","color":"#c2861a","init":"F"},{"name":"Pablo","color":"#2563eb","init":"P"},{"name":"Valentin","color":"#15784f","init":"V"}],
  STATUS: {
    negro:   { key:"negro",   label:"Todo OK",          desc:"Lista para vender",        color:"#1f2a24", bg:"#e8ebe9", dot:"#1f2a24" },
    rojo:    { key:"rojo",    label:"Algo falta",        desc:"Faltan pasos por cerrar",  color:"#d8504a", bg:"#fbe9e8", dot:"#d8504a" },
    celeste: { key:"celeste", label:"Venta sin confirmar", desc:"El dueño no confirmó",    color:"#2389c4", bg:"#e4f2fa", dot:"#2389c4" },
    pausa:   { key:"pausa",   label:"En pausa",          desc:"Suspendida / en espera",   color:"#8a978f", bg:"#eef1ef", dot:"#8a978f" },
  },
  STEPS: [
    { key:"tasacion",     label:"Tasación",     short:"Tasac." },
    { key:"autorizacion", label:"Autorización", short:"Autoriz." },
    { key:"cartel",       label:"Cartel",       short:"Cartel" },
    { key:"fotos",        label:"Fotos",        short:"Fotos" },
    { key:"descripcion",  label:"Descripción",  short:"Descrip." },
  ],
};
