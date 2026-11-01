import {env} from 'cloudflare:workers';
import html from '../../web/owner.html?raw';
import {requireOwner} from '../../server/api';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{await requireOwner(request,env);return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}catch(error){const status=(error as {status?:number}).status||503;if(status===401)return Response.redirect(new URL('/signin-with-chatgpt?return_to=%2Fowner',request.url),302);return new Response(status===403?'This page is available to the site owner.':'The owner workspace is being prepared. Please try again shortly.',{status,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});}}
