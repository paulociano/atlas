export type Example={title:string;area:string;description:string;rows:{date:string;person:string;status:string;counts:string;note:string}[]};
export const recordExamples:Example[]=[
 {title:'Treinamento extra',area:'Treinamentos',description:'Instrutor e participantes são contabilizados. Treinamento extra não substitui automaticamente uma falta obrigatória sem regra formal de abono.',rows:[
 {date:'25/09/2026',person:'Participante A',status:'Presente',counts:'Sim',note:'Treinamento extra, presença confirmada'},
 {date:'25/09/2026',person:'Instrutor B',status:'Presente',counts:'Sim',note:'Instrutor também constou na lista'}]},
 {title:'Office Meeting',area:'Reuniões',description:'Diferenciar presença efetiva, atraso, presença sem participação e ausência justificada.',rows:[
 {date:'28/09/2026',person:'Participante C',status:'Presente',counts:'Sim',note:'Participação efetiva'},
 {date:'28/09/2026',person:'Participante D',status:'Atrasado',counts:'Parcial',note:'Não equivale automaticamente à presença integral'},
 {date:'28/09/2026',person:'Participante E',status:'Sem participação efetiva',counts:'Não',note:'Esteve no local, mas não participou'},
 {date:'28/09/2026',person:'Participante F',status:'Ausente justificado',counts:'Não',note:'Motivo privado, não exposto em relatórios gerais'}]},
 {title:'Tel Party',area:'Rituais',description:'Evitar contagem dupla e revisar identidades abreviadas antes de consolidar frequência.',rows:[
 {date:'06/10/2026',person:'Participante G',status:'Presente',counts:'Sim',note:'Registro validado'},
 {date:'06/10/2026',person:'Participante G',status:'Duplicado',counts:'Não',note:'Segunda ocorrência na mesma data, não somar'},
 {date:'08/10/2026',person:'Participante H',status:'Presente',counts:'Sim',note:'Nome abreviado requer conciliação com perfil'}]}
];
