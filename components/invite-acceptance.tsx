'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';
export default function InviteAcceptance(){
 const [token,setToken]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{setToken(new URLSearchParams(location.search).get('invite')||'')},[]);
 if(!token)return null;
 async function accept(){if(!supabase)return;setBusy(true);const {error}=await supabase.rpc('accept_invite',{raw_token:token});if(error){setError(error.message);setBusy(false)}else{location.assign('/atlas/')}}
 return <div className="panel attendance-form"><h3>Convite para participar</h3><p>Um administrador convidou você para um workspace. Ao aceitar, suas permissões serão associadas à sua conta.</p><button className="primary" onClick={accept} disabled={busy}>Aceitar convite</button>{error&&<p className="error">{error}</p>}</div>
}