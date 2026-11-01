'use client';

import { useActionState } from 'react';
import { loginAction } from '../actions';

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="adm-form">
      <label>
        E-mail
        <input key={state?.email} name="email" type="email" autoComplete="username" defaultValue={state?.email} required />
      </label>
      <label>
        Senha
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state?.error && (
        <p className="adm-alert adm-alert--error" role="alert">
          {state.error}
        </p>
      )}
      <button className="adm-btn adm-btn--primary" disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
