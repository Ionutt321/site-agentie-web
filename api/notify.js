export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Doar cereri POST permise' });
  }

  const body = req.body || {};
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ error: 'Configurare Telegram lipsă în Vercel.' });
  }

  // Identificare automată a tipului de formular (Quiz, Modal/Pachete sau Audit Footer)
  const tip = body.tip || (body.industrie || body.obiectiv ? 'quiz_funnel' : ((body.pachet || body.packageInterested || body.detalii) ? 'modal_comanda' : (body.email ? 'audit_footer' : 'general')));
  
  const nume = body.nume || body.customerName || body.name || 'Nespecificat';
  const contact = body.contact || body.telefon || body.customerContact || body.email || 'Nespecificat';
  const pachet = body.pachet || body.packageInterested || body.extra?.pachet || '';
  const detalii = body.detalii || body.projectDescription || '';
  const industrie = body.industrie || body.extra?.industrie || '';
  const obiectiv = body.obiectiv || body.extra?.obiectiv || '';
  const functionalitati = body.functionalitati || body.extra?.functionalitati || [];

  // Generare link WhatsApp dacă contactul este un număr de telefon
  const doarCifre = contact.replace(/\D/g, '');
  let linkWhatsApp = '';
  if (doarCifre.length >= 9 && !contact.includes('@')) {
    const nrFormatat = doarCifre.startsWith('0') ? '4' + doarCifre : (doarCifre.startsWith('40') ? doarCifre : '40' + doarCifre);
    linkWhatsApp = `\n💬 <b>WhatsApp:</b> <a href="https://wa.me/${nrFormatat}">Deschide conversația direct</a>`;
  }

  let titlu = '';
  let corpMesaj = '';

  if (tip === 'modal_comanda') {
    titlu = `🚨 <b>COMANDĂ / CERERE OFERTĂ NOUĂ</b>`;
    corpMesaj = `📌 <b>Pachet / Buton:</b> ${pachet || 'Consultanță Generală'}\n` +
                `👤 <b>Nume:</b> ${nume}\n` +
                `📞 <b>Contact:</b> ${contact}${linkWhatsApp}\n` +
                `📝 <b>Detalii cerințe:</b>\n<i>${detalii || 'Fără detalii introduse'}</i>`;
  } else if (tip === 'audit_footer') {
    titlu = `🔍 <b>SOLICITARE AUDIT GRATUIT (FOOTER)</b>`;
    corpMesaj = `👤 <b>Companie / Nume:</b> ${nume}\n` +
                `✉️ <b>Email Contact:</b> ${contact}\n` +
                `📄 <b>Tip:</b> Solicitare raport viteză & conversii`;
  } else {
    const functText = functionalitati && functionalitati.length ? functionalitati.join(', ') : 'Niciuna selectată';
    titlu = `🎯 <b>LEAD NOU DIN QUIZ (60 SEC)</b>`;
    corpMesaj = `👤 <b>Nume:</b> ${nume}\n` +
                `📞 <b>Contact:</b> ${contact}${linkWhatsApp}\n` +
                `🏢 <b>Domeniu:</b> ${industrie || 'Nespecificat'}\n` +
                `🎯 <b>Obiectiv:</b> ${obiectiv || 'Nespecificat'}\n` +
                `⚙️ <b>Module dorite:</b> ${functText}`;
  }

  const textFinal = `${titlu}\n━━━━━━━━━━━━━━━━━━━\n${corpMesaj}\n━━━━━━━━━━━━━━━━━━━\n⏰ <i>Trimis acum de pe nexora.ro</i>`;

  try {
    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: textFinal,
        parse_mode: 'HTML',
        disable_web_page_preview: true
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
