'use client';
import {useState} from 'react';
import {recordExamples} from '../lib/record-examples';
export default function RecordExamples(){
 const [selected,setSelected]=useState(0);
 const example=recordExamples[selected];
 return <section className="panel attendance-form"><h3>Exemplos de registros e regras</h3><p className="muted">Modelos anonimizados inspirados nos registros de liderança. Apenas consulta: não adicionam dados ao workspace.</p>
 <div className="inline"><label htmlFor="example-ritual">Exemplo</label><select id="example-ritual" value={selected} onChange={e=>setSelected(Number(e.target.value))}>{recordExamples.map((x,i)=><option key={x.title} value={i}>{x.title}</option>)}</select></div>
 <p>{example.description}</p><div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left'}}><thead><tr><th>Data</th><th>Pessoa</th><th>Classificação</th><th>Conta?</th><th>Observação</th></tr></thead><tbody>{example.rows.map((r,i)=><tr key={i}><td>{r.date}</td><td>{r.person}</td><td>{r.status}</td><td>{r.counts}</td><td>{r.note}</td></tr>)}</tbody></table></div>
 </section>
}
