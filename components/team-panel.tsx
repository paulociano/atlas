'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';
type Member={user_id:string;role:string};
export default function TeamPanel({workspaceId,role,userId}:{workspaceId:string;role:string;userId:string}){
 const [members,setMembers]=useState<Member[]>([]);
 const [targetRole,setTargetRole]=useState('editor');
 const [invite,setInvite]=useState('');
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);
 useEffect(()=>{if(!supabase||!workspaceId)return;supabase.from('memberships').select('user_id,role').eq('workspace_id',workspaceId).then(({data,error})=>{if(error)setNotice(error.message);else setMembers(data||[])})},[workspaceId]);
 async function create(){if(!supabase)return;setBusy(true);setNotice('');const {data,error}=await supabase.rpc('create_invite',{target_workspace:workspaceId,target_role:targetRole});if(error)setNotice(error.message);else if(data)setInvite(location.origin+'/atlas/?invite='+data);setBusy(false)}
 return <div><div className="page-heading"><div><div className="eyebrow">GOVERNANÇA</div><h1>Equipe e acessos</h1><p>Convites com expiração e controle de permissões.</p></div></div>
 <section className="panel attendance-form"><h3>Colaboradores ({members.length})</h3>{members.map(m=><div key={m.user_id} className="task"><span>{m.user_id===userId?'Sua conta':m.user_id.slice(0,8)+'...'}</span><small>{m.role}</small></div>)}</section>
 {['owner','admin'].includes(role)&&<section className="panel attendance-form"><h3>Criar convite</h3><p className="muted">O convite é válido por sete dias e pode ser usado uma vez. Envie apenas em canal privado.</p><div className="inline"><select value={targetRole} onChange={e=>setTargetRole(e.target.value)}><option value="admin">Administrador</option><option value="editor">Editor</option><option value="viewer">Leitor</option></select><button className="primary" disabled={busy} onClick={create}>Gerar convite</button></div>{invite&&<p><input aria-label="Link de convite" readOnly value={invite} onFocus={e=>e.currentTarget.select()} style={{width:'100%'}}/></p>}</section>}
 {notice&&<p className="error">{notice}</p>}</div>
}