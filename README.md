# ThinkSafety Admin

Single-page admin console for the ThinkSafety app. Deployed as a static page on GitHub Pages.

## What it does

Manage training modules, lessons and quiz questions; the PPE catalogue and categories; worker
stories and module rewards; every UI string in both English and Swahili; platform settings;
registered workers; orders; Lipa Namba payments; and lesson comments.

## Security

There is no secret in this file. It ships the Supabase **publishable** key, which is designed to be
public, and every table is protected by Row Level Security in the database:

- Anyone may read published content. That is what the phone app does.
- Writing anything, and reading workers, orders or payments, requires a row in `thinksafety_admins`.
- Signing in with a non-admin account grants nothing, and this page signs it straight back out.

**Never put a `service_role` key in this file.** It bypasses Row Level Security, and on a public
page it would hand the entire database to anyone who views source.

## Creating the first administrator

1. In the Supabase dashboard, open **Authentication -> Users** and create a user with an email and
   password.
2. Copy that user's UUID.
3. In the **SQL Editor**, run:

   ```sql
   insert into thinksafety_admins (user_id, email)
   values ('PASTE-THE-UUID', 'you@example.com');
   ```

4. Log in here with that email and password.

## Deploying

Push this folder to a GitHub repository, then in **Settings -> Pages** choose the branch and the
root folder. The page is live a minute later. Workers never see this URL; it is not linked from
the app.
