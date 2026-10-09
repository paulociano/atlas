'use client';
import {useState} from 'react';
export default function DocumentsPanel(){const [selected,setSelected]=useState('');return <section className="panel"><h2>Documentos</h2><input type="file" aria-label="Arquivo para importar" onChange={e=>setSelected(e.target.files?.[0]?.name||'')}/><p>{selected}</p></section>}
