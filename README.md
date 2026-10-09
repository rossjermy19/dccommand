# DC Command Centre ⚡
> Executive Deal Radar & Intelligence Command Centre for **Despatch Cloud**

Built for Ross Jermy to maintain complete control and momentum over Despatch Cloud sales deals in minimum time.

---

## 🚀 Key Features

1. **Live HubSpot Synchronization**
   - Direct connection to HubSpot CRM via modern **Service Key**.
   - Filters exclusively for your active deals (Owner ID: `75550922`).
   - Real-time pipeline value calculation (£) and stage breakdown.

2. **Action Radar & Ghosting Prevention**
   - Automatically detects deals that haven't had communication logged in $> 7$ days.
   - Highlights deals where meetings were held and follow-up deliverables are pending.

3. **Call & Meeting Intelligence (Fireflies / Transcripts)**
   - Paste meeting transcripts or notes directly into the Command Centre.
   - Automatically extracts:
     - **Deliverables promised by Ross** (e.g. quote, technical details).
     - **Client commitments & next steps**.
     - **Key Despatch Cloud solution fit points** (WMS, Voila, Carrier integrations).
     - **Client objections & hesitations**.
     - **Urgency score (1-100)** and deal health rating.
   - **1-Click Log to HubSpot**: Automatically attaches the full AI recap and action items to the Deal timeline in HubSpot.
   - **1-Click Pre-drafted Follow-up Email**: Instant email tailored to the nuances of the conversation ready to paste into Outlook or HubSpot.

4. **1-Click Quick Follow-up Drafter**
   - Instantly generates context-aware follow-up emails for any deal on your radar.

---

## 🛠️ Deploying to Railway

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Scaffold DC Command Centre with live HubSpot radar & AI transcript intelligence"
   git push origin main
   ```
2. Open **[Railway.app](https://railway.app)**.
3. Click **New Project** → **Deploy from GitHub repo**.
4. Select `rossjermy19/dccommand`.
5. Under **Variables**, add:
   - `HUBSPOT_ACCESS_TOKEN` = `your_pat_service_key`
   - `HUBSPOT_OWNER_ID` = `75550922`
   - *(Optional)* `GEMINI_API_KEY` = `your_gemini_api_key`
   - *(Optional)* `OPENAI_API_KEY` = `your_openai_api_key`
6. Railway will automatically build and deploy the Next.js app!

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view your Command Centre.
