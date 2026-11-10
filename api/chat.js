export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Doar cereri POST sunt permise' });

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { body = {}; }
        }

        const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
        const userMessages = rawMessages.filter(m => m && m.role && m.content);

        const currentMenu = body.currentMenu || "Pachetele noastre nu sunt momentan disponibile.";

        let apiKey = (process.env.OPENROUTER_API_KEY || "").trim().split(/\s+/)[0];
        if (!apiKey) {
            return res.status(200).json({ reply: "Cheia OPENROUTER_API_KEY lipsește din setările Vercel." });
        }

        const systemPrompt = {
            role: "system",
            content: `Ești consultantul tehnic și de vânzări al agenției de dezvoltare web NEXORA. 
Răspunzi extrem de politicos, profesionist, prietenos și concis în limba română.

INTERDICȚII STRICTE DE FORMAT:
- NU folosi niciodată caractere Markdown: fără steluțe (** sau *), fără diez (#), fără ghilimele speciale. Scrie doar text simplu și curat.
- NU face liste lungi inutile. Fii scurt, ca într-o discuție pe chat.

SERVICIILE ȘI PREȚURILE NOASTRE (PACHETE WEB):
${currentMenu}

SCOPUL TĂU (GENERARE DE LEAD-URI):
1. Când vizitatorul întreabă ce faceți, explică-i scurt că NEXORA construiește platforme web ultra-rapide și magazine online care generează vânzări.
2. Dacă te întreabă de prețuri, prezintă-i scurt opțiunile din pachetele de mai sus (menționând diferența dintre prețul original și cel redus, dacă există).
3. Cel mai important: Dacă vizitatorul pare interesat, îndrumă-l să apese butonul albastru 'Cere Ofertă' din colțul dreapta-sus al ecranului sau să apese direct pe butonul 'Alege Pachetul' de sub serviciul dorit. Spune-i că acolo va completa un scurt brief și va fi sunat în maxim 24h de un expert uman din echipa noastră pentru consultanță gratuită.

Nu mai există comenzi ascunse sau coș de cumpărături. Trebuie doar să-i răspunzi la întrebări și să-l inviți să completeze formularul de ofertă.`
        };

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://nexora.ro",
                "X-Title": "Nexora Consultant"
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash:free",
                messages: [systemPrompt, ...userMessages],
                temperature: 0.3
            })
        });

        const data = await response.json();
        
        if (!response.ok || data.error) {
            return res.status(200).json({ reply: `Eroare AI: ${data.error?.message || "Serviciul este temporar indisponibil. Te rog folosește formularul de contact."}` });
        }

        let rawReply = data.choices?.[0]?.message?.content || "Nu am putut genera un răspuns. Apasă butonul Cere Ofertă.";

        // Curățare forțată Markdown
        const cleanReply = rawReply
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/#{1,6}\s?/g, '')
            .replace(/`/g, '');

        return res.status(200).json({ reply: cleanReply });

    } catch (error) {
        return res.status(200).json({ reply: `Eroare de sistem. Te rugăm să apesezi pe butonul 'Cere Ofertă'.` });
    }
}
