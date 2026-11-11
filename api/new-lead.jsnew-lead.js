import admin from 'firebase-admin';

// Inițializăm Firebase Admin doar dacă nu este deja pornit
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Folosim .replace pentru a citi corect cheia privată (newline-uri) din Vercel
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // Permitem doar cereri de tip POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda nu este permisă. Folosește POST.' });
  }

  try {
    // Dacă datele vin ca string (text), le transformăm în obiect JSON
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Extragem datele pe care le vom trimite din Quiz Funnel (frontend)
    const { industrie, obiectiv, functionalitati, pachet, nume, telefon } = data;

    // Validare de siguranță: vrem să ne asigurăm că clientul a lăsat măcar un telefon
    if (!telefon || !nume) {
      return res.status(400).json({ error: 'Numele și numărul de telefon sunt obligatorii!' });
    }

    // Construim obiectul pe care îl salvăm în baza de date
    const noulLead = {
      nume: nume,
      telefon: telefon,
      industrie: industrie || 'Nespecificat',
      obiectiv: obiectiv || 'Nespecificat',
      functionalitati: functionalitati || [], // Acesta va fi un array (ex: ['AI', 'WhatsApp'])
      pachet: pachet || 'Nespecificat',
      status: 'Nou', // Status util pentru CRM-ul vostru (Nou, Contactat, Semnat)
      dataCreare: admin.firestore.FieldValue.serverTimestamp() // Pune ora și data automată
    };

    // Salvăm obiectul în colecția "leads" din Firestore
    const docRef = await db.collection('leads').add(noulLead);

    // Răspundem către frontend că totul a fost un succes
    return res.status(200).json({ 
      success: true, 
      message: 'Lead-ul a fost salvat cu succes!', 
      id: docRef.id 
    });

  } catch (error) {
    console.error('Eroare critică la salvarea lead-ului:', error);
    return res.status(500).json({ error: 'Eroare internă. Nu am putut salva lead-ul.' });
  }
}
