import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let role = 'user'

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = profile?.role || 'user'
  }

  const isAdmin = role === 'admin' || role === 'super_admin'

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1>Bisonworkz CRM</h1>
        <p>Project Management &amp; Financial Tracking</p>
        <div className={styles.actions}>
          {user ? (
            <>
              <a href="/boards" className="btn btn-primary">Go to Boards</a>

              {isAdmin && (
                <a href="/dashboard" className="btn btn-outline">Financial Dashboard</a>
              )}

              {isAdmin && (
                <a href="/admin" className="btn btn-outline">Admin Panel</a>
              )}

              <a href="/profile" className="btn btn-ghost">Profile</a>
            </>
          ) : (
            <>
              <a href="/login" className="btn btn-primary">Login</a>
              <a href="/signup" className="btn btn-outline">Sign Up</a>
            </>
          )}
        </div>
        {user && (
          <p className={styles.userInfo}>
            Logged in as {user.email} <span>({role.replace('_', ' ')})</span>
          </p>
        )}
      </div>
    </main>
  );
}
