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

  // Identificare automată a tipului de formular
  const tip = body.tip || (body.industrie || body.obiectiv ? 'quiz_funnel' : ((body.pachet || body.packageInterested || body.detalii) ? 'modal_comanda' : (body.email ? 'audit_footer' : 'general')));
  
  const nume = body.nume || body.customerName || body.name || 'Nespecificat';
  const telefon = body.telefon || body.customerContact || (body.contact && !body.contact.includes('@') ? body.contact : '');
  const email = body.email || body.customerEmail || (body.contact && body.contact.includes('@') ? body.contact : '') || body.extra?.email || '';
  const pachet = body.pachet || body.packageInterested || body.extra?.pachet || '';
  const detalii = body.detalii || body.projectDescription || '';
  const industrie = body.industrie || body.extra?.industrie || '';
  const obiectiv = body.obiectiv || body.extra?.obiectiv || '';
  const functionalitati = body.functionalitati || body.extra?.functionalitati || [];

  // Formatare număr pentru WhatsApp internațional (fără a strica prefixele străine)
  const doarCifre = telefon.replace(/\D/g, '');
  let linkWhatsApp = '';
  if (doarCifre.length >= 8) {
    let nrFormatat = doarCifre;
    if (doarCifre.startsWith('0') && doarCifre.length === 10) {
      nrFormatat = '4' + doarCifre; // Număr standard România: 07xxxxxxxx -> 407xxxxxxxx
    } else if (doarCifre.startsWith('00')) {
      nrFormatat = doarCifre.substring(2); // Eliminare prefix apel internațional 00
    }
    linkWhatsApp = `\n💬 <b>WhatsApp direct:</b> <a href="https://wa.me/${nrFormatat}">Deschide conversația</a>`;
  }

  let titlu = '';
  let corpMesaj = '';

  if (tip === 'modal_comanda') {
    titlu = `🚨 <b>COMANDĂ / CERERE OFERTĂ NOUĂ</b>`;
    corpMesaj = `📌 <b>Pachet / Serviciu:</b> ${pachet || 'Consultanță Generală'}\n` +
                `👤 <b>Nume:</b> ${nume}\n` +
                `📞 <b>Telefon:</b> ${telefon || '-'}${linkWhatsApp}\n` +
                `✉️ <b>E-mail:</b> ${email || '-'}\n` +
                `📝 <b>Detalii cerințe:</b>\n<i>${detalii || 'Fără detalii introduse'}</i>`;
  } else if (tip === 'audit_footer') {
    titlu = `🔍 <b>SOLICITARE AUDIT GRATUIT (FOOTER)</b>`;
    corpMesaj = `👤 <b>Companie / Nume:</b> ${nume}\n` +
                `✉️ <b>E-mail:</b> ${email || telefon || 'Nespecificat'}\n` +
                `📄 <b>Tip:</b> Solicitare raport viteză & conversii`;
  } else if (tip === 'quiz_funnel') {
    const functText = functionalitati && functionalitati.length ? functionalitati.join(', ') : 'Niciuna selectată';
    titlu = `🎯 <b>LEAD NOU DIN QUIZ (60 SEC)</b>`;
    corpMesaj = `👤 <b>Nume:</b> ${nume}\n` +
                `📞 <b>Telefon:</b> ${telefon || '-'}${linkWhatsApp}\n` +
                `✉️ <b>E-mail:</b> ${email || '-'}\n` +
                `🏢 <b>Domeniu:</b> ${industrie || 'Nespecificat'}\n` +
                `🎯 <b>Obiectiv:</b> ${obiectiv || 'Nespecificat'}\n` +
                `⚙️ <b>Module bifate:</b> ${functText}`;
  } else {
    titlu = `📬 <b>MESAJ NOU SITE</b>`;
    corpMesaj = `👤 <b>Nume:</b> ${nume}\n` +
                `📞 <b>Telefon:</b> ${telefon || '-'}${linkWhatsApp}\n` +
                `✉️ <b>E-mail:</b> ${email || '-'}\n` +
                `📝 <b>Mesaj:</b> ${detalii || '-'}`;
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
