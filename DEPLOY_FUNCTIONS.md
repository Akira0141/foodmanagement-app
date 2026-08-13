Deploying the assign-emoji Supabase Edge Function

Overview
- Function path: supabase/functions/assign-emoji
- Purpose: given { id, name } it writes a suitable emoji into the items table for row id.
- Features: local keyword mapping fallback; optional OpenAI-based emoji suggestion if OPENAI_API_KEY is set.
- The function requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to update the database.
- The function handles CORS (OPTIONS) so it can be called directly from the browser.

Two deployment methods: Supabase Dashboard (UI) or Supabase CLI

1) Dashboard (recommended if you prefer GUI)
- Go to your Supabase project > Functions
- Create a new Function named `assign-emoji` and upload the contents of supabase/functions/assign-emoji
- In the Function settings (Environment variables / Secrets) add:
  - SUPABASE_URL = <your project URL, e.g. https://your-project.supabase.co>
  - SUPABASE_SERVICE_ROLE_KEY = <your project service_role key (from Settings → API)>
  - (optional) OPENAI_API_KEY = <your OpenAI API key> — when present the function will call OpenAI to pick a single emoji
- Deploy the function
- Note the Functions URL (e.g. https://<project>.functions.supabase.co)
- In your frontend project .env (local) set VITE_SUPABASE_FUNCTIONS_URL to that Functions URL

2) Supabase CLI
- Install CLI: https://supabase.com/docs/guides/cli
  - npm install -g supabase
- Login: supabase login
- Link to your project (one-time): supabase link --project-ref <project-ref>
- Add secrets (so the function can access service role key & OpenAI key):
  - supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<service_role_key>"
  - (optional) supabase secrets set OPENAI_API_KEY="<openai_key>"
- Deploy the function from the repo root:
  - supabase functions deploy assign-emoji --project-ref <project-ref>
- After deploy, set VITE_SUPABASE_FUNCTIONS_URL in your frontend .env to the functions host

Testing the function
- After deployment, test with curl (replace placeholders):
  curl -X POST "https://<project>.functions.supabase.co/assign-emoji" \
    -H "Content-Type: application/json" \
    -d '{"id":"<item-uuid>","name":"冷凍用鶏肉"}'

- Expected response: { "emoji": "🍗" }
- If OPENAI_API_KEY is set, function will try the LLM first and fall back to local mapping on error.

Notes and security
- The function uses the service_role key to update the items table. Keep that key secret. Prefer setting it as a Supabase secret rather than embedding in repo files.
- CORS is configured to allow '*' by default to make development easy. For production you may want to restrict Access-Control-Allow-Origin to your domains.
- The LLM call is optional and uses OpenAI; usage will consume OpenAI credits.

If you want, I can:
- Deploy it for you if you provide project deployment access and the service role key (not recommended to share secrets here), or
- Walk you through each CLI/dashboard step interactively while you run the commands locally.