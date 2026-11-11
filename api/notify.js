export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Doar cereri POST permise' });
  }

  const { nume, telefon, industrie, obiectiv, functionalitati } = req.body || {};

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ error: 'Configurare Telegram lipsă în Vercel.' });
  }

  const functText = functionalitati && functionalitati.length 
    ? functionalitati.join(', ') 
    : 'Niciuna selectată';

  const text = `🚀 <b>LEAD NOU NEXORA!</b>\n\n` +
               `👤 <b>Nume:</b> ${nume || 'Nespecificat'}\n` +
               `📞 <b>Telefon:</b> ${telefon || 'Nespecificat'}\n` +
               `🏢 <b>Domeniu:</b> ${industrie || 'Nespecificat'}\n` +
               `🎯 <b>Obiectiv:</b> ${obiectiv || 'Nespecificat'}\n` +
               `⚙️ <b>Module dorite:</b> ${functText}\n\n` +
               `⏰ <i>Trimis acum de pe site</i>`;

  try {
    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('Eroare Telegram API:', result);
      return res.status(500).json({ error: 'Telegram a respins mesajul' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Eroare trimitere notificare:', error);
    return res.status(500).json({ error: 'Eroare internă server' });
  }
}
