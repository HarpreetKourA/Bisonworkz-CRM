import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1>Bisonworkz CRM</h1>
        <p>Project Management & Financial Tracking</p>
        <div className={styles.actions}>
          {user ? (
            <>
              <a href="/boards" className="btn btn-primary">Go to Boards</a>
              <a href="/profile" className="btn btn-outline">Profile</a>
            </>
          ) : (
            <>
              <a href="/login" className="btn btn-primary">Login</a>
              <a href="/signup" className="btn">Sign Up</a>
            </>
          )}
        </div>
        {user && (
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Logged in as {user.email}
          </p>
        )}
      </div>
    </main>
  );
}

