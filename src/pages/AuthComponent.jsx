import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabaseClient'

function AuthComponent() {
  return (
    <div className="auth-container">
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google', 'github']} // Add the providers you want to support
        theme="dark" // or 'light'
      />
    </div>
  )
}

export default AuthComponent